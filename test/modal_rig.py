#!/usr/bin/env python3
"""Run setup.sh on real x86 machines on Modal: one GPU machine, one plain
machine, and a licence store (MinIO) they both talk to.

    test/modal_rig.py up                 start the store and the GPU machine
    test/modal_rig.py install vm1        run setup.sh on the GPU machine
    test/modal_rig.py sh vm1 'command'   run a command on a machine
    test/modal_rig.py up2                start the second machine (no GPU)
    test/modal_rig.py install vm2        install there with the store token only
    test/modal_rig.py token              print the store token
    test/modal_rig.py down               terminate everything

Run it with the Python that has modal installed:
    $(head -1 "$(which modal)" | sed 's|^#!||') test/modal_rig.py up
"""
import json
import pathlib
import sys
import time

import modal

HERE = pathlib.Path(__file__).resolve().parent
SETUP = HERE.parent / "setup.sh"
STATE = HERE / ".cache" / "modal-state.json"
APP_NAME = "gamedev-vm-test"
GPU = "A10G"  # RTX-class: what you would actually edit on. H100/H200 are poor at graphics.
STORE_USER, STORE_PASS, BUCKET = "gamedev", "gamedev-store-secret-123", "licences"
DESKTOP_PASSWORD = "gamedev-desk-9182"


def state() -> dict:
    return json.loads(STATE.read_text()) if STATE.exists() else {}


def save(**kw) -> dict:
    s = state() | kw
    STATE.parent.mkdir(parents=True, exist_ok=True)
    STATE.write_text(json.dumps(s, indent=1))
    return s


def app():
    return modal.App.lookup(APP_NAME, create_if_missing=True)


def sandbox(name: str) -> modal.Sandbox:
    sid = state().get(name)
    if not sid:
        sys.exit(f"{name} is not running; start it first")
    return modal.Sandbox.from_id(sid)


def run(sb: modal.Sandbox, cmd: str, quiet: bool = False, shell: str = "bash") -> tuple[int, str]:
    p = sb.exec(shell, "-lc", cmd) if shell == "bash" else sb.exec(*cmd)
    out = []
    for line in p.stdout:
        out.append(line)
        if not quiet:
            print(line, end="", flush=True)
    err = p.stderr.read()
    if err and not quiet:
        print(err, end="", flush=True)
    return p.wait(), "".join(out) + err


def up_store() -> str:
    # The image's entrypoint is minio itself, so these args are its sub-command.
    sb = modal.Sandbox.create(
        "server", "/data", "--address", ":9000",
        app=app(),
        image=modal.Image.from_registry("quay.io/minio/minio:latest"),
        env={"MINIO_ROOT_USER": STORE_USER, "MINIO_ROOT_PASSWORD": STORE_PASS},
        encrypted_ports=[9000],
        timeout=24 * 3600,
    )
    url = sb.tunnels()[9000].url
    save(store=sb.object_id, store_url=url)
    for _ in range(30):
        if sb.exec("mc", "alias", "set", "s", "http://localhost:9000", STORE_USER, STORE_PASS).wait() == 0:
            break
        time.sleep(2)
    sb.exec("mc", "mb", "-p", f"s/{BUCKET}").wait()
    print(f"store: {url}")
    return url


def up_vm(name: str, gpu: str | None) -> None:
    # Unity is ~9 GB installed, which overruns the sandbox's own disk, so it
    # lives on a volume. The desktop port is a raw TCP tunnel: Modal's HTTPS
    # tunnel does not carry the WebSocket the desktop client needs, so KasmVNC
    # keeps its own TLS and the browser talks to it directly.
    sb = modal.Sandbox.create(
        "sleep", "infinity",
        app=app(),
        image=modal.Image.from_registry("ubuntu:24.04"),
        gpu=gpu,
        cpu=8,
        memory=16384,
        volumes={"/opt/unity": modal.Volume.from_name(f"gamedev-unity-{name}", create_if_missing=True)},
        unencrypted_ports=[8444],
        timeout=6 * 3600,
    )
    host, port = sb.tunnels()[8444].tcp_socket
    url = f"https://{host}:{port}"
    save(**{name: sb.object_id, f"{name}_url": url})
    print(f"{name}: {sb.object_id}  desktop {url}  gpu={gpu}")
    run(sb, "nvidia-smi --query-gpu=name,driver_version --format=csv,noheader || echo 'no GPU'")


