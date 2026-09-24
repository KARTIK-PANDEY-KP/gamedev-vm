#!/usr/bin/env bash
# gamedev-vm: turn a fresh Ubuntu 22.04/24.04 x86_64 machine (ideally with an
# NVIDIA GPU) into a Unity + Blender workstation that you open in a web browser.
#
# Settings, passwords and licence files are kept in one private S3-compatible
# bucket, encrypted before upload, so they are entered once and every later
# machine only needs the store token. Each machine takes a Unity "seat" while it
# runs and gives it back on shutdown, so the store always shows who is using it.
#
# Unity Pro (serial) activates by itself on every machine and is returned on
# shutdown. Unity Personal under Unity 6 is a named-user licence tied to the
# Unity Hub sign-in on that machine: it cannot be copied to another machine
# (verified against Unity's licensing service), so each machine needs its own
# one-time sign-in in the browser desktop.
#
#   sudo bash setup.sh                  install everything (asks for what it needs)
#   sudo gamedev-vm info                desktop address, password and versions
#   sudo gamedev-vm token               token for setting up the next machine
#   sudo gamedev-vm license status      who holds which Unity seat, recent activity
#   sudo gamedev-vm license save        upload this machine's Unity licence to the store
#   sudo gamedev-vm license import FILE  take a licence file from your own computer
#   sudo gamedev-vm license claim       take a seat and activate Unity here
#   sudo gamedev-vm license release     return the licence and free the seat
#   sudo gamedev-vm license reset       forget the stored Unity details and ask again
#
# Everything asked interactively can also come from the environment:
#   GAMEDEV_TOKEN             store token from another machine
#   STORE_ENDPOINT STORE_REGION STORE_BUCKET STORE_PREFIX
#   STORE_ACCESS_KEY STORE_SECRET_KEY STORE_PASSPHRASE   (a new store)
#   GAMEDEV_USER              name shown next to this machine's seat
#   UNITY_LICENSE_TYPE        personal | pro
#   UNITY_EMAIL UNITY_PASSWORD UNITY_SERIAL UNITY_SEATS
#   GAMEDEV_DESKTOP_PASSWORD  password for the browser desktop
#   UNITY_VERSION             e.g. 6000.3.24f1 (default: newest Unity 6 LTS)
#   BLENDER_VERSION           e.g. 5.2.2
#   GAMEDEV_SKIP              comma list: gpu,desktop,browser,blender,hub,unity-editor
#   GAMEDEV_DESKTOP_TLS=off   desktop serves plain HTTP (something in front does TLS)
#   GAMEDEV_DESKTOP_URL       address to show for the desktop (behind a tunnel)
#   GAMEDEV_NONINTERACTIVE=1  never prompt; fail if something is missing
set -euo pipefail

readonly CONF_DIR=/etc/gamedev-vm
readonly STORE_FILE=$CONF_DIR/store.env
readonly STATE_FILE=$CONF_DIR/machine.env
readonly LIB_DIR=/usr/local/lib/gamedev-vm
readonly BIN=/usr/local/bin/gamedev-vm
readonly UNITY_ROOT=/opt/unity
readonly BLENDER_ROOT=/opt/blender

BLENDER_VERSION=${BLENDER_VERSION:-5.2.2}
UNITY_VERSION=${UNITY_VERSION:-}
readonly KASMVNC_VERSION=1.5.0
readonly VIRTUALGL_VERSION=3.1.5
readonly DESKTOP_PORT=${GAMEDEV_DESKTOP_PORT:-8444}
# off when something in front already terminates TLS (a tunnel or reverse proxy)
readonly DESKTOP_TLS=${GAMEDEV_DESKTOP_TLS:-on}
readonly SEAT_TTL=${GAMEDEV_SEAT_TTL:-1200}   # seconds without renewal before a seat counts as abandoned
readonly SKIP=",${GAMEDEV_SKIP:-},"
readonly BLENDER_MIRRORS=(
  https://mirrors.ocf.berkeley.edu/blender/release
  https://mirror.clarkson.edu/blender/release
  https://ftp.nluug.nl/pub/graphics/blender/release
  https://download.blender.org/release
)
readonly UNITY_RELEASES_API=https://services.api.unity.com/unity/editor/release/v1/releases
if [[ -t 2 ]]; then CURL_PROGRESS=--progress-bar; else CURL_PROGRESS=-s; fi

# ---------------------------------------------------------------- output ----

if [[ -t 1 ]]; then B=$'\e[1m' RED=$'\e[31m' YEL=$'\e[33m' GRN=$'\e[32m' N=$'\e[0m'; else B='' RED='' YEL='' GRN='' N=''; fi
step() { printf '\n%s==> %s%s\n' "$B" "$*" "$N"; }
note() { printf '    %s\n' "$*"; }
ok()   { printf '    %s%s%s\n' "$GRN" "$*" "$N"; }
warn() { printf '%s!!  %s%s\n' "$YEL" "$*" "$N" >&2; }
die()  { printf '%sERROR: %s%s\n' "$RED" "$*" "$N" >&2; exit 1; }
rule() { printf '%s%s%s\n' "$B" '------------------------------------------------------------------------' "$N"; }
box()  { local l; printf '\n'; rule; for l in "$@"; do printf '  %s\n' "$l"; done; rule; printf '\n'; }
skipped() { [[ $SKIP == *",$1,"* ]]; }

# --------------------------------------------------------------- prompts ----

tty_ok() { [[ ${GAMEDEV_NONINTERACTIVE:-0} != 1 ]] && (: </dev/tty) 2>/dev/null; }

# ask VAR "question" [default] [secret] - leaves VAR alone if already set
ask() {
  local __var=$1 q=$2 def=${3:-} secret=${4:-} reply=''
  [[ -n ${!__var:-} ]] && return 0
  if ! tty_ok; then
    [[ -n $def ]] || die "$q: no terminal to ask on, set $__var"
    printf -v "$__var" '%s' "$def"
    return 0
  fi
  while [[ -z $reply ]]; do
    if [[ -n $secret ]]; then
      IFS= read -rsp "    $q: " reply </dev/tty; echo >/dev/tty
    else
      IFS= read -rp "    $q${def:+ [$def]}: " reply </dev/tty
    fi
    reply=${reply:-$def}
  done
  printf -v "$__var" '%s' "$reply"
}

# write_env FILE VAR... - shell-quoted so the file can be sourced back
write_env() {
  local f=$1 v; shift
  ( umask 077; for v in "$@"; do printf '%s=%q\n' "$v" "${!v-}"; done >"$f.tmp" )
  mv "$f.tmp" "$f"
}

random_secret() { openssl rand -base64 48 | tr -dc 'A-Za-z0-9' | head -c "${1:-24}"; }

# ------------------------------------------------------------------- apt ----

APT_UPDATED=0
apt_update() { ((APT_UPDATED)) || { apt-get -o DPkg::Lock::Timeout=600 update -qq; APT_UPDATED=1; }; }

