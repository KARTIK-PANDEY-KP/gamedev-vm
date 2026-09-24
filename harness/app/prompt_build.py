"""Compose image prompts.

The first real run generated a lighthouse lantern instead of a herring gull: the project's
locked style prompt was 1,200 characters of hard-surface lighthouse material language ("no
organic curves"), and it drowned the subject. So the subject leads, the style clause is
subordinate and capped, and the subject is restated at the end.
"""

from __future__ import annotations

import re
from typing import Any

STYLE_BUDGET = 600  # characters; beyond this the style clause starts competing with the subject

SHOT_RULES = (
    "Flat even diffuse studio lighting, no cast shadows, no ground plane, no backdrop. "
    "Fully transparent background. One subject only, centred, filling about 80 percent of the "
    "frame, nothing cropped. Camera level with the subject's mid-height, minimal perspective. "
    "No text, no logos, no watermarks."
)

_META_LINE = re.compile(
    r"^\s*(?:use this paragraph|append only|do not |this is the|paste this|copy this)",
    re.IGNORECASE,
)


def clean_style(style: str, budget: int = STYLE_BUDGET) -> str:
    """Strip harness-facing instructions out of the art bible's style prompt and cap it."""
    text = re.sub(r"\*\*|__|`", "", style)
    marker = re.search(r"LOCKED STYLE PROMPT\s*[—\-:]*\s*", text, re.IGNORECASE)
    if marker:
        text = text[marker.end() :]
    kept = [line for line in text.splitlines() if line.strip() and not _META_LINE.match(line)]
    text = re.sub(r"\s+", " ", " ".join(kept)).strip()
    if len(text) <= budget:
        return text
    cut = text[:budget]
    last_stop = max(cut.rfind(". "), cut.rfind("; "))
    return cut[: last_stop + 1] if last_stop > budget // 2 else cut


def subject_lead(description: str, words: int = 12) -> str:
    """A short handle for the subject, used to bracket the prompt."""
    lead = " ".join(description.split()[:words]).rstrip(",;:")
    return lead


def front_prompt(subject: dict[str, Any], style: str) -> str:
    description = subject["description"]
    parts = [
        f"SUBJECT — the image shows this and nothing else: {description}",
        f"Real-world size: {subject.get('dimensions', 'unspecified')}.",
        "VIEW: front elevation, the subject facing the camera.",
        (
            "RENDERING STYLE — governs finish, materials, palette and mood only. It must never "
            f"change what the subject is, its anatomy or its proportions: {clean_style(style)}"
        ),
    ]
    if subject.get("negative"):
        parts.append(f"MUST NOT APPEAR: {subject['negative']}")
    parts.append(SHOT_RULES)
    parts.append(f"To be explicit, the subject of this image is: {subject_lead(description)}.")
    return "\n".join(parts)


def view_prompt(view: str, subject: dict[str, Any]) -> str:
    description = subject["description"]
    parts = [
        f"Show the SAME subject as the reference image — {subject_lead(description)} — "
        f"rotated in place to its {view} side.",
        "Keep every design element, proportion, colour, material and wear mark identical to the "
        "reference. Same camera distance, same framing, same subject height within the frame.",
        SHOT_RULES,
    ]
    if subject.get("negative"):
        parts.append(f"MUST NOT APPEAR: {subject['negative']}")
    return "\n".join(parts)
