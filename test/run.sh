#!/usr/bin/env bash
# shellcheck disable=SC2016,SC2054  # single-quoted commands run inside the VMs
# Licence and store scenarios against a real S3-compatible server (MinIO) and
# two fake VMs. Installs are skipped here so the run takes minutes; the full
# install is exercised separately (see README).
#
#   test/run.sh          run all scenarios on a fresh rig, tear it down after
#   KEEP=1 test/run.sh   leave the rig running for poking around
set -uo pipefail
cd "$(dirname "$0")" || exit 1

export COMPOSE_PROJECT_NAME=gamedev-vm-quick VM1_PORT=0 VM2_PORT=0 VM1_UNITY_DIR=./.cache/quick-unity
dc() { docker compose "$@"; }
pass=0 fail=0
check() {  # check "description" command...
  local d=$1; shift
  if "$@"; then printf '  ok    %s\n' "$d"; pass=$((pass + 1)); else printf '  FAIL  %s\n' "$d"; fail=$((fail + 1)); fi
}
run() {  # run VM "shell command" [docker exec -e flags...]; output in $OUT, status in $RC
  local vm=$1 cmd=$2; shift 2
  OUT=$(dc exec -T "$@" "$vm" bash -c "$cmd" 2>&1); RC=$?
  printf '%s\n' "$OUT" | sed 's/^/        | /' >>"$LOG"
}
has() { grep -qF -- "$1" <<<"$OUT"; }

LOG=$(mktemp); echo "Full output: $LOG"
QUICK=(-e GAMEDEV_NONINTERACTIVE=1 -e GAMEDEV_SKIP=gpu,desktop,browser,blender,hub,unity-editor)
STORE=(-e STORE_ENDPOINT=http://store:9000 -e STORE_BUCKET=gamedev -e STORE_ACCESS_KEY=testaccess -e STORE_SECRET_KEY=testsecret-123456)

echo "Starting rig..."
dc down -v --remove-orphans >/dev/null 2>&1
dc up -d --build store vm1 vm2 >/dev/null 2>&1 || { echo "rig failed to start"; exit 1; }
until dc exec -T store sh -c 'mc alias set s http://localhost:9000 testaccess testsecret-123456' >/dev/null 2>&1; do sleep 1; done
dc exec -T store mc mb -p s/gamedev >/dev/null
# The 5-minute renewal timer would race the scripted steps below; it is
# covered by scenario 9 instead.
stop_timers() { dc exec -T vm1 systemctl stop gamedev-vm-seat-renew.timer; dc exec -T vm2 systemctl stop gamedev-vm-seat-renew.timer; } 2>/dev/null

echo "1. First machine creates the store and answers the questions once"
run vm2 'bash /root/setup.sh' "${QUICK[@]}" "${STORE[@]}" -e GAMEDEV_USER=bob -e UNITY_LICENSE_TYPE=personal \
  -e UNITY_EMAIL=bob@example.com -e UNITY_SEATS=1 -e GAMEDEV_DESKTOP_PASSWORD=desk-pass-123
check "install succeeds" test "$RC" = 0
check "takes seat 1" has "holds Unity seat 1 of 1"
check "shows the one-time Unity sign-in steps" has "Get a free personal license"
run vm2 'gamedev-vm token'; TOKEN=$(tail -1 <<<"$OUT")
check "prints a store token" grep -q '^gdv1\.' <<<"$TOKEN"

echo "2. Store holds only ciphertext"
dc exec -T store sh -c 'mc cat s/gamedev/vault/unity.env.gpg s/gamedev/vault/desktop.env.gpg' >"$LOG.vault"
check "email not readable in the bucket" bash -c '! grep -qa bob@example.com "$0"' "$LOG.vault"
check "desktop password not readable in the bucket" bash -c '! grep -qa desk-pass-123 "$0"' "$LOG.vault"

echo "3. One-time sign-in is saved to the store"
run vm2 'runuser -u dev -- bash -c "mkdir -p ~/.local/share/unity3d/Unity && echo ULF-$RANDOM > ~/.local/share/unity3d/Unity/Unity_lic.ulf" && gamedev-vm license save && cat ~dev/.local/share/unity3d/Unity/Unity_lic.ulf'
ULF=$(tail -1 <<<"$OUT")
check "license save succeeds" test "$RC" = 0

echo "4. Second machine needs only the token, and waits for a seat"
run vm1 'bash /root/setup.sh' "${QUICK[@]}" -e GAMEDEV_TOKEN="$TOKEN" -e GAMEDEV_USER=alice
check "no questions asked (non-interactive run got past the store)" has "Ready."
check "exit code 3 when all seats are taken" test "$RC" = 3
check "says who holds the seat" has "bob"
check "no licence copied without a seat" bash -c '! docker compose exec -T vm1 test -e /home/dev/.local/share/unity3d/Unity/Unity_lic.ulf'

stop_timers
echo "5. Seat moves when the first machine shuts down"
run vm2 'systemctl stop gamedev-vm-seat.service; gamedev-vm license status'
check "shutdown frees the seat" has "(free)"
run vm1 'gamedev-vm license claim && cat /home/dev/.local/share/unity3d/Unity/Unity_lic.ulf'
check "second machine claims it" test "$RC" = 0
check "licence restored byte-for-byte" test "$(tail -1 <<<"$OUT")" = "$ULF"
run vm2 'gamedev-vm license claim'
check "first machine now refused" test "$RC" = 3

echo "6. Abandoned seat (machine died) is taken over after the timeout"
sleep 2
run vm2 'gamedev-vm license claim' -e GAMEDEV_SEAT_TTL=1
check "takeover succeeds" test "$RC" = 0
check "takeover is reported" has "stopped renewing"
run vm1 'gamedev-vm license renew'
check "old holder learns it lost the seat" test "$RC" = 3

echo "7. Two machines racing for the last seat: exactly one wins"
run vm2 'gamedev-vm license release'
( dc exec -T vm1 gamedev-vm license claim >/dev/null 2>&1; echo $? >"$LOG.a" ) &
( dc exec -T vm2 gamedev-vm license claim >/dev/null 2>&1; echo $? >"$LOG.b" ) &
wait
check "one winner, one refused" test "$(sort "$LOG.a" "$LOG.b" | tr '\n' ' ')" = "0 3 "
run vm1 'gamedev-vm license status'
check "status shows exactly one holder" test "$(grep -cE '^ +1 +(alice|bob) ' <<<"$OUT")" = 1

echo "8. Bad tokens fail with a clear message"
BAD=$(python3 -c 'import base64,json,sys;t=sys.argv[1][5:];d=json.loads(base64.urlsafe_b64decode(t+"="*(-len(t)%4)));d["k"]="wrong";print("gdv1."+base64.urlsafe_b64encode(json.dumps(d).encode()).decode().rstrip("="))' "$TOKEN")
run vm1 'gamedev-vm license status' -e GAMEDEV_TOKEN="$BAD"
check "wrong passphrase" has "passphrase is wrong"
run vm1 'gamedev-vm license status' -e GAMEDEV_TOKEN="${TOKEN:0:30}"
check "truncated token" has "not valid"

echo "9. Renewal timer and shutdown hook are installed"
run vm1 'systemctl is-enabled gamedev-vm-seat.service gamedev-vm-seat-renew.timer'
check "both enabled" test "$(grep -c enabled <<<"$OUT")" = 2

echo
echo "$pass passed, $fail failed"
[[ ${KEEP:-} == 1 ]] || dc down -v >/dev/null 2>&1
rm -f "$LOG.a" "$LOG.b" "$LOG.vault"
((fail == 0))