apt_install() {
  local missing=() p
  for p in "$@"; do
    [[ -n $p ]] || continue
    dpkg-query -W -f='${Status}' "$p" 2>/dev/null | grep -q 'ok installed' || missing+=("$p")
  done
  ((${#missing[@]})) || return 0
  apt_update
  DEBIAN_FRONTEND=noninteractive apt-get -o DPkg::Lock::Timeout=600 install -y -qq \
    --no-install-recommends "${missing[@]}" >/dev/null
}

# first package name that exists on this release (22.04 and 24.04 differ, e.g. libasound2t64)
pick_pkg() {
  local p; apt_update
  for p in "$@"; do apt-cache show "$p" >/dev/null 2>&1 && { echo "$p"; return; }; done
}

# fetch URL FILE [BYTES]: download, resuming after dropped connections (large
# downloads over cloud links do drop). With BYTES, a finished file is kept.
fetch() {
  local url=$1 out=$2 size=${3:-} i
  for ((i = 1; i <= 10; i++)); do
    [[ -n $size && -f $out && $(stat -c %s "$out") -eq $size ]] && return 0
    curl -fL "$CURL_PROGRESS" --retry 3 --retry-delay 3 -C - -o "$out" "$url" && return 0
    warn "Download interrupted (attempt $i of 10), resuming..."
    sleep 3
  done
  return 1
}

# ------------------------------------------------------------ S3 client ----
# Minimal AWS Signature V4 client over curl + openssl, path-style URLs. Works
# with AWS S3, Cloudflare R2 (region "auto"), MinIO and other S3-compatibles.

S3_STATUS='' S3_ETAG=''

sha256_hex() { sha256sum "${1:--}" | cut -d' ' -f1; }
hmac_hex()   { printf %s "$2" | openssl dgst -sha256 -mac HMAC -macopt "$1" | awk '{print $NF}'; }

urienc() {
  local s=$1 out='' c i
  for ((i = 0; i < ${#s}; i++)); do
    c=${s:i:1}
    case $c in [A-Za-z0-9._~-]) out+=$c ;; *) printf -v c '%%%02X' "'$c"; out+=$c ;; esac
  done
  printf %s "$out"
}

# s3 METHOD KEY|?QUERY [BODY_FILE] [HEADER...]; response body in $S3_BODY
s3() {
  local method=$1 target=$2 body=${3:-}
  shift $(($# < 3 ? $# : 3))
  local path query='' host amzdate day hash creq scope sts k sig h
  if [[ $target == \?* ]]; then
    query=${target#\?}; path="/$STORE_BUCKET/"
  else
    path="/$STORE_BUCKET/$(store_prefix)$target"
  fi
  host=${STORE_ENDPOINT#*://}; host=${host%%/*}
  amzdate=$(date -u +%Y%m%dT%H%M%SZ); day=${amzdate%%T*}
  if [[ -n $body ]]; then hash=$(sha256_hex "$body"); else hash=$(printf '' | sha256_hex); fi
  creq=$(printf '%s\n%s\n%s\nhost:%s\nx-amz-content-sha256:%s\nx-amz-date:%s\n\nhost;x-amz-content-sha256;x-amz-date\n%s' \
    "$method" "$path" "$query" "$host" "$hash" "$amzdate" "$hash")
  scope="$day/$STORE_REGION/s3/aws4_request"
  sts=$(printf 'AWS4-HMAC-SHA256\n%s\n%s\n%s' "$amzdate" "$scope" "$(printf %s "$creq" | sha256_hex)")
  k=$(hmac_hex "key:AWS4$STORE_SECRET_KEY" "$day")
  k=$(hmac_hex "hexkey:$k" "$STORE_REGION")
  k=$(hmac_hex "hexkey:$k" s3)
  k=$(hmac_hex "hexkey:$k" aws4_request)
  sig=$(hmac_hex "hexkey:$k" "$sts")
  local args=(-sS -X "$method" -o "$S3_BODY" -D "$S3_HDRS" -w '%{http_code}' --max-time 120
    -H "Authorization: AWS4-HMAC-SHA256 Credential=$STORE_ACCESS_KEY/$scope, SignedHeaders=host;x-amz-content-sha256;x-amz-date, Signature=$sig"
    -H "x-amz-date: $amzdate" -H "x-amz-content-sha256: $hash")
  for h in "$@"; do args+=(-H "$h"); done
  [[ -n $body ]] && args+=(--data-binary "@$body")
  : >"$S3_BODY"; : >"$S3_HDRS"
  S3_STATUS=$(curl "${args[@]}" "${STORE_ENDPOINT%/}$path${query:+?$query}" 2>"$TMP/s3.err") || S3_STATUS=000
  S3_ETAG=$(grep -i '^etag:' "$S3_HDRS" | tail -1 | cut -d' ' -f2- | tr -d '\r' || true)
}

s3_error() {
  local code; code=$(grep -o '<Code>[^<]*' "$S3_BODY" 2>/dev/null | head -1 | cut -c7- || true)
  printf '%s' "${code:-$(head -c 200 "$TMP/s3.err" 2>/dev/null)}"
}

store_prefix() { local p=${STORE_PREFIX:-}; p=${p#/}; p=${p%/}; [[ -n $p ]] && printf '%s/' "$p"; return 0; }

# ---------------------------------------------------------------- store ----

seal()   { gpg --batch --yes --quiet --pinentry-mode loopback --passphrase-fd 3 --symmetric --cipher-algo AES256 -o "$2" "$1" 3<<<"$STORE_PASSPHRASE"; }
unseal() { gpg --batch --yes --quiet --pinentry-mode loopback --passphrase-fd 3 --decrypt -o "$2" "$1" 3<<<"$STORE_PASSPHRASE" 2>/dev/null; }

vault_put() {  # vault_put NAME FILE
  seal "$2" "$TMP/vault.gpg"
  s3 PUT "vault/$1.gpg" "$TMP/vault.gpg"
  [[ $S3_STATUS == 200 ]] || die "store: could not save $1 (HTTP $S3_STATUS $(s3_error))"
}

vault_get() {  # vault_get NAME OUTFILE; returns 1 when the store has no such entry
  s3 GET "vault/$1.gpg"
  case $S3_STATUS in
    200) unseal "$S3_BODY" "$2" || die "store: cannot decrypt $1 (wrong passphrase in the token?)" ;;
    404) return 1 ;;
    *) die "store: could not read $1 (HTTP $S3_STATUS $(s3_error))" ;;
  esac
}

vault_del() { s3 DELETE "vault/$1.gpg"; }

token_encode() {
  printf 'gdv1.%s' "$(jq -cn --arg e "$STORE_ENDPOINT" --arg r "$STORE_REGION" --arg b "$STORE_BUCKET" \
    --arg p "${STORE_PREFIX:-}" --arg a "$STORE_ACCESS_KEY" --arg s "$STORE_SECRET_KEY" --arg k "$STORE_PASSPHRASE" \
    '{e:$e,r:$r,b:$b,p:$p,a:$a,s:$s,k:$k}' | base64 -w0 | tr '+/' '-_' | tr -d '=')"
}

token_decode() {
  local t=${1#gdv1.} j
  t=$(printf %s "$t" | tr -d '[:space:]' | tr -- '-_' '+/')
  while ((${#t} % 4)); do t+='='; done
  if ! j=$(printf %s "$t" | base64 -d 2>/dev/null) || ! jq -e '.e and .b and .a and .s and .k' >/dev/null 2>&1 <<<"$j"; then
    die "That store token is not valid. Copy it again in full (it starts with gdv1.)"
  fi
  STORE_ENDPOINT=$(jq -r .e <<<"$j"); STORE_REGION=$(jq -r .r <<<"$j"); STORE_BUCKET=$(jq -r .b <<<"$j")
  STORE_PREFIX=$(jq -r .p <<<"$j"); STORE_ACCESS_KEY=$(jq -r .a <<<"$j"); STORE_SECRET_KEY=$(jq -r .s <<<"$j")
  STORE_PASSPHRASE=$(jq -r .k <<<"$j")
}

store_ask_new() {
  box "No store token given, so this sets up a new store." \
      "You need an empty private bucket on any S3-compatible service and an access key for it:" \
      "  AWS S3         endpoint https://s3.<region>.amazonaws.com   region e.g. us-east-1" \
      "  Cloudflare R2  endpoint https://<account-id>.r2.cloudflarestorage.com   region auto" \
      "  MinIO          endpoint http(s)://<host>:9000   region us-east-1"
  ask STORE_ENDPOINT "Endpoint URL"
  ask STORE_REGION "Region" us-east-1
  ask STORE_BUCKET "Bucket name"
  ask STORE_PREFIX "Folder inside the bucket" gamedev-vm
  ask STORE_ACCESS_KEY "Access key ID"
  ask STORE_SECRET_KEY "Secret access key" '' secret
}

# Loads the store settings (token, saved file, environment or prompts) and
# proves the keys and passphrase work before anything else happens.
store_load() {
  if [[ -n ${GAMEDEV_TOKEN:-} ]]; then
    token_decode "$GAMEDEV_TOKEN"
  elif [[ -f $STORE_FILE ]]; then
    # shellcheck source=/dev/null
    source "$STORE_FILE"
  elif [[ -z ${STORE_ENDPOINT:-} ]]; then
    step "Central store for licences and passwords"
    local t=''
    if tty_ok; then
      IFS= read -rp "    Paste the store token from another machine (or press Enter to set up a new store): " t </dev/tty
    fi
    if [[ -n $t ]]; then token_decode "$t"; else store_ask_new; fi
  fi
  : "${STORE_REGION:=us-east-1}" "${STORE_PREFIX:=}"
  [[ -n ${STORE_ENDPOINT:-} && -n ${STORE_BUCKET:-} && -n ${STORE_ACCESS_KEY:-} && -n ${STORE_SECRET_KEY:-} ]] \
    || die "Store settings are incomplete"

  s3 GET vault/check.gpg
  case $S3_STATUS in
    200)
      cp "$S3_BODY" "$TMP/check.gpg"
      if [[ -z ${STORE_PASSPHRASE:-} ]]; then
        ask STORE_PASSPHRASE "Store passphrase (from the first machine's token)" '' secret
      fi
      unseal "$TMP/check.gpg" "$TMP/check" \
        || die "The store passphrase is wrong for $STORE_BUCKET/$(store_prefix). Use the token printed by 'gamedev-vm token'."
      ;;
    404)
      [[ -n ${STORE_PASSPHRASE:-} ]] || STORE_PASSPHRASE=$(random_secret 32)
      echo "gamedev-vm store" >"$TMP/check"
      seal "$TMP/check" "$TMP/check.gpg"
      s3 PUT vault/check.gpg "$TMP/check.gpg" 'If-None-Match: *'
      [[ $S3_STATUS == 200 ]] || die "The access key cannot write to the bucket (HTTP $S3_STATUS $(s3_error))"
      ok "New store created in $STORE_BUCKET/$(store_prefix)"
      ;;
    403) die "The access key is not allowed to read bucket $STORE_BUCKET (HTTP 403 $(s3_error))" ;;
    000) die "Cannot reach the store at $STORE_ENDPOINT: $(s3_error)" ;;
    *) die "Store check failed (HTTP $S3_STATUS $(s3_error)). Does bucket $STORE_BUCKET exist?" ;;
  esac
  mkdir -p "$CONF_DIR"; chmod 700 "$CONF_DIR"
  write_env "$STORE_FILE" STORE_ENDPOINT STORE_REGION STORE_BUCKET STORE_PREFIX STORE_ACCESS_KEY STORE_SECRET_KEY STORE_PASSPHRASE
}

# -------------------------------------------------------- machine state ----

state_load() {
  # shellcheck source=/dev/null
  [[ -f $STATE_FILE ]] && source "$STATE_FILE"
  : "${MACHINE_ID:=$(cat /proc/sys/kernel/random/uuid)}"
  if [[ -z ${DEV_USER:-} ]]; then
    DEV_USER=${GAMEDEV_OS_USER:-${SUDO_USER:-}}
    [[ -z $DEV_USER || $DEV_USER == root ]] && DEV_USER=dev
  fi
  [[ -n ${GAMEDEV_USER:-} ]] || GAMEDEV_USER=${OWNER_NAME:-}
  UNITY_INSTALLED=${UNITY_INSTALLED:-}
  SEAT=${SEAT:-}
}

state_save() {
  OWNER_NAME=$GAMEDEV_USER
  write_env "$STATE_FILE" MACHINE_ID DEV_USER OWNER_NAME UNITY_INSTALLED SEAT
}

dev_home() { getent passwd "$DEV_USER" | cut -d: -f6; }
as_dev() { runuser -u "$DEV_USER" -- env HOME="$(dev_home)" USER="$DEV_USER" LOGNAME="$DEV_USER" "$@"; }

MACHINE_IP=''
machine_ip() {
  if [[ -z $MACHINE_IP ]]; then
    MACHINE_IP=$(curl -fsS --max-time 4 https://checkip.amazonaws.com 2>/dev/null | tr -d '[:space:]') || true
    [[ -n $MACHINE_IP ]] || MACHINE_IP=$(hostname -I 2>/dev/null | awk '{print $1}')
  fi
  printf %s "${MACHINE_IP:-unknown}"
}

ensure_dev_user() {
  if ! id "$DEV_USER" >/dev/null 2>&1; then
    useradd -m -s /bin/bash "$DEV_USER"
    note "Created user $DEV_USER"
  fi
  local g
  for g in video render ssl-cert; do getent group "$g" >/dev/null && usermod -aG "$g" "$DEV_USER"; done
  return 0
}

# ------------------------------------------------------- shared settings ----

UNITY_SETTINGS_LOADED=0
unity_settings() {  # load the Unity licence details from the store, asking once if missing
  ((UNITY_SETTINGS_LOADED)) && return 0
  if vault_get unity.env "$TMP/unity.env"; then
    # shellcheck source=/dev/null
    source "$TMP/unity.env"
  else
    step "Unity licence (asked once, then kept in the store for every machine)"
    note "personal: free Unity Personal. You sign in to Unity Hub once in the browser desktop,"
    note "          and the licence file is saved to the store for later machines."
    note "pro:      paid seat with a serial key, activated automatically on each machine."
    ask UNITY_LICENSE_TYPE "Licence type (personal/pro)" personal
    UNITY_LICENSE_TYPE=${UNITY_LICENSE_TYPE,,}
    [[ $UNITY_LICENSE_TYPE == personal || $UNITY_LICENSE_TYPE == pro ]] || die "Licence type must be personal or pro"
    ask UNITY_EMAIL "Unity account email"
    if [[ $UNITY_LICENSE_TYPE == pro ]]; then
      ask UNITY_PASSWORD "Unity account password" '' secret
      ask UNITY_SERIAL "Serial key (from id.unity.com > Subscriptions)"
    fi
    ask UNITY_SEATS "How many machines may use this licence at the same time" 2
    [[ $UNITY_SEATS =~ ^[1-9][0-9]*$ ]] || die "Seat count must be a whole number"
    write_env "$TMP/unity.env" UNITY_LICENSE_TYPE UNITY_EMAIL UNITY_PASSWORD UNITY_SERIAL UNITY_SEATS
    vault_put unity.env "$TMP/unity.env"
    ok "Saved the Unity licence details to the store"
  fi
  UNITY_SETTINGS_LOADED=1
}

desktop_settings() {
  if vault_get desktop.env "$TMP/desktop.env"; then
    # shellcheck source=/dev/null
    source "$TMP/desktop.env"
  else
    if [[ -z ${GAMEDEV_DESKTOP_PASSWORD:-} ]] && tty_ok; then
      note "Password for the browser desktop (shared by all machines; Enter = generate one)"
      IFS= read -rsp "    Desktop password: " GAMEDEV_DESKTOP_PASSWORD </dev/tty; echo >/dev/tty
    fi
    DESKTOP_PASSWORD=${GAMEDEV_DESKTOP_PASSWORD:-$(random_secret 16)}
    ((${#DESKTOP_PASSWORD} >= 8)) || die "Desktop password must be at least 8 characters"
    write_env "$TMP/desktop.env" DESKTOP_PASSWORD
    vault_put desktop.env "$TMP/desktop.env"
  fi
}

# ---------------------------------------------------------------- seats ----
# Seat N lives at seats/unity-N.json. Claims use conditional writes
# (If-None-Match / If-Match) so two machines can never take the same seat.

seat_key() { printf 'seats/unity-%s.json' "$1"; }

lease_write() {  # lease_write CLAIMED_AT > $TMP/lease
  jq -cn --arg m "$MACHINE_ID" --arg h "$(hostname)" --arg u "$GAMEDEV_USER" --arg ip "$(machine_ip)" \
    --arg c "$1" --arg r "$(date -u +%FT%TZ)" --argjson t "$(date +%s)" \
    '{machine:$m,host:$h,user:$u,ip:$ip,claimed_at:$c,renewed_at:$r,renewed_epoch:$t}' >"$TMP/lease"
}

activity() {  # activity EVENT [DETAIL] - append-only log, newest sorts first
  local key=$((9999999999 - $(date +%s)))
  jq -cn --arg e "$1" --arg d "${2:-}" --arg u "$GAMEDEV_USER" --arg h "$(hostname)" --arg m "$MACHINE_ID" \
    --arg at "$(date -u +%FT%TZ)" '{at:$at,event:$e,detail:$d,user:$u,host:$h,machine:$m}' >"$TMP/event"
  s3 PUT "log/$key-$MACHINE_ID-$1.json" "$TMP/event" || true
}

# seat_scan: fills SEAT_STATE[n] = free|mine|busy|stale, SEAT_ETAG[n], SEAT_JSON[n]
declare -A SEAT_STATE=() SEAT_ETAG=() SEAT_JSON=()
seat_scan() {
  local n age
  for ((n = 1; n <= UNITY_SEATS; n++)); do
    s3 GET "$(seat_key "$n")"
    case $S3_STATUS in
      404) SEAT_STATE[$n]=free ;;
      200)
        SEAT_ETAG[$n]=$S3_ETAG; SEAT_JSON[$n]=$(cat "$S3_BODY")
        age=$(($(date +%s) - $(jq -r '.renewed_epoch // 0' <<<"${SEAT_JSON[$n]}")))
        if [[ $(jq -r .machine <<<"${SEAT_JSON[$n]}") == "$MACHINE_ID" ]]; then SEAT_STATE[$n]=mine
        elif ((age > SEAT_TTL)); then SEAT_STATE[$n]=stale
        else SEAT_STATE[$n]=busy; fi
        ;;
      *) die "store: could not read seat $n (HTTP $S3_STATUS $(s3_error))" ;;
    esac
  done
}

# seat_claim: keep this machine's seat, else take a free one, else an abandoned
# one. Sets SEAT and returns 0, or returns 1 when every seat is in use.
seat_claim() {
  local n who
  unity_settings
  seat_scan
  for ((n = 1; n <= UNITY_SEATS; n++)); do
    [[ ${SEAT_STATE[$n]} == mine ]] || continue
    lease_write "$(jq -r .claimed_at <<<"${SEAT_JSON[$n]}")"
    s3 PUT "$(seat_key "$n")" "$TMP/lease" "If-Match: ${SEAT_ETAG[$n]}"
    [[ $S3_STATUS == 200 ]] && { SEAT=$n; state_save; return 0; }
  done
  for ((n = 1; n <= UNITY_SEATS; n++)); do
    [[ ${SEAT_STATE[$n]} == free ]] || continue
    lease_write "$(date -u +%FT%TZ)"
    s3 PUT "$(seat_key "$n")" "$TMP/lease" 'If-None-Match: *'
    [[ $S3_STATUS == 200 ]] && { SEAT=$n; state_save; activity claim "seat $n"; return 0; }
  done
  for ((n = 1; n <= UNITY_SEATS; n++)); do
    [[ ${SEAT_STATE[$n]} == stale ]] || continue
    who=$(jq -r '"\(.user) on \(.host)"' <<<"${SEAT_JSON[$n]}")
    lease_write "$(date -u +%FT%TZ)"
    s3 PUT "$(seat_key "$n")" "$TMP/lease" "If-Match: ${SEAT_ETAG[$n]}"
    if [[ $S3_STATUS == 200 ]]; then
      SEAT=$n; state_save; activity takeover "seat $n, abandoned by $who"
      warn "Took over seat $n, which $who stopped renewing (machine died or lost network)."
      [[ $UNITY_LICENSE_TYPE == pro ]] && warn "If Unity says the serial has no activations left, return the old machine's activation at id.unity.com."
      return 0
    fi
  done
  SEAT=''; state_save
  return 1
}

seat_release() {
  local n
  unity_settings
  seat_scan
  for ((n = 1; n <= UNITY_SEATS; n++)); do
    [[ ${SEAT_STATE[$n]} == mine ]] || continue
    s3 DELETE "$(seat_key "$n")"
    [[ $S3_STATUS == 204 || $S3_STATUS == 200 ]] || die "store: could not free seat $n (HTTP $S3_STATUS $(s3_error))"
    activity release "seat $n"
    ok "Freed seat $n"
  done
  SEAT=''; state_save
}

ago() {
  local s=$1
  if ((s < 90)); then echo "${s}s ago"; elif ((s < 5400)); then echo "$((s / 60))m ago"
  elif ((s < 172800)); then echo "$((s / 3600))h ago"; else echo "$((s / 86400))d ago"; fi
}

license_status() {
  vault_get unity.env "$TMP/unity.env" || { note "No Unity licence stored yet. Run setup.sh to add one."; return 0; }
  # shellcheck source=/dev/null
  source "$TMP/unity.env"; UNITY_SETTINGS_LOADED=1
  local stored=no; s3 GET vault/unity-license.tar.gpg; [[ $S3_STATUS == 200 ]] && stored=yes
  step "Unity $UNITY_LICENSE_TYPE licence ($UNITY_EMAIL), $UNITY_SEATS seat(s)"
  [[ $UNITY_LICENSE_TYPE == personal ]] && note "Licence file in store: $stored"
  seat_scan
  printf '    %-5s %-14s %-24s %-16s %-21s %s\n' SEAT USER MACHINE IP SINCE 'LAST SEEN'
  local n j mark
  for ((n = 1; n <= UNITY_SEATS; n++)); do
    if [[ ${SEAT_STATE[$n]} == free ]]; then printf '    %-5s %s\n' "$n" '(free)'; continue; fi
    j=${SEAT_JSON[$n]}; mark=''
    [[ ${SEAT_STATE[$n]} == mine ]] && mark=' <- this machine'
    [[ ${SEAT_STATE[$n]} == stale ]] && mark=' (abandoned, can be taken over)'
    printf '    %-5s %-14s %-24s %-16s %-21s %s%s\n' "$n" "$(jq -r .user <<<"$j")" "$(jq -r .host <<<"$j")" \
      "$(jq -r .ip <<<"$j")" "$(jq -r .claimed_at <<<"$j")" \
      "$(ago $(($(date +%s) - $(jq -r .renewed_epoch <<<"$j"))))" "$mark"
  done
  step "Recent activity"
  s3 GET "?list-type=2&max-keys=10&prefix=$(urienc "$(store_prefix)log/")"
  local key
  grep -o '<Key>[^<]*</Key>' "$S3_BODY" | sed 's/<[^>]*>//g' >"$TMP/keys" || true
  while read -r key; do
    s3 GET "${key#"$(store_prefix)"}"
    [[ $S3_STATUS == 200 ]] && jq -r '"    \(.at)  \(.user)@\(.host)  \(.event)  \(.detail)"' "$S3_BODY"
  done <"$TMP/keys"
  return 0
}

# --------------------------------------------------------- Unity licence ----

unity_bin() { printf '%s/%s/Editor/Unity' "$UNITY_ROOT" "$UNITY_INSTALLED"; }
ulf_path() { printf '%s/.local/share/unity3d/Unity/Unity_lic.ulf' "$(dev_home)"; }
named_dir() { printf '%s/.config/unity3d/Unity/licenses' "$(dev_home)"; }

license_files_present() {
  [[ -s $(ulf_path) ]] || compgen -G "$(named_dir)/*.xml" >/dev/null
}

unity_batch() {  # run the editor headless as the desktop user
  local log=$1; shift
  as_dev xvfb-run -a "$(unity_bin)" -batchmode -quit -nographics -logFile - "$@" >"$log" 2>&1 || true
}

license_save() {
  license_files_present || die "No Unity licence on this machine yet. Sign in to Unity Hub in the desktop first."
  [[ -s $(ulf_path) ]] || note "Note: this is a named-user licence. Unity accepts it only on this machine; other machines sign in themselves."
  local home files=(); home=$(dev_home)
  [[ -s $(ulf_path) ]] && files+=(.local/share/unity3d/Unity/Unity_lic.ulf)
  [[ -d $(named_dir) ]] && files+=(.config/unity3d/Unity/licenses)
  tar -C "$home" -cf "$TMP/licence.tar" "${files[@]}"
  vault_put unity-license.tar "$TMP/licence.tar"
  activity save-licence "${files[*]}"
  ok "Saved this machine's Unity licence to the store; other machines will pick it up automatically."
}

# Take a licence file created on someone's own computer (Unity Hub > Preferences
# > Licenses > Add > Get a free personal license) and put it in the store.
# Licences are not tied to the machine or the OS that made them, so this avoids
# signing in to Unity Hub on every new machine.
license_import() {
  local src=${1:-} home; home=$(dev_home)
  [[ -f $src ]] || die "Usage: gamedev-vm license import <Unity_lic.ulf or UnityEntitlementLicense.xml>"
  case $src in
    *.ulf)
      install -D -o "$DEV_USER" -g "$DEV_USER" -m 600 "$src" "$(ulf_path)" ;;
    *.xml)
      install -d -o "$DEV_USER" -g "$DEV_USER" "$(named_dir)"
      install -o "$DEV_USER" -g "$DEV_USER" -m 600 "$src" "$(named_dir)/$(basename "$src")" ;;
    *) die "Expected a .ulf or .xml licence file, got $src" ;;
  esac
  ok "Installed $(basename "$src") for $DEV_USER"
  license_save
}

license_restore() {
  vault_get unity-license.tar "$TMP/licence.tar" || return 1
  local home; home=$(dev_home)
  tar -C "$home" --no-same-owner -xf "$TMP/licence.tar"
  chown -R "$DEV_USER:" "$home/.local" "$home/.config" 2>/dev/null || true
  if [[ -s $(ulf_path) ]]; then
    ok "Restored the Unity licence from the store"
    return 0
  fi
  # A named-user licence (Unity 6 Personal) only works on the machine whose
  # Unity Hub is signed in, so the copy is a starting point, not a licence.
  warn "The stored licence is a named-user licence, which Unity only accepts on the machine that signed in."
  return 1
}

wait_for_signin() {
  local ip; ip=$(machine_ip)
  box "Unity Personal needs one sign-in. It is only asked on the first machine:" \
      "the licence is saved to the store and restored on every later machine." \
      "" \
      "  1. Open ${GAMEDEV_DESKTOP_URL:-https://$ip:$DESKTOP_PORT} in your browser (accept the certificate warning)" \
      "  2. Log in as user '$DEV_USER' with the desktop password" \
      "  3. Applications menu > Development > Unity Hub, sign in as $UNITY_EMAIL" \
      "  4. In Unity Hub: Preferences (gear icon) > Licenses > Add > Get a free personal license" \
      "" \
      "This script notices the licence by itself and carries on." \
      "Press s to skip for now; later run: sudo gamedev-vm license save" \
      "" \
      "Or do the same sign-in in Unity Hub on your own computer and copy the file over:" \
      "  sudo gamedev-vm license import Unity_lic.ulf"
  if ! tty_ok; then
    warn "No terminal to wait on. After signing in, run: sudo gamedev-vm license save"
    return 1
  fi
  local key
  while ! license_files_present; do
    key=''
    IFS= read -rsn1 -t 5 key </dev/tty || true
    [[ $key == s || $key == S ]] && { note "Skipped. After signing in, run: sudo gamedev-vm license save"; return 1; }
  done
  ok "Licence detected"
}

# Make Unity usable here. Only called while this machine holds a seat.
license_apply() {
  case $UNITY_LICENSE_TYPE in
    pro)
      [[ -n $UNITY_INSTALLED && -x $(unity_bin) ]] || { warn "Unity editor not installed, skipping activation"; return 0; }
      [[ -s $(ulf_path) ]] && { ok "Unity Pro already activated"; return 0; }
      note "Activating the Unity Pro serial (takes a minute)..."
      unity_batch "$TMP/activate.log" -serial "$UNITY_SERIAL" -username "$UNITY_EMAIL" -password "$UNITY_PASSWORD"
      if [[ -s $(ulf_path) ]]; then ok "Unity Pro activated"; activity activate pro
      else
        warn "Unity did not activate. Last lines of its log:"
        grep -iE 'licen|error|fail' "$TMP/activate.log" | tail -15 >&2 || tail -15 "$TMP/activate.log" >&2
      fi
      ;;
    personal)
      if license_files_present; then ok "Unity licence present"
      elif license_restore; then :
      elif wait_for_signin; then license_save
      fi
      ;;
  esac
}

# Give the licence back: Pro serials are returned to Unity, and a Personal
# licence is saved (so a refreshed file is kept) and removed from this machine.
license_unapply() {
  case $UNITY_LICENSE_TYPE in
    pro)
      [[ -s $(ulf_path) && -n $UNITY_INSTALLED && -x $(unity_bin) ]] || return 0
      note "Returning the Unity Pro activation..."
      unity_batch "$TMP/return.log" -returnlicense -username "$UNITY_EMAIL" -password "$UNITY_PASSWORD"
      if [[ -s $(ulf_path) ]]; then warn "Unity did not confirm the return; check id.unity.com"; else ok "Returned"; fi
      ;;
    personal)
      license_files_present || return 0
      license_save
      rm -f "$(ulf_path)"; rm -rf "$(named_dir)"
      ;;
  esac
}