def install(name: str) -> None:
    sb, s = sandbox(name), state()
    upload = sb.exec("bash", "-c", "cat > /root/setup.sh")
    upload.stdin.write(SETUP.read_bytes())
    upload.stdin.write_eof()
    upload.stdin.drain()
    upload.wait()
    env = [
        "GAMEDEV_NONINTERACTIVE=1",
        f"GAMEDEV_DESKTOP_URL={s[name + '_url']}",
        f"GAMEDEV_USER={name}",
    ]
    if s.get("token"):  # the store already exists: any machine needs only the token
        env.append(f"GAMEDEV_TOKEN={s['token']}")
    elif name == "vm1":
        env += [
            f"STORE_ENDPOINT={s['store_url']}",
            f"STORE_BUCKET={BUCKET}",
            f"STORE_ACCESS_KEY={STORE_USER}",
            f"STORE_SECRET_KEY={STORE_PASS}",
            "UNITY_LICENSE_TYPE=personal",
            f"UNITY_EMAIL={s.get('unity_email', 'unknown@example.com')}",
            "UNITY_SEATS=2",
            f"GAMEDEV_DESKTOP_PASSWORD={DESKTOP_PASSWORD}",
        ]
    else:
        sys.exit("no token yet: install vm1 first")
    code, _ = run(sb, "export " + " ".join(env) + " && bash /root/setup.sh")
    print(f"\n[{name}] setup.sh exit={code}")
    run(sb, "df -h / /opt/unity | grep -v tmpfs")
    if code == 0 and not s.get("token"):
        grab_token(name)


def grab_token(name: str) -> str:
    _, out = run(sandbox(name), "/usr/local/bin/gamedev-vm token", quiet=True)
    tok = next((l.strip() for l in out.splitlines() if l.strip().startswith("gdv1.")), "")
    if not tok:
        sys.exit(f"could not read the store token from {name}:\n{out}")
    save(token=tok)
    return tok


def put(name: str, local: str, remote: str) -> None:
    sb = sandbox(name)
    up = sb.exec("bash", "-c", f"cat > {remote}")
    up.stdin.write(pathlib.Path(local).expanduser().read_bytes())
    up.stdin.write_eof()
    up.stdin.drain()
    up.wait()
    print(f"copied to {name}:{remote}")


def down() -> None:
    for name, sid in state().items():
        if isinstance(sid, str) and sid.startswith("sb-"):
            try:
                modal.Sandbox.from_id(sid).terminate()
                print(f"terminated {name}")
            except Exception as e:  # already gone
                print(f"{name}: {e}")
    STATE.unlink(missing_ok=True)


def main() -> None:
    cmd = sys.argv[1] if len(sys.argv) > 1 else "state"
    if cmd == "up":
        up_store()
        up_vm("vm1", GPU)
    elif cmd == "up2":
        up_vm("vm2", None)
    elif cmd == "install":
        install(sys.argv[2])
    elif cmd == "put":
        put(sys.argv[2], sys.argv[3], sys.argv[4])
    elif cmd == "sh":
        sys.exit(run(sandbox(sys.argv[2]), sys.argv[3])[0])
    elif cmd == "token":
        print(grab_token(sys.argv[2]) if len(sys.argv) > 2 else state().get("token", "(none yet)"))
    elif cmd == "state":
        print(json.dumps(state(), indent=1))
    elif cmd == "down":
        down()
    else:
        sys.exit(__doc__)


if __name__ == "__main__":
    main()
