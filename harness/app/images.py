"""Reference-image generation.

The recipe the research settled on: front view first on the fast model, then the other three
views as reference-conditioned edits of the accepted front on the editing-precision model, so
all four views share one subject. Flat lighting, transparent background, alpha preserved.

The images are style reference only. Every measurement lives in the brief, which is why each
package records the generation metadata rather than pretending the views are metric.
"""

from __future__ import annotations

import base64
import json
import os
from pathlib import Path
from typing import Any

import httpx

from .prompt_build import SHOT_RULES, front_prompt, view_prompt

API_ROOT = "https://api.openai.com/v1"
MODEL_FAST = "gpt-image-2.5-flare"
MODEL_EDIT = "gpt-image-2.5-sunburst"
VIEWS = ["front", "left", "back", "right"]

# Image output is billed per token. These are the published-size estimates used only to warn
# before spending; the run records whatever usage the API actually reports.
_TOKENS_BY_QUALITY = {"low": 272, "medium": 1056, "high": 4160, "xhigh": 6240, "max": 8320}
_USD_PER_OUTPUT_TOKEN = 30 / 1_000_000

def api_key() -> str | None:
    return os.environ.get("OPENAI_API_KEY")


def available() -> bool:
    return bool(api_key())


def estimate_cost(count: int, quality: str = "high") -> float:
    tokens = _TOKENS_BY_QUALITY.get(quality, _TOKENS_BY_QUALITY["high"])
    return round(count * tokens * _USD_PER_OUTPUT_TOKEN, 4)


async def _post_json(client: httpx.AsyncClient, path: str, payload: dict[str, Any]) -> dict[str, Any]:
    response = await client.post(
        f"{API_ROOT}{path}",
        headers={"Authorization": f"Bearer {api_key()}", "Content-Type": "application/json"},
        json=payload,
        timeout=300.0,
    )
    return _unwrap(response)


async def _post_multipart(
    client: httpx.AsyncClient, path: str, data: dict[str, Any], image: Path
) -> dict[str, Any]:
    with image.open("rb") as handle:
        response = await client.post(
            f"{API_ROOT}{path}",
            headers={"Authorization": f"Bearer {api_key()}"},
            data=data,
            files={"image": (image.name, handle, "image/png")},
            timeout=300.0,
        )
    return _unwrap(response)


def _unwrap(response: httpx.Response) -> dict[str, Any]:
    try:
        payload = response.json()
    except json.JSONDecodeError:
        raise RuntimeError(f"image API returned {response.status_code}: {response.text[:400]}")
    if response.status_code >= 400 or "error" in payload:
        message = payload.get("error", {}).get("message", response.text[:400])
        raise RuntimeError(f"image API error ({response.status_code}): {message}")
    return payload


def _save(payload: dict[str, Any], target: Path) -> dict[str, Any]:
    item = payload["data"][0]
    target.parent.mkdir(parents=True, exist_ok=True)
    if item.get("b64_json"):
        target.write_bytes(base64.b64decode(item["b64_json"]))
    else:  # pragma: no cover - URL responses are the fallback shape
        raise RuntimeError("image API returned a URL; expected inline base64")
    return payload.get("usage", {})


async def generate_views(
    *,
    asset_dir: Path,
    subject: dict[str, Any],
    style_prompt: str,
    views: list[str] | None = None,
    quality: str = "high",
    size: str = "1024x1024",
    on_event=lambda kind, text: None,
) -> dict[str, Any]:
    """Generate the four views. ``views`` regenerates a subset, keeping the existing front."""
    if not available():
        raise RuntimeError("OPENAI_API_KEY is not set")

    wanted = views or VIEWS
    refs = asset_dir / "refs"
    refs.mkdir(parents=True, exist_ok=True)
    front_path = refs / "front.png"
    usage_total: dict[str, int] = {}
    generated: list[str] = []

    async with httpx.AsyncClient() as client:
        if "front" in wanted or not front_path.exists():
            on_event("status", f"front view — {MODEL_FAST}, {quality}, {size}")
            payload = await _post_json(
                client,
                "/images/generations",
                {
                    "model": MODEL_FAST,
                    "prompt": front_prompt(subject, style_prompt),
                    "size": size,
                    "quality": quality,
                    "background": "transparent",
                    "output_format": "png",
                },
            )
            usage = _save(payload, front_path)
            _merge_usage(usage_total, usage)
            generated.append("front")

        for view in [v for v in wanted if v != "front"]:
            on_event("status", f"{view} view — {MODEL_EDIT}, conditioned on front")
            payload = await _post_multipart(
                client,
                "/images/edits",
                {
                    "model": MODEL_EDIT,
                    "prompt": view_prompt(view, subject),
                    "size": size,
                    "quality": quality,
                    "background": "transparent",
                    "output_format": "png",
                },
                front_path,
            )
            usage = _save(payload, refs / f"{view}.png")
            _merge_usage(usage_total, usage)
            generated.append(view)

    metadata = {
        "views": generated,
        "models": {"front": MODEL_FAST, "other_views": MODEL_EDIT},
        "quality": quality,
        "size": size,
        "background": "transparent",
        "style_prompt": style_prompt,
        "front_prompt": front_prompt(subject, style_prompt),
        "usage": usage_total,
        "metric_authority": "the brief, not these images",
    }
    (refs / "generation.json").write_text(json.dumps(metadata, indent=2))
    return metadata


def _merge_usage(total: dict[str, int], usage: dict[str, Any]) -> None:
    for key, value in (usage or {}).items():
        if isinstance(value, int):
            total[key] = total.get(key, 0) + value