cmd_license_claim() {
  if seat_claim; then
    ok "This machine holds Unity seat $SEAT of $UNITY_SEATS"
    license_apply
  else
    warn "All $UNITY_SEATS Unity seat(s) are in use, so Unity is not licensed on this machine."
    license_status
    note "Free one with 'sudo gamedev-vm license release' on its machine (or wait for it to shut down), then run: sudo gamedev-vm license claim"
    return 3
  fi
}

cmd_license_release() {
  unity_settings
  license_unapply
  seat_release
}

cmd_license_renew() {  # timer: keep the lease fresh, pick up a seat that freed up
  local had=$SEAT
  if seat_claim; then
    [[ -n $had && $had != "$SEAT" ]] && warn "Lost seat $had, now holding seat $SEAT"
    [[ -z $had ]] && { ok "A seat freed up: now holding seat $SEAT"; license_apply; }
    return 0
  fi
  [[ -n $had ]] && warn "This machine lost its Unity seat and none is free"
  return 3
}

cmd_license_reset() {
  vault_del unity.env
  UNITY_SETTINGS_LOADED=0 UNITY_LICENSE_TYPE='' UNITY_EMAIL='' UNITY_PASSWORD='' UNITY_SERIAL='' UNITY_SEATS=''
  unity_settings
}

# ------------------------------------------------------------- installers ----

install_base() {
  step "Base packages"
  apt_install ca-certificates curl jq gnupg openssl xz-utils tar pciutils xvfb xauth dbus-x11 \
    locales fonts-dejavu-core fonts-liberation xdg-utils sudo
  mkdir -p "$CONF_DIR"; chmod 700 "$CONF_DIR"
  export GNUPGHOME=$TMP/gnupg; mkdir -p "$GNUPGHOME"; chmod 700 "$GNUPGHOME"
}

install_gpu() {
  skipped gpu && return 0
  step "GPU"
  # A working nvidia-smi is the only reliable sign: containers show no PCI list,
  # and a card with no driver shows up in lspci only.
  if ! nvidia-smi >/dev/null 2>&1; then
    if lspci 2>/dev/null | grep -qi nvidia; then
      note "Installing the NVIDIA driver..."
      apt_install ubuntu-drivers-common
      ubuntu-drivers install
      box "The NVIDIA driver was installed and needs a reboot." "Reboot, then run the same setup command again. It continues where it stopped."
      exit 10
    fi
    note "No NVIDIA GPU found: apps will use software rendering (fine for testing, slow for real work)."
    return 0
  fi
  local name driver major
  name=$(nvidia-smi --query-gpu=name --format=csv,noheader | head -1)
  driver=$(nvidia-smi --query-gpu=driver_version --format=csv,noheader | head -1); major=${driver%%.*}
  ok "$name, driver $driver"
  case $name in
    *H100* | *H200* | *H800* | *A100* | *A800* | *B100* | *B200*)
      warn "$name is a compute card with almost no graphics hardware. Blender renders (Cycles) run fast," \
        "but the Unity and Blender viewports will be slow. For editing, prefer an RTX-class card (L40S, RTX 6000, A10, L4)." ;;
  esac
  if ! ldconfig -p | grep -q libEGL_nvidia; then
    note "Adding the NVIDIA OpenGL/Vulkan libraries (the driver was installed without them)"
    apt_install "$(pick_pkg "libnvidia-gl-$major-server" "libnvidia-gl-$major")" || warn "Could not add libnvidia-gl-$major; 3D may fall back to software"
  fi
  if ! command -v vglrun >/dev/null; then
    curl -fsSL -o "$TMP/virtualgl.deb" \
      "https://github.com/VirtualGL/virtualgl/releases/download/$VIRTUALGL_VERSION/virtualgl_${VIRTUALGL_VERSION}_amd64.deb"
    apt_update; DEBIAN_FRONTEND=noninteractive apt-get install -y -qq "$TMP/virtualgl.deb" >/dev/null
    ln -sf /opt/VirtualGL/bin/vglrun /usr/local/bin/vglrun
  fi
  /opt/VirtualGL/bin/vglserver_config -config +egl >/dev/null 2>&1 || warn "vglserver_config failed; GPU apps may fall back to software rendering"
  # vglserver_config restricts the GPU device nodes to the vglusers group; the
  # desktop user has to be in it or its apps silently render in software.
  getent group vglusers >/dev/null && usermod -aG vglusers "$DEV_USER"
  ok "Unity and Blender launch on the GPU through VirtualGL"
}

install_gpu_run() {
  cat >/usr/local/bin/gpu-run <<'EOF'
#!/bin/sh
# Run an OpenGL app on the NVIDIA GPU when there is one (VirtualGL, EGL back
# end). VirtualGL carries OpenGL only, so launchers pick the OpenGL backend.
if command -v vglrun >/dev/null 2>&1 && nvidia-smi >/dev/null 2>&1; then exec vglrun -d egl "$@"; fi
exec "$@"
EOF
  chmod 755 /usr/local/bin/gpu-run
}

install_desktop() {
  skipped desktop && return 0
  step "Browser desktop (XFCE over KasmVNC, port $DESKTOP_PORT)"
  apt_install xfce4 xfce4-terminal xfonts-base x11-xserver-utils ssl-cert mousepad
  if ! command -v kasmvncpasswd >/dev/null; then
    local codename; codename=$(grep -oP '^VERSION_CODENAME=\K.*' /etc/os-release)
    curl -fsSL -o "$TMP/kasmvnc.deb" \
      "https://github.com/kasmtech/KasmVNC/releases/download/v$KASMVNC_VERSION/kasmvncserver_${codename}_${KASMVNC_VERSION}_amd64.deb"
    apt_update; DEBIAN_FRONTEND=noninteractive apt-get install -y -qq "$TMP/kasmvnc.deb" >/dev/null
  fi
  usermod -aG ssl-cert "$DEV_USER"
  local home; home=$(dev_home)
  install -d -o "$DEV_USER" -g "$DEV_USER" "$home/.vnc"
  cat >"$home/.vnc/kasmvnc.yaml" <<EOF
network:
  interface: 0.0.0.0
  websocket_port: $DESKTOP_PORT
  ssl:
    require_ssl: $([[ $DESKTOP_TLS == on ]] && echo true || echo false)
desktop:
  resolution:
    width: 1920
    height: 1080
  allow_resize: true
EOF
  # Start the session directly: startxfce4's xinitrc probes 'systemctl --user',
  # which hangs when the desktop runs from a system service with no user manager.
  cat >"$home/.vnc/xstartup" <<'EOF'
#!/bin/sh
unset SESSION_MANAGER DBUS_SESSION_BUS_ADDRESS
export XDG_SESSION_TYPE=x11 XDG_CURRENT_DESKTOP=XFCE XDG_SESSION_DESKTOP=xfce
# No login session creates /run/user/<uid>; without a runtime dir Blender
# crashes probing Wayland instead of falling back to X11.
export XDG_RUNTIME_DIR="/tmp/runtime-$(id -u)"
mkdir -p "$XDG_RUNTIME_DIR" && chmod 700 "$XDG_RUNTIME_DIR"
exec dbus-launch --exit-with-session xfce4-session
EOF
  chmod 755 "$home/.vnc/xstartup"
  touch "$home/.vnc/.de-was-selected"
  chown -R "$DEV_USER:" "$home/.vnc"
  printf '%s\n%s\n' "$DESKTOP_PASSWORD" "$DESKTOP_PASSWORD" | as_dev kasmvncpasswd -u "$DEV_USER" -wo >/dev/null
  cat >/etc/systemd/system/gamedev-vm-desktop.service <<EOF
[Unit]
Description=gamedev-vm browser desktop (KasmVNC on port $DESKTOP_PORT)
After=network-online.target
Wants=network-online.target

[Service]
Type=forking
User=$DEV_USER
Environment=HOME=$home
ExecStartPre=-/usr/bin/vncserver -kill :1
ExecStart=/usr/bin/vncserver :1
ExecStop=/usr/bin/vncserver -kill :1
Restart=on-failure
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF
  if systemd_up; then
    systemctl daemon-reload
    systemctl enable gamedev-vm-desktop.service >/dev/null 2>&1
    systemctl restart gamedev-vm-desktop.service
  else
    # No systemd (container): start it directly, and it stays up on its own.
    as_dev /usr/bin/vncserver -kill :1 >/dev/null 2>&1 || true
    as_dev /usr/bin/vncserver :1 >/dev/null 2>&1 || warn "Could not start the desktop"
  fi
  ok "Desktop at $([[ $DESKTOP_TLS == on ]] && echo https || echo http)://$(machine_ip):$DESKTOP_PORT (user $DEV_USER)"
}

install_browser() {
  skipped browser && return 0
  skipped desktop && return 0
  step "Firefox (Unity Hub opens it to sign in)"
  if ! dpkg-query -W -f='${Status}' firefox 2>/dev/null | grep -q 'ok installed' || ! apt-cache policy firefox | grep -q packages.mozilla.org; then
    install -d -m 0755 /etc/apt/keyrings
    curl -fsSL https://packages.mozilla.org/apt/repo-signing-key.gpg -o /etc/apt/keyrings/packages.mozilla.org.asc
    echo "deb [signed-by=/etc/apt/keyrings/packages.mozilla.org.asc] https://packages.mozilla.org/apt mozilla main" \
      >/etc/apt/sources.list.d/mozilla.list
    printf 'Package: *\nPin: origin packages.mozilla.org\nPin-Priority: 1000\n' >/etc/apt/preferences.d/mozilla
    APT_UPDATED=0
    apt_install firefox
  fi
  update-alternatives --set x-www-browser /usr/bin/firefox >/dev/null 2>&1 || true
  local home; home=$(dev_home)
  install -d -o "$DEV_USER" -g "$DEV_USER" "$home/.config" "$home/.config/xfce4"
  printf 'WebBrowser=firefox\n' >"$home/.config/xfce4/helpers.rc"
  chown "$DEV_USER:" "$home/.config/xfce4/helpers.rc"
  as_dev xdg-settings set default-web-browser firefox.desktop >/dev/null 2>&1 || true
  ok "Firefox $(firefox --version 2>/dev/null | awk '{print $NF}')"
}

install_blender() {
  skipped blender && return 0
  step "Blender $BLENDER_VERSION"
  local dest=$BLENDER_ROOT/$BLENDER_VERSION series=${BLENDER_VERSION%.*} file m got=''
  file=blender-$BLENDER_VERSION-linux-x64.tar.xz
  apt_install libxi6 libxxf86vm1 libxfixes3 libxrender1 libgl1 libegl1 libxkbcommon0 libxkbcommon-x11-0 \
    libsm6 libice6 libx11-6 libxext6 libwayland-client0 libwayland-cursor0 libwayland-egl1 libdecor-0-0
  if [[ ! -x $dest/blender ]]; then
    for m in "${BLENDER_MIRRORS[@]}"; do
      curl -fsSL "$m/Blender$series/blender-$BLENDER_VERSION.sha256" -o "$TMP/blender.sha256" 2>/dev/null || continue
      note "Downloading from ${m%%/blender*}..."
      fetch "$m/Blender$series/$file" "$TMP/$file" || continue
      (cd "$TMP" && grep " $file\$" blender.sha256 | sha256sum -c --quiet -) || { warn "Checksum mismatch from $m"; continue; }
      got=1; break
    done
    [[ -n $got ]] || die "Could not download Blender $BLENDER_VERSION from any mirror"
    rm -rf "$dest.partial"; mkdir -p "$dest.partial"
    tar -xJf "$TMP/$file" --strip-components=1 -C "$dest.partial"
    rm -f "$TMP/$file"; rm -rf "$dest"; mv "$dest.partial" "$dest"
  fi
  ln -sfn "$dest/blender" /usr/local/bin/blender
  cat >/usr/share/applications/blender.desktop <<EOF
[Desktop Entry]
Type=Application
Name=Blender $BLENDER_VERSION
Exec=gpu-run $dest/blender --gpu-backend opengl %F
Icon=$dest/blender.svg
Terminal=false
Categories=Graphics;3DGraphics;Development;
MimeType=application/x-blender;
EOF
  ok "$("$dest/blender" -b --version 2>/dev/null | head -1)"
}

install_hub() {
  skipped hub && return 0
  step "Unity Hub"
  if ! command -v unityhub >/dev/null; then
    curl -fsSL https://hub.unity3d.com/linux/keys/public | gpg --dearmor --yes -o /usr/share/keyrings/unityhub.gpg
    echo "deb [signed-by=/usr/share/keyrings/unityhub.gpg] https://hub.unity3d.com/linux/repos/deb stable main" \
      >/etc/apt/sources.list.d/unityhub.list
    APT_UPDATED=0
    apt_install unityhub
  fi
  hub_sandbox
  # Menu entry and unityhub:// sign-in links go through the launcher; editors
  # started from the Hub inherit its GPU setup.
  if [[ -f /usr/share/applications/unityhub.desktop ]]; then
    mkdir -p /usr/local/share/applications
    sed -E 's#^Exec=[^ ]+#Exec=unityhub-launch#; s#^Categories=.*#Categories=Development;#' \
      /usr/share/applications/unityhub.desktop >/usr/local/share/applications/unityhub.desktop
  fi
  # Point the Hub at /opt/unity so it lists the editor installed below and
  # installs further versions there.
  local cfg; cfg=$(dev_home)/.config/UnityHub
  install -d -o "$DEV_USER" -g "$DEV_USER" "$(dev_home)/.config" "$cfg"
  printf '"%s"' "$UNITY_ROOT" >"$cfg/secondaryInstallPath.json"
  chown "$DEV_USER:" "$cfg/secondaryInstallPath.json"
  ok "Unity Hub $(dpkg-query -W -f='${Version}' unityhub)"
}

# Unity Hub is Electron, whose sandbox needs unprivileged user namespaces.
# Ubuntu 24.04 blocks those through AppArmor unless a profile allows them (as
# it ships for Chrome and VS Code), and the Hub's own start script does not
# notice, so the Hub dies with "No usable sandbox".
hub_sandbox() {
  if [[ $(cat /proc/sys/kernel/apparmor_restrict_unprivileged_userns 2>/dev/null) == 1 ]]; then
    mkdir -p /etc/apparmor.d
    cat >/etc/apparmor.d/unityhub <<'EOF'
abi <abi/4.0>,
include <tunables/global>

profile unityhub /usr/lib/unityhub/unityhub-bin flags=(unconfined) {
  userns,
  include if exists <local/unityhub>
}
EOF
    apparmor_parser -r /etc/apparmor.d/unityhub 2>/dev/null || note "AppArmor profile not loaded; the Hub will run without its sandbox"
  fi
  cat >/usr/local/bin/unityhub-launch <<'EOF'
#!/bin/bash
# Start Unity Hub on the GPU. Where user namespaces are unavailable even with
# the AppArmor profile (containers, hardened kernels) the Hub aborts with
# "No usable sandbox": retry once without the sandbox and remember that.
bin=/usr/lib/unityhub/unityhub-bin
mark="${XDG_CONFIG_HOME:-$HOME/.config}/gamedev-vm/hub-no-sandbox"
[ -e "$mark" ] && exec gpu-run "$bin" --no-sandbox "$@"
log=$(mktemp)
gpu-run "$bin" "$@" 2>"$log" &
pid=$!
for _ in $(seq 120); do
  kill -0 "$pid" 2>/dev/null || break
  grep -q 'No usable sandbox' "$log" && break
  sleep 0.5
done
if grep -q 'No usable sandbox' "$log"; then
  kill "$pid" 2>/dev/null; wait "$pid" 2>/dev/null
  rm -f "$log"; mkdir -p "${mark%/*}" && : >"$mark"
  exec gpu-run "$bin" --no-sandbox "$@"
fi
rm -f "$log"
wait "$pid"
EOF
  chmod 755 /usr/local/bin/unityhub-launch
}

unity_resolve() {  # sets UNITY_VERSION, UNITY_URL, UNITY_MD5, UNITY_SIZE, UNITY_DL_SIZE
  local q json
  if [[ -n $UNITY_VERSION ]]; then q="version=$UNITY_VERSION"; else q="stream=LTS"; fi
  json=$(curl -fsSL --retry 3 "$UNITY_RELEASES_API?limit=25&platform=LINUX&architecture=X86_64&order=RELEASE_DATE_DESC&$q") \
    || die "Could not reach Unity's release list"
  if [[ -z $UNITY_VERSION ]]; then
    UNITY_VERSION=$(jq -r '.results[].version | select(startswith("6000."))' <<<"$json" | sort -V | tail -1)
  fi
  local rel
  rel=$(jq -c --arg v "$UNITY_VERSION" \
    '.results[] | select(.version == $v) | .downloads[] | select(.platform == "LINUX" and .type == "TAR_XZ")' <<<"$json" | head -1)
  [[ -n $rel ]] || die "Unity $UNITY_VERSION has no Linux editor download (check the version number)"
  UNITY_URL=$(jq -r .url <<<"$rel")
  UNITY_MD5=$(jq -r '.integrity // ""' <<<"$rel")
  UNITY_SIZE=$(jq -r '.installedSize.value // 0' <<<"$rel")
  UNITY_DL_SIZE=$(jq -r '.downloadSize.value // empty' <<<"$rel")
}

install_unity_editor() {
  skipped unity-editor && return 0
  unity_resolve
  step "Unity Editor $UNITY_VERSION"
  local dest=$UNITY_ROOT/$UNITY_VERSION
  apt_install libglu1-mesa libvulkan1 libgbm1 libnss3 libxss1 libxtst6 libxrandr2 libxcursor1 libxinerama1 \
    libcap2 zlib1g cpio libc6-dev libgl1 libegl1 \
    "$(pick_pkg libasound2t64 libasound2)" "$(pick_pkg libgtk-3-0t64 libgtk-3-0)"
  mkdir -p "$UNITY_ROOT"
  if [[ ! -x $dest/Editor/Unity ]]; then
    # Download to disk first (resumable, verified), then unpack.
    local dl=$UNITY_ROOT/.download/Unity-$UNITY_VERSION.tar.xz have=0 avail
    mkdir -p "${dl%/*}"
    [[ -f $dl ]] && have=$(stat -c %s "$dl")
    avail=$(df --output=avail -B1 "$UNITY_ROOT" | tail -1)
    ((avail > UNITY_SIZE + ${UNITY_DL_SIZE:-0} - have + 2 * 1024 ** 3)) \
      || die "Not enough disk for Unity: needs about $(((UNITY_SIZE + ${UNITY_DL_SIZE:-0} - have) / 1024 ** 3 + 2)) GB free in $UNITY_ROOT, have $((avail / 1024 ** 3)) GB"
    note "Downloading $((${UNITY_DL_SIZE:-0} / 1024 ** 2)) MB (slow step; an interrupted run resumes where it stopped)..."
    fetch "$UNITY_URL" "$dl" "$UNITY_DL_SIZE" || die "Unity download keeps failing; run setup again to resume it"
    if [[ -n $UNITY_MD5 && "md5-$(openssl md5 -binary "$dl" | base64)" != "$UNITY_MD5" ]]; then
      rm -f "$dl"; die "Unity download was corrupted (checksum mismatch); run setup again"
    fi
    note "Unpacking (about $((UNITY_SIZE / 1024 ** 3)) GB)..."
    rm -rf "$dest.partial"; mkdir -p "$dest.partial"
    tar -xJf "$dl" -C "$dest.partial"
    rm -rf "$dest"; mv "$dest.partial" "$dest"; rm -f "$dl"
  fi
  chown -R "$DEV_USER:" "$UNITY_ROOT"
  UNITY_INSTALLED=$UNITY_VERSION; state_save
  local missing; missing=$(ldd "$dest/Editor/Unity" 2>/dev/null | awk '/not found/{print $1}' | sort -u | tr '\n' ' ')
  [[ -z $missing ]] || warn "Unity is missing libraries: $missing"
  cat >/usr/local/bin/unity-editor <<EOF
#!/bin/sh
exec gpu-run $dest/Editor/Unity -force-glcore "\$@"
EOF
  chmod 755 /usr/local/bin/unity-editor
  ok "Installed in $dest (the Hub lists it; command: unity-editor)"
}

# ---------------------------------------------------------- self + systemd ----

systemd_up() { [[ -d /run/systemd/system ]]; }

install_self() {
  local src=${BASH_SOURCE[0]:-}
  mkdir -p "$LIB_DIR"
  if [[ -f $src && $(readlink -f "$src") != "$LIB_DIR/setup.sh" ]]; then
    install -m 755 "$src" "$LIB_DIR/setup.sh"
  fi
  [[ -f $LIB_DIR/setup.sh ]] || { warn "Could not keep a copy of this script (was it piped into bash?); 'gamedev-vm' command not installed"; return 0; }
  ln -sfn "$LIB_DIR/setup.sh" "$BIN"
}

install_services() {
  systemd_up || { warn "systemd is not running: seats will not be renewed or freed automatically"; return 0; }
  cat >/etc/systemd/system/gamedev-vm-seat.service <<EOF
[Unit]
Description=gamedev-vm: hold a Unity seat while this machine runs, give it back on shutdown
After=network-online.target
Wants=network-online.target

[Service]
Type=oneshot
RemainAfterExit=yes
ExecStart=-$BIN license claim
ExecStop=$BIN license release
TimeoutStopSec=180

[Install]
WantedBy=multi-user.target
EOF
  cat >/etc/systemd/system/gamedev-vm-seat-renew.service <<EOF
[Unit]
Description=gamedev-vm: renew this machine's Unity seat
After=network-online.target

[Service]
Type=oneshot
ExecStart=$BIN license renew
EOF
  cat >/etc/systemd/system/gamedev-vm-seat-renew.timer <<EOF
[Unit]
Description=gamedev-vm: renew the Unity seat every 5 minutes

[Timer]
OnBootSec=2min
OnUnitActiveSec=5min

[Install]
WantedBy=timers.target
EOF
  systemctl daemon-reload
  systemctl enable gamedev-vm-seat.service gamedev-vm-seat-renew.timer >/dev/null 2>&1
  # Start the seat unit now so its shutdown hook is armed from the first boot
  # (its claim is a no-op renewal when this run already took the seat).
  systemctl start gamedev-vm-seat.service gamedev-vm-seat-renew.timer || true
}

# ------------------------------------------------------------- commands ----

preflight() {
  [[ $EUID -eq 0 ]] || die "Run as root (sudo)"
  # shellcheck source=/dev/null
  [[ -r /etc/os-release ]] && . /etc/os-release
  [[ ${ID:-} == ubuntu ]] || die "Needs Ubuntu 22.04 or 24.04 (found ${PRETTY_NAME:-unknown})"
  [[ ${VERSION_ID:-} == 22.04 || ${VERSION_ID:-} == 24.04 ]] || warn "Tested on Ubuntu 22.04 and 24.04, this is $VERSION_ID"
  [[ $(uname -m) == x86_64 ]] || die "Needs an x86_64 machine (Unity has no Linux ARM editor), this is $(uname -m)"
}

print_info() {
  desktop_settings
  local seat='no Unity seat held'; [[ -n $SEAT ]] && seat="Unity seat $SEAT"
  box "${B}Ready.${N}" \
      "Desktop:  ${GAMEDEV_DESKTOP_URL:-$([[ $DESKTOP_TLS == on ]] && echo https || echo http)://$(machine_ip):$DESKTOP_PORT}   user $DEV_USER   password $DESKTOP_PASSWORD" \
      "Unity:    ${UNITY_INSTALLED:-not installed}  (open Unity Hub from the Applications menu)" \
      "Blender:  $(blender -b --version 2>/dev/null | head -1 | awk '{print $2}' || echo 'not installed')" \
      "Seat:     $seat" \
      "" \
      "Who uses which licence:   sudo gamedev-vm license status" \
      "Next machine:             sudo gamedev-vm token   (then on the new VM: sudo GAMEDEV_TOKEN=<token> bash setup.sh)"
}

cmd_install() {
  preflight
  install_base
  state_load
  store_load
  ask GAMEDEV_USER "Your name (shown next to the seat this machine holds)" "${SUDO_USER:-$(hostname)}"
  state_save
  # Ask every question up front so the long downloads run unattended.
  unity_settings
  desktop_settings
  ensure_dev_user
  install_gpu
  install_gpu_run
  install_desktop
  install_browser
  install_blender
  install_hub
  install_unity_editor
  install_self
  step "Unity licence"
  local rc=0
  cmd_license_claim || rc=$?
  install_services
  print_info
  return $rc
}

usage() { sed -n '2,/^set -euo/p' "${BASH_SOURCE[0]}" | sed '$d; s/^# \{0,1\}//'; }

main() {
  local cmd=${1:-install}
  case $cmd in -h | --help | help) usage; return 0 ;; esac
  TMP=$(mktemp -d); trap 'rm -rf "$TMP"' EXIT
  S3_BODY=$TMP/s3.body S3_HDRS=$TMP/s3.hdrs
  if [[ $cmd == install ]]; then cmd_install; return; fi
  preflight
  export GNUPGHOME=$TMP/gnupg; mkdir -p "$GNUPGHOME"; chmod 700 "$GNUPGHOME"
  [[ -f $STORE_FILE ]] || die "This machine is not set up yet. Run: sudo bash setup.sh"
  state_load
  store_load
  case $cmd in
    token) token_encode; echo ;;
    info) print_info ;;
    license)
      case ${2:-status} in
        status) license_status ;;
        claim) cmd_license_claim ;;
        renew) cmd_license_renew ;;
        release) cmd_license_release ;;
        save) license_save ;;
        import) license_import "${3:-}" ;;
        reset) cmd_license_reset ;;
        *) die "Unknown: license ${2:-}. Try: status, claim, release, save, import, reset" ;;
      esac ;;
    *) die "Unknown command: $cmd (try --help)" ;;
  esac
}

# Parsed in full before running, so a script piped in or edited mid-run cannot misbehave.
main "$@"; exit $?
