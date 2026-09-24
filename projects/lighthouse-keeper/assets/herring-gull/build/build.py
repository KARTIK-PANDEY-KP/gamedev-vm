# -*- coding: utf-8 -*-
"""
CHR_HerringGull_01 — procedural build for CANDLEWICK LIGHT.

Authority: assets/herring-gull/brief.md.  Every number below is taken from the
brief's Geometry table; the refs/ images informed shape language only.

Run:
  "/Applications/Blender.app/Contents/MacOS/Blender" --background \
      --python assets/herring-gull/build/build.py

Authoring space: Blender Z-up, metres, bird faces -Y (bill toward the viewer in
Front Ortho).  Character left = +X.  Origin at the foot-contact plane between the
feet, on the bilateral centre plane.
"""

import json
import math
import os
import struct
import sys

import bmesh
import bpy
from mathutils import Vector

# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------

BUILD_DIR = os.path.dirname(os.path.abspath(__file__))
ASSET_DIR = os.path.dirname(BUILD_DIR)
GLB_PATH = os.path.join(BUILD_DIR, "asset.glb")
LOG_PATH = os.path.join(BUILD_DIR, "build.log")
RESULT_PATH = os.path.join(BUILD_DIR, "result.json")

# ---------------------------------------------------------------------------
# Brief constants (metres).  Geometry table, brief.md.
# ---------------------------------------------------------------------------

D_LENGTH = 0.620          # bill tip -> tail tip
D_WINGSPAN = 1.440        # tip to tip, wings spread
D_HEIGHT = 0.380          # feet to crown, head up
D_BODY_WIDTH = 0.170      # wings folded
D_BODY_DEPTH = 0.200      # belly to back
D_BILL_LEN = 0.055
D_BILL_DEPTH = 0.018
D_TARSUS = 0.065
D_FOOT = 0.060            # including web
D_TAIL_FROM_VENT = 0.160
D_WEB_THICK = 0.004
D_CHORD_ROOT = 0.220
D_CHORD_TIP = 0.050
D_NOTCH = 0.035           # third left primary broken short by this
TRI_MAX = 3400
TRI_MIN = 2900            # acceptance criterion 1
TOL = 0.02                # +/-2 %

# Derived layout.  Bill tip and tail tip bracket D_LENGTH about the feet.
Y_BILL_TIP = -0.370
Y_TAIL_TIP = Y_BILL_TIP + D_LENGTH        # +0.250
Y_BILL_BASE = Y_BILL_TIP + D_BILL_LEN     # -0.315
Y_VENT = Y_TAIL_TIP - D_TAIL_FROM_VENT    # +0.090
X_HALF_SPAN = D_WINGSPAN / 2.0            # 0.720
X_WING_ROOT = 0.030
Z_TARSUS_BASE = 0.006                     # top of the foot at the ankle
Z_TARSUS_TOP = Z_TARSUS_BASE + D_TARSUS   # intertarsal joint, 0.071

# Mesh resolutions, tuned to land inside [TRI_MIN, TRI_MAX].
BODY_SIDES = 18
BODY_STATIONS = 34
WING_NV = 5
TAIL_NU, TAIL_NV = 14, 6
FOOT_NU, FOOT_NV = 15, 5
LEG_SIDES, LEG_RINGS = 8, 6
EYE_SEG, EYE_RING = 8, 5

# ---------------------------------------------------------------------------
# Small maths helpers
# ---------------------------------------------------------------------------


def clamp(x, lo, hi):
    return lo if x < lo else (hi if x > hi else x)


def smoothstep(a, b, x):
    if b <= a:
        return 0.0
    t = clamp((x - a) / (b - a), 0.0, 1.0)
    return t * t * (3.0 - 2.0 * t)


def lerp(a, b, t):
    return a + (b - a) * t


def catmull(p0, p1, p2, p3, t):
    return 0.5 * (
        (2.0 * p1)
        + (-p0 + p2) * t
        + (2.0 * p0 - 5.0 * p1 + 4.0 * p2 - p3) * t * t
        + (-p0 + 3.0 * p1 - 3.0 * p2 + p3) * t * t * t
    )


def resample_rows(rows, n):
    """Catmull-Rom resample of a list of equal-length numeric tuples."""
    m = len(rows)
    ncol = len(rows[0])
    out = []
    for k in range(n):
        u = k * (m - 1) / float(n - 1)
        i = min(int(u), m - 2)
        f = u - i
        i0, i1, i2, i3 = max(i - 1, 0), i, i + 1, min(i + 2, m - 1)
        out.append(
            tuple(
                catmull(rows[i0][c], rows[i1][c], rows[i2][c], rows[i3][c], f)
                for c in range(ncol)
            )
        )
    return out


# ---------------------------------------------------------------------------
# Scene setup
# ---------------------------------------------------------------------------


def reset_scene():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    scn = bpy.context.scene
    scn.unit_settings.system = "METRIC"
    scn.unit_settings.scale_length = 1.0
    scn.unit_settings.length_unit = "METERS"
    scn.unit_settings.use_separate = False


def finish_object(bm, name):
    """Recalculate outward normals, ensure positive volume, emit an object."""
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:])
    if bm.calc_volume(signed=True) < 0.0:
        bmesh.ops.reverse_faces(bm, faces=bm.faces[:])
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    me.validate(verbose=False)
    for poly in me.polygons:
        poly.use_smooth = True
    ob = bpy.data.objects.new(name, me)
    bpy.context.collection.objects.link(ob)
    return ob


# ---------------------------------------------------------------------------
# Generic builders
# ---------------------------------------------------------------------------


def shell_uv(nu, nv, fmid, fthick, name):
    """Closed shell from a (nu x nv) mid-surface offset +/- fthick along +Z.

    Where fthick is 0 the top and bottom vertices are welded, so the shell seals
    itself along that boundary; elsewhere the rectangle border is walled in.
    Result is a single connected, watertight, quad-dominant island.
    """
    bm = bmesh.new()
    top = [[None] * nv for _ in range(nu)]
    bot = [[None] * nv for _ in range(nu)]
    for i in range(nu):
        u = i / float(nu - 1)
        for j in range(nv):
            v = j / float(nv - 1)
            mid = Vector(fmid(u, v))
            t = fthick(u, v)
            if t <= 1e-7:
                shared = bm.verts.new(mid)
                top[i][j] = shared
                bot[i][j] = shared
            else:
                top[i][j] = bm.verts.new(mid + Vector((0.0, 0.0, t)))
                bot[i][j] = bm.verts.new(mid - Vector((0.0, 0.0, t)))

    def add(vlist):
        seq = []
        for v in vlist:
            if not seq or seq[-1] is not v:
                seq.append(v)
        while len(seq) > 1 and seq[0] is seq[-1]:
            seq.pop()
        if len(seq) < 3:
            return
        try:
            bm.faces.new(seq)
        except ValueError:
            pass

    for i in range(nu - 1):
        for j in range(nv - 1):
            add([top[i][j], top[i + 1][j], top[i + 1][j + 1], top[i][j + 1]])
            add([bot[i][j], bot[i][j + 1], bot[i + 1][j + 1], bot[i + 1][j]])

    for j in range(nv - 1):
        add([top[0][j], top[0][j + 1], bot[0][j + 1], bot[0][j]])
        add([top[nu - 1][j + 1], top[nu - 1][j], bot[nu - 1][j], bot[nu - 1][j + 1]])
    for i in range(nu - 1):
        add([top[i + 1][0], top[i][0], bot[i][0], bot[i + 1][0]])
        add([top[i][nv - 1], top[i + 1][nv - 1], bot[i + 1][nv - 1], bot[i][nv - 1]])

    return finish_object(bm, name)


def tube_loft(rings, name, cap_start=None, cap_end=None):
    """Closed tube through a list of equal-length vertex-position rings.

    cap_start / cap_end are pole positions; a triangle fan closes each end.
    """
    bm = bmesh.new()
    n = len(rings[0])
    vr = [[bm.verts.new(Vector(p)) for p in ring] for ring in rings]

    def add(vlist):
        seq = []
        for v in vlist:
            if not seq or seq[-1] is not v:
                seq.append(v)
        if len(seq) < 3:
            return
        try:
            bm.faces.new(seq)
        except ValueError:
            pass

    for r in range(len(vr) - 1):
        for k in range(n):
            k2 = (k + 1) % n
            add([vr[r][k], vr[r][k2], vr[r + 1][k2], vr[r + 1][k]])

    if cap_start is not None:
        p = bm.verts.new(Vector(cap_start))
        for k in range(n):
            add([p, vr[0][(k + 1) % n], vr[0][k]])
    if cap_end is not None:
        p = bm.verts.new(Vector(cap_end))
        for k in range(n):
            add([p, vr[-1][k], vr[-1][(k + 1) % n]])

    return finish_object(bm, name)


# ---------------------------------------------------------------------------
# Body, neck, head and bill — one lofted watertight shell
# ---------------------------------------------------------------------------

# (y, z_centre, half_width, half_height_up, half_height_down)
# Crown peak lands on z = 0.380 (station 8); torso reaches half_width 0.0850
# (= 0.170 body width) and top 0.2950 / bottom 0.0950 (= 0.200 body depth)
# at station 17.  Bill tip at y = -0.370, rear pole at y = +0.138.
BODY_STATIONS_CTRL = [
    # Bill: short, deep and blunt with a gonys bulge under the tip and a
    # hooked culmen, per refs/left.png — not a spike.  Depth 0.0180 at base.
    (-0.3700, 0.3302, 0.0014, 0.0018, 0.0024),   # blunt hooked tip
    (-0.3672, 0.3306, 0.0032, 0.0036, 0.0050),
    (-0.3620, 0.3312, 0.0042, 0.0046, 0.0062),   # hook
    (-0.3540, 0.3324, 0.0050, 0.0054, 0.0072),   # gonys
    (-0.3440, 0.3334, 0.0058, 0.0060, 0.0074),
    (-0.3330, 0.3343, 0.0068, 0.0068, 0.0076),
    (-0.3230, 0.3350, 0.0078, 0.0080, 0.0088),
    (-0.3150, 0.3353, 0.0082, 0.0086, 0.0094),   # bill base, depth 0.0180
    # Head: big and round, crown plateau on z = 0.3800.
    (-0.3050, 0.3370, 0.0165, 0.0230, 0.0170),   # forehead
    (-0.2930, 0.3350, 0.0240, 0.0370, 0.0250),   # eye level
    (-0.2800, 0.3300, 0.0290, 0.0470, 0.0330),
    (-0.2660, 0.3270, 0.0305, 0.0530, 0.0390),   # crown, top = 0.3800
    (-0.2520, 0.3230, 0.0300, 0.0570, 0.0420),   # crown, top = 0.3800
    (-0.2380, 0.3170, 0.0280, 0.0560, 0.0440),   # nape
    # Neck: thick, no waist, running straight into the chest.
    (-0.2250, 0.3090, 0.0270, 0.0490, 0.0450),
    (-0.2100, 0.2980, 0.0268, 0.0430, 0.0480),
    (-0.1950, 0.2870, 0.0280, 0.0380, 0.0540),
    (-0.1780, 0.2760, 0.0310, 0.0340, 0.0640),
    (-0.1600, 0.2640, 0.0365, 0.0330, 0.0790),
    (-0.1400, 0.2480, 0.0460, 0.0370, 0.0990),
    # Torso: full breast forward, underline rising steadily to the vent.
    (-0.1150, 0.2330, 0.0580, 0.0470, 0.1200),
    (-0.0880, 0.2220, 0.0700, 0.0600, 0.1250),
    (-0.0550, 0.2120, 0.0800, 0.0760, 0.1170),
    (-0.0200, 0.2070, 0.0850, 0.0870, 0.1120),   # widest + deepest
    (0.0150, 0.2080, 0.0840, 0.0870, 0.1030),
    (0.0480, 0.2130, 0.0770, 0.0820, 0.0900),
    (0.0800, 0.2180, 0.0650, 0.0740, 0.0740),    # vent
    (0.1050, 0.2210, 0.0490, 0.0580, 0.0580),
    (0.1250, 0.2210, 0.0320, 0.0400, 0.0400),
    (0.1400, 0.2190, 0.0160, 0.0210, 0.0210),
    (0.1480, 0.2180, 0.0010, 0.0012, 0.0012),    # rear pole, low so the
]


def build_body():
    rows = resample_rows(BODY_STATIONS_CTRL, BODY_STATIONS)
    rings = []
    for y, zc, w, ht, hb in rows[1:-1]:
        w = max(w, 4e-4)
        ht = max(ht, 4e-4)
        hb = max(hb, 4e-4)
        ring = []
        for k in range(BODY_SIDES):
            a = 2.0 * math.pi * k / BODY_SIDES
            c, s = math.cos(a), math.sin(a)
            # Superelliptic flattening of the back, convex belly left round.
            h = ht if s >= 0.0 else hb
            e = 0.80 if s >= 0.0 else 1.0
            ring.append((w * c, y, zc + h * math.copysign(abs(s) ** e, s)))
        rings.append(ring)
    head_pole = (0.0, rows[0][0], rows[0][1])
    tail_pole = (0.0, rows[-1][0], rows[-1][1])
    return tube_loft(rings, "GullBody", cap_start=head_pole, cap_end=tail_pole)


# ---------------------------------------------------------------------------
# Wing — spread flat at 0 deg dihedral, four splayed primary slots at the hand
# ---------------------------------------------------------------------------

# Four outer primaries as chord peaks with deep slots between them.  The tip
# peak sits at u = 1.0 so the outermost feather carries the 0.050 m tip chord
# and the 0.720 m half-span.
PRIMARY_U = (0.745, 0.830, 0.915, 1.000)
PRIMARY_CHORD = (0.145, 0.120, 0.090, 0.050)
SLOT_U = (0.7875, 0.8725, 0.9575)
U_HAND = 0.700


# Explicit spanwise stations.  The arm gets 11; the hand gets 15, placed so a
# station lands exactly on every primary peak and every slot minimum.  This is
# the brief's "spend the wing budget at the hand and the outer primaries".
WING_U_STATIONS = (
    [0.068 * k for k in range(11)]
    + [0.700, 0.72250, 0.745, 0.76625, 0.7875, 0.80875, 0.830, 0.85125,
       0.8725, 0.89375, 0.915, 0.93625, 0.9575, 0.97875, 1.000]
)
WING_NU = len(WING_U_STATIONS)


def _hand_core(u):
    """Solid hand from the leading edge back to the primary bases."""
    return lerp(0.046, 0.020, clamp((u - U_HAND) / (1.0 - U_HAND), 0.0, 1.0))


def _chord(u, notch_index=None):
    if u < U_HAND:
        # Arm: 0.220 at the shoulder easing to the first primary's chord.
        t = smoothstep(0.0, U_HAND, u)
        return lerp(D_CHORD_ROOT, PRIMARY_CHORD[0], t)
    knots = [(U_HAND, PRIMARY_CHORD[0])]
    for idx, (ku, kc) in enumerate(zip(PRIMARY_U, PRIMARY_CHORD)):
        c = kc
        if notch_index is not None and idx == notch_index:
            c = kc - D_NOTCH
        knots.append((ku, c))
    for su in SLOT_U:
        knots.append((su, _hand_core(su)))
    knots.sort()
    for a, b in zip(knots, knots[1:]):
        if a[0] <= u <= b[0]:
            t = smoothstep(a[0], b[0], u)
            return lerp(a[1], b[1], t)
    return knots[-1][1]


def _wing_le(u):
    """Leading-edge Y: near-straight, sweeping back through the hand."""
    return -0.145 + 0.110 * (u ** 1.6)


def _wing_z(u):
    return lerp(0.2540, 0.2480, u)      # flat, 0 deg dihedral


def _wing_thick(u, v):
    tmax = lerp(0.0110, 0.0006, smoothstep(0.25, 1.0, u))
    prof = 0.0
    if v < 0.30:
        prof = lerp(0.35, 1.0, v / 0.30)
    else:
        prof = 1.0 - smoothstep(0.30, 1.0, v)
    return tmax * prof


def build_wing(side, name):
    """side = +1 for the character's left (+X), -1 for the right."""
    notch = 2 if side > 0 else None     # third modelled primary, left wing only
    us = WING_U_STATIONS

    def fmid(uu, v):
        u = us[min(int(round(uu * (WING_NU - 1))), WING_NU - 1)]
        x = X_WING_ROOT + (X_HALF_SPAN - X_WING_ROOT) * u
        le = _wing_le(u)
        y = le + _chord(u, notch) * v
        z = _wing_z(u)
        # Slight camber so the wing is not a flat slab.
        z += 0.004 * math.sin(math.pi * clamp(v, 0.0, 1.0)) * (1.0 - u * 0.7)
        return (side * x, y, z)

    def fthick(uu, v):
        u = us[min(int(round(uu * (WING_NU - 1))), WING_NU - 1)]
        return _wing_thick(u, v)

    return shell_uv(WING_NU, WING_NV, fmid, fthick, name)


# ---------------------------------------------------------------------------
# Tail — fan from the vent to the tail tip
# ---------------------------------------------------------------------------


def build_tail():
    half_w_base = 0.034
    half_w_tip = 0.058

    def fmid(u, v):
        s = (u - 0.5) * 2.0                       # -1 .. +1 across the fan
        y = lerp(Y_VENT - 0.008, Y_TAIL_TIP, v)
        half = lerp(half_w_base, half_w_tip, v)
        # Slightly rounded rear edge: outer rectrices stop a touch short.
        y -= (1.0 - math.sqrt(max(0.0, 1.0 - s * s))) * 0.022 * v
        z = lerp(0.2140, 0.1960, v)
        return (s * half, y, z)

    def fthick(u, v):
        s = abs((u - 0.5) * 2.0)
        edge = 1.0 - smoothstep(0.72, 1.0, s)
        return 0.0080 * (1.0 - smoothstep(0.0, 1.0, v)) * edge + 0.0014 * edge * (1.0 - v)

    return shell_uv(TAIL_NU, TAIL_NV, fmid, fthick, "GullTail")


# ---------------------------------------------------------------------------
# Foot — three webbed forward toes plus hallux, solid 0.004 m web, flat sole
# ---------------------------------------------------------------------------

FOOT_X = 0.0320
TOE_ANGLES = (-0.5236, 0.0, 0.5236)      # -30, 0, +30 degrees from forward


def _toe_ridge(u):
    """1.0 on a toe axis, 0.0 in the web between toes."""
    a = lerp(-0.6632, 0.6632, u)          # -38 .. +38 degrees
    best = 0.0
    for ta in TOE_ANGLES:
        d = abs(a - ta) / 0.1600
        best = max(best, 1.0 - smoothstep(0.0, 1.0, min(d, 1.0)))
    return best


def build_foot(side, name, y_ankle):
    r_toe = 0.0440
    r_web = 0.0340
    r_hallux = 0.0415
    r_ankle = 0.0060

    def fthick(u, v):
        if v >= 0.999:
            return 0.0
        ridge = _toe_ridge(u)
        base = D_WEB_THICK / 2.0                      # 0.002 -> 0.004 m solid
        t = base + 0.0020 * ridge
        return t * (1.0 - smoothstep(0.80, 1.0, v))

    def fmid(u, v):
        a = lerp(-0.6632, 0.6632, u)
        ridge = _toe_ridge(u)
        r = lerp(r_web, r_toe, ridge)
        # Taper the outer two toes very slightly for a natural fan.
        r *= 1.0 - 0.06 * abs((u - 0.5) * 2.0)
        rr = lerp(r_ankle, r, v)
        x = math.sin(a) * rr
        y = -math.cos(a) * rr
        # Hallux: a short spur behind the ankle on the inboard side.
        y += (1.0 - smoothstep(0.0, 0.16, u)) * v * r_hallux
        # Lift the mid-surface by the half-thickness so the sole is flat on z=0.
        return (side * (FOOT_X + x), y_ankle + y, fthick(u, v))

    return shell_uv(FOOT_NU, FOOT_NV, fmid, fthick, name)


# ---------------------------------------------------------------------------
# Leg — tarsus tube from the ankle up into the belly
# ---------------------------------------------------------------------------

LEG_PROFILE = [
    # (z, radius)
    (Z_TARSUS_BASE, 0.0068),
    (0.0230, 0.0056),
    (0.0450, 0.0054),
    (Z_TARSUS_TOP, 0.0064),      # intertarsal joint, z = 0.071
    (0.0960, 0.0105),
    (0.1280, 0.0150),
]


def build_leg(side, name, y_ankle):
    rings = []
    for z, r in LEG_PROFILE:
        ring = []
        for k in range(LEG_SIDES):
            a = 2.0 * math.pi * k / LEG_SIDES
            ring.append((side * FOOT_X + r * math.cos(a), y_ankle + 0.004 + r * math.sin(a), z))
        rings.append(ring)
    return tube_loft(
        rings,
        name,
        cap_start=(side * FOOT_X, y_ankle + 0.004, Z_TARSUS_BASE - 0.0035),
        cap_end=(side * FOOT_X, y_ankle + 0.004, 0.1420),
    )


# ---------------------------------------------------------------------------
# Eyes — welded-looking spheres proud of the socket rim
# ---------------------------------------------------------------------------

EYE_POS = (0.0240, -0.2830, 0.3480)
EYE_R = 0.0068


def build_eye(side, name):
    bm = bmesh.new()
    bmesh.ops.create_uvsphere(
        bm, u_segments=EYE_SEG, v_segments=EYE_RING, radius=EYE_R
    )
    off = Vector((side * EYE_POS[0], EYE_POS[1], EYE_POS[2]))
    for v in bm.verts:
        v.co += off
    return finish_object(bm, name)


# ---------------------------------------------------------------------------
# Assembly
# ---------------------------------------------------------------------------

Y_ANKLE = 0.020          # pre-shift; corrected to put the contact patch on Y=0
PART_ORDER = [
    "GullBody", "GullWing_L", "GullWing_R", "GullTail",
    "GullLeg_L", "GullLeg_R", "GullFoot_L", "GullFoot_R",
    "GullEye_L", "GullEye_R",
]


def build_parts():
    parts = {}
    parts["GullBody"] = build_body()
    parts["GullWing_L"] = build_wing(+1, "GullWing_L")
    parts["GullWing_R"] = build_wing(-1, "GullWing_R")
    parts["GullTail"] = build_tail()
    parts["GullFoot_L"] = build_foot(+1, "GullFoot_L", Y_ANKLE)
    parts["GullFoot_R"] = build_foot(-1, "GullFoot_R", Y_ANKLE)
    parts["GullLeg_L"] = build_leg(+1, "GullLeg_L", Y_ANKLE)
    parts["GullLeg_R"] = build_leg(-1, "GullLeg_R", Y_ANKLE)
    parts["GullEye_L"] = build_eye(+1, "GullEye_L")
    parts["GullEye_R"] = build_eye(-1, "GullEye_R")
    return parts


def contact_centroid(parts):
    """Area-weighted centroid of the sole faces (the point the bird stands on)."""
    tot_a = 0.0
    acc = Vector((0.0, 0.0, 0.0))
    for nm in ("GullFoot_L", "GullFoot_R"):
        me = parts[nm].data
        for poly in me.polygons:
            c = poly.center
            if c.z < 1e-4 and poly.normal.z < -0.5:
                acc += c * poly.area
                tot_a += poly.area
    if tot_a <= 0.0:
        return Vector((0.0, 0.0, 0.0))
    return acc / tot_a


def translate_all(parts, delta):
    for ob in parts.values():
        for v in ob.data.vertices:
            v.co += delta


# ---------------------------------------------------------------------------
# Rig — 9 bones exactly, brief.md "Rig"
# ---------------------------------------------------------------------------

BONES = [
    ("root",      None,         (0.000,  0.000, 0.000), (0.000,  0.000, 0.060), False),
    ("body",      "root",       (0.000,  0.060, 0.200), (0.000, -0.120, 0.245), True),
    ("neck",      "body",       (0.000, -0.120, 0.245), (0.000, -0.205, 0.305), True),
    ("head",      "neck",       (0.000, -0.205, 0.305), (0.000, -0.315, 0.336), True),
    ("wing_L_01", "body",       (0.055, -0.100, 0.258), (0.420, -0.060, 0.256), True),
    ("wing_L_02", "wing_L_01",  (0.420, -0.060, 0.256), (0.720, -0.020, 0.254), True),
    ("wing_R_01", "body",       (-0.055, -0.100, 0.258), (-0.420, -0.060, 0.256), True),
    ("wing_R_02", "wing_R_01",  (-0.420, -0.060, 0.256), (-0.720, -0.020, 0.254), True),
    ("tail",      "body",       (0.000,  0.085, 0.222), (0.000,  0.240, 0.196), True),
]


def build_armature(shift_y):
    arm = bpy.data.armatures.new("GullRig")
    ob = bpy.data.objects.new("GullRig", arm)
    bpy.context.collection.objects.link(ob)
    bpy.context.view_layer.objects.active = ob
    bpy.ops.object.mode_set(mode="EDIT")
    made = {}
    for name, parent, h, t, deform in BONES:
        eb = arm.edit_bones.new(name)
        eb.head = (h[0], h[1] + (shift_y if name != "root" else 0.0), h[2])
        eb.tail = (t[0], t[1] + (shift_y if name != "root" else 0.0), t[2])
        eb.use_deform = deform
        if parent:
            eb.parent = made[parent]
        made[name] = eb
    bpy.ops.object.mode_set(mode="OBJECT")
    return ob


def bind(parts, arm, shift_y):
    """Deterministic vertex weights: at most 2 influences, normalised to 1.0."""

    def bw(ob, pairs):
        groups = {}
        for vi, ws in pairs:
            for name, w in ws:
                if name not in groups:
                    groups[name] = ob.vertex_groups.new(name=name)
                groups[name].add([vi], w, "REPLACE")

    for nm, ob in parts.items():
        assign = []
        for v in ob.data.vertices:
            y = v.co.y - shift_y
            x = v.co.x
            if nm == "GullBody":
                if y < -0.235:
                    ws = [("head", 1.0)]
                elif y < -0.200:
                    t = (y + 0.235) / 0.035
                    ws = [("head", 1.0 - t), ("neck", t)]
                elif y < -0.155:
                    ws = [("neck", 1.0)]
                elif y < -0.120:
                    t = (y + 0.155) / 0.035
                    ws = [("neck", 1.0 - t), ("body", t)]
                else:
                    ws = [("body", 1.0)]
            elif nm in ("GullWing_L", "GullWing_R"):
                sfx = "L" if nm.endswith("_L") else "R"
                a = abs(x)
                if a < 0.090:
                    t = smoothstep(0.055, 0.090, a)
                    ws = [("body", 1.0 - t), ("wing_%s_01" % sfx, t)]
                elif a < 0.380:
                    ws = [("wing_%s_01" % sfx, 1.0)]
                elif a < 0.460:
                    t = (a - 0.380) / 0.080
                    ws = [("wing_%s_01" % sfx, 1.0 - t), ("wing_%s_02" % sfx, t)]
                else:
                    ws = [("wing_%s_02" % sfx, 1.0)]
            elif nm == "GullTail":
                t = smoothstep(0.082, 0.120, y)
                ws = [("body", 1.0 - t), ("tail", t)]
            elif nm.startswith("GullEye"):
                ws = [("head", 1.0)]
            else:
                ws = [("body", 1.0)]          # legs and feet, Assumption A6
            s = sum(w for _n, w in ws)
            ws = [(n, w / s) for n, w in ws if w > 1e-6]
            s = sum(w for _n, w in ws)
            ws = [(n, w / s) for n, w in ws]
            assign.append((v.index, ws))
        bw(ob, assign)
        ob.parent = arm
        md = ob.modifiers.new(name="Armature", type="ARMATURE")
        md.object = arm


# ---------------------------------------------------------------------------
# Finishing: triangulate, sharp edges, custom split normals
# ---------------------------------------------------------------------------


def triangulate(ob):
    bm = bmesh.new()
    bm.from_mesh(ob.data)
    bmesh.ops.triangulate(bm, faces=bm.faces[:], quad_method="BEAUTY", ngon_method="BEAUTY")
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:])
    if bm.calc_volume(signed=True) < 0.0:
        bmesh.ops.reverse_faces(bm, faces=bm.faces[:])
    bm.to_mesh(ob.data)
    bm.free()
    ob.data.update()


def mark_sharp(parts, shift_y):
    """Hard edges only at the bill-to-face junction (brief.md Topology rules).

    The eyelid ring and the leg-to-belly junction are object boundaries here, so
    they are already shading-split.
    """
    me = parts["GullBody"].data
    y0 = Y_BILL_BASE + shift_y
    n = 0
    for e in me.edges:
        a = me.vertices[e.vertices[0]].co.y
        b = me.vertices[e.vertices[1]].co.y
        if abs(a - y0) < 0.006 and abs(b - y0) < 0.006:
            e.use_edge_sharp = True
            n += 1
    return n


def add_custom_normals(parts):
    ok = 0
    for ob in parts.values():
        bpy.context.view_layer.objects.active = ob
        for o in bpy.context.selected_objects:
            o.select_set(False)
        ob.select_set(True)
        try:
            bpy.ops.mesh.customdata_custom_splitnormals_add()
            ok += 1
        except Exception:
            pass
        ob.select_set(False)
    return ok


# ---------------------------------------------------------------------------
# Self-check
# ---------------------------------------------------------------------------

CHECKS = []


def chk(name, measured, ok):
    CHECKS.append({"name": name, "measured": str(measured), "pass": bool(ok)})
    return ok


def dim_chk(name, value, target, tol=TOL):
    lo, hi = target * (1.0 - tol), target * (1.0 + tol)
    err = (value - target) / target * 100.0 if target else 0.0
    return chk(
        name,
        "%.4f m (target %.3f m, %+.2f%%, band %.4f-%.4f)" % (value, target, err, lo, hi),
        lo <= value <= hi,
    )


def bbox_of(objs):
    lo = [1e9] * 3
    hi = [-1e9] * 3
    for ob in objs:
        for v in ob.data.vertices:
            w = ob.matrix_world @ v.co
            for i in range(3):
                lo[i] = min(lo[i], w[i])
                hi[i] = max(hi[i], w[i])
    return lo, hi


def flipped_faces(ob):
    """Faces whose stored normal disagrees with a fresh outward recalculation."""
    bm = bmesh.new()
    bm.from_mesh(ob.data)
    bm.faces.ensure_lookup_table()
    before = [f.normal.copy() for f in bm.faces]
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:])
    if bm.calc_volume(signed=True) < 0.0:
        bmesh.ops.reverse_faces(bm, faces=bm.faces[:])
        bm.normal_update()
    n = sum(1 for f, b in zip(bm.faces, before) if f.normal.dot(b) < 0.0)
    vol = bm.calc_volume(signed=True)
    bm.free()
    return n, vol


def components(ob):
    adj = {i: set() for i in range(len(ob.data.vertices))}
    for e in ob.data.edges:
        a, b = e.vertices
        adj[a].add(b)
        adj[b].add(a)
    seen = set()
    n = 0
    for s in adj:
        if s in seen:
            continue
        n += 1
        stack = [s]
        seen.add(s)
        while stack:
            c = stack.pop()
            for d in adj[c]:
                if d not in seen:
                    seen.add(d)
                    stack.append(d)
    return n


def span_in_band(ob, lo_x, hi_x, axis=1):
    vals = [v.co[axis] for v in ob.data.vertices if lo_x <= abs(v.co.x) <= hi_x]
    return (max(vals) - min(vals)) if vals else 0.0


def run_checks(parts, arm, shift_y, glb_bytes):
    meshes = [parts[n] for n in PART_ORDER]

    lo, hi = bbox_of(meshes)
    dx, dy, dz = hi[0] - lo[0], hi[1] - lo[1], hi[2] - lo[2]
    dim_chk("Wingspan, tip to tip (X)", dx, D_WINGSPAN)
    dim_chk("Body length, bill tip to tail tip (Y)", dy, D_LENGTH)
    dim_chk("Standing height, feet to crown (Z)", dz, D_HEIGHT)

    body = parts["GullBody"]
    torso = [v.co for v in body.data.vertices if -0.100 + shift_y <= v.co.y <= 0.060 + shift_y]
    dim_chk("Body width, wings folded (torso)", 2.0 * max(abs(c.x) for c in torso), D_BODY_WIDTH)
    dim_chk(
        "Body depth, belly to back (torso)",
        max(c.z for c in torso) - min(c.z for c in torso),
        D_BODY_DEPTH,
    )

    bill = [v.co for v in body.data.vertices if v.co.y <= Y_BILL_BASE + shift_y + 1e-6]
    dim_chk("Bill length", (Y_BILL_BASE + shift_y) - min(c.y for c in bill), D_BILL_LEN)
    billbase = [c for c in bill if abs(c.y - (Y_BILL_BASE + shift_y)) < 0.004]
    dim_chk(
        "Bill depth at base",
        max(c.z for c in billbase) - min(c.z for c in billbase),
        D_BILL_DEPTH,
        0.06,
    )

    tail = parts["GullTail"]
    tys = [v.co.y for v in tail.data.vertices]
    dim_chk("Tail length from vent", max(tys) - (Y_VENT + shift_y), D_TAIL_FROM_VENT)

    foot = parts["GullFoot_L"]
    fys = [v.co.y for v in foot.data.vertices]
    dim_chk("Foot length including web", max(fys) - min(fys), D_FOOT)
    membrane = [v.co.z for v in foot.data.vertices if v.co.z > 1e-6]
    dim_chk("Web thickness (solid, thinnest membrane)", min(membrane), D_WEB_THICK)

    leg = parts["GullLeg_L"]
    lzs = sorted(set(round(v.co.z, 5) for v in leg.data.vertices))
    base_z = min(z for z in lzs if z >= Z_TARSUS_BASE - 1e-4)
    joint_z = min(lzs, key=lambda z: abs(z - Z_TARSUS_TOP))
    dim_chk("Tarsus length (ankle to intertarsal joint)", joint_z - base_z, D_TARSUS)

    wl, wr = parts["GullWing_L"], parts["GullWing_R"]
    dim_chk("Wing chord at root", span_in_band(wr, 0.0, X_WING_ROOT + 0.002), D_CHORD_ROOT)
    dim_chk("Wing chord at tip", span_in_band(wr, X_HALF_SPAN - 0.004, 1.0), D_CHORD_TIP, 0.06)
    x3 = X_WING_ROOT + (X_HALF_SPAN - X_WING_ROOT) * 0.915
    c_r = span_in_band(wr, x3 - 0.002, x3 + 0.002)
    c_l = span_in_band(wl, x3 - 0.002, x3 + 0.002)
    dim_chk("Notched 3rd left primary, shortfall vs right", c_r - c_l, D_NOTCH, 0.06)

    tris = sum(len(ob.data.polygons) for ob in meshes)
    ngons = sum(1 for ob in meshes for p in ob.data.polygons if len(p.vertices) != 3)
    chk("Triangle count within budget",
        "%d tris (budget %d-%d)" % (tris, TRI_MIN, TRI_MAX),
        TRI_MIN <= tris <= TRI_MAX)
    chk("N-gons / quads in exported mesh", "%d non-triangular faces" % ngons, ngons == 0)

    flips = 0
    bad_vol = []
    for ob in meshes:
        n, vol = flipped_faces(ob)
        flips += n
        if vol <= 0.0:
            bad_vol.append(ob.name)
    chk("Inverted face normals",
        "%d faces disagree with outward recalc; %d/%d shells have positive signed volume"
        % (flips, len(meshes) - len(bad_vol), len(meshes)),
        flips == 0 and not bad_vol)

    lv = 0
    le = 0
    nonman = 0
    islands = []
    for ob in meshes:
        used_v = set()
        edge_use = {}
        for p in ob.data.polygons:
            vs = list(p.vertices)
            used_v.update(vs)
            for k in range(len(vs)):
                key = tuple(sorted((vs[k], vs[(k + 1) % len(vs)])))
                edge_use[key] = edge_use.get(key, 0) + 1
        lv += len(ob.data.vertices) - len(used_v)
        for e in ob.data.edges:
            key = tuple(sorted(e.vertices))
            u = edge_use.get(key, 0)
            if u == 0:
                le += 1
            elif u != 2:
                nonman += 1
        islands.append(components(ob))
    chk("Loose geometry",
        "%d loose verts, %d loose edges, %d parts each a single island"
        % (lv, le, sum(1 for i in islands if i == 1)),
        lv == 0 and le == 0 and all(i == 1 for i in islands))
    chk("Non-manifold edges (watertight shells)",
        "%d edges not shared by exactly 2 faces" % nonman, nonman == 0)

    bad_xf = []
    for ob in list(parts.values()) + [arm]:
        L, R, S = ob.matrix_world.decompose()
        if (L.length > 1e-6 or abs(R.angle) > 1e-6
                or max(abs(S.x - 1), abs(S.y - 1), abs(S.z - 1)) > 1e-6):
            bad_xf.append(ob.name)
    chk("Object transforms applied (loc 0, rot 0, scale 1)",
        "%d/%d objects identity" % (len(parts) + 1 - len(bad_xf), len(parts) + 1),
        not bad_xf)

    cc = contact_centroid(parts)
    chk("Pivot at foot-contact plane between the feet",
        "origin offset from contact centroid = (%.4f, %.4f, %.4f) m, min Z = %.5f m"
        % (cc.x, cc.y, cc.z, lo[2]),
        abs(cc.x) <= 0.005 and abs(cc.y) <= 0.005 and abs(lo[2]) <= 0.0005)
    chk("Bilateral centre plane on X = 0",
        "min X %.4f, max X %.4f, asymmetry %.5f m" % (lo[0], hi[0], abs(abs(lo[0]) - hi[0])),
        abs(abs(lo[0]) - hi[0]) <= 0.0005)

    names = [b.name for b in arm.data.bones]
    want = [b[0] for b in BONES]
    chk("Rig: 9 bones, exact names",
        "%d bones: %s" % (len(names), ", ".join(want)),
        len(names) == 9 and sorted(names) == sorted(want))
    root = arm.data.bones["root"]
    chk("Root bone identity at the origin",
        "root head = (%.4f, %.4f, %.4f)" % tuple(root.head_local),
        max(abs(c) for c in root.head_local) <= 0.0005)

    maxinf = 0
    unweighted = 0
    worst_sum = 0.0
    for ob in meshes:
        gi = {g.index: g.name for g in ob.vertex_groups}
        for v in ob.data.vertices:
            ws = [g.weight for g in v.groups if g.group in gi and g.weight > 1e-6]
            maxinf = max(maxinf, len(ws))
            if not ws:
                unweighted += 1
            else:
                worst_sum = max(worst_sum, abs(sum(ws) - 1.0))
    chk("Skin weights",
        "max %d influences/vertex, %d unweighted, worst |sum-1| = %.6f"
        % (maxinf, unweighted, worst_sum),
        maxinf <= 4 and unweighted == 0 and worst_sum <= 1e-3)

    vcol = sum(len(ob.data.color_attributes) for ob in meshes)
    chk("Vertex colour channels", "%d" % vcol, vcol == 0)

    # glTF verification, read back off disk.
    gl = verify_glb(glb_bytes)
    chk("GLB exported, +Y up, 1 unit = 1 metre",
        "bbox X %.4f (span) / Y %.4f (height) / Z %.4f (length) m; %d nodes, "
        "max node-scale deviation %.2e (float32 noise)"
        % (gl["x"], gl["y"], gl["z"], gl["nodes"], gl["dev"]),
        gl["unit_scale"]
        and abs(gl["x"] - D_WINGSPAN) <= D_WINGSPAN * TOL
        and abs(gl["y"] - D_HEIGHT) <= D_HEIGHT * TOL
        and abs(gl["z"] - D_LENGTH) <= D_LENGTH * TOL)

    return tris, (dx, dy, dz)


def verify_glb(raw):
    """Parse the GLB and aggregate every POSITION accessor's min/max."""
    magic, _ver, _ln = struct.unpack_from("<III", raw, 0)
    assert magic == 0x46546C67, "not a GLB"
    off = 12
    js = None
    while off < len(raw):
        clen, ctype = struct.unpack_from("<II", raw, off)
        if ctype == 0x4E4F534A:
            js = json.loads(raw[off + 8: off + 8 + clen].decode("utf-8"))
            break
        off += 8 + clen + ((4 - clen % 4) % 4)
    acc = js["accessors"]
    lo = [1e9] * 3
    hi = [-1e9] * 3
    for me in js.get("meshes", []):
        for pr in me["primitives"]:
            a = acc[pr["attributes"]["POSITION"]]
            for i in range(3):
                lo[i] = min(lo[i], a["min"][i])
                hi[i] = max(hi[i], a["max"][i])
    dev = 0.0
    for nd in js.get("nodes", []):
        s = nd.get("scale")
        if s:
            dev = max(dev, max(abs(v - 1.0) for v in s))
        m = nd.get("matrix")
        if m:
            for col in range(3):
                ln = math.sqrt(sum(m[col * 4 + r] ** 2 for r in range(3)))
                dev = max(dev, abs(ln - 1.0))
    unit = dev <= 1e-4          # float32 round-trip noise, not authored scale
    return {
        "x": hi[0] - lo[0], "y": hi[1] - lo[1], "z": hi[2] - lo[2],
        "nodes": len(js.get("nodes", [])), "unit_scale": unit, "dev": dev,
    }


# ---------------------------------------------------------------------------
# Export
# ---------------------------------------------------------------------------


def export_glb():
    """glTF 2.0 is natively +Y up with 1 unit = 1 metre; export_yup performs
    the Z-up -> Y-up conversion on the way out (brief.md format note)."""
    op = bpy.ops.export_scene.gltf
    wanted = {
        "filepath": GLB_PATH,
        "export_format": "GLB",
        "export_yup": True,
        "export_apply": False,
        "export_skins": True,
        "export_animations": False,
        "export_normals": True,
        "export_tangents": False,
        "export_materials": "EXPORT",
        "export_cameras": False,
        "export_lights": False,
        "use_selection": False,
        "export_extras": False,
    }
    valid = set(op.get_rna_type().properties.keys())
    kwargs = {k: v for k, v in wanted.items() if k in valid}
    dropped = sorted(set(wanted) - valid)
    op(**kwargs)
    return dropped


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

NOTES = (
    "Rest pose per brief.md 'Pivot and origin rule': wings spread flat at 0 deg "
    "dihedral, legs straight under the body, neck extended, so the 1.440 m "
    "wingspan and 0.620 m length are measurable straight off the bounding box. "
    "Bird faces -Y in Blender Z-up; glTF export converts to +Y up / +Z forward. "
    "Origin is the foot-contact plane between the feet on the bilateral centre "
    "plane, all transforms applied. 9-bone rig exactly as specified; legs and "
    "feet rigid-weighted to 'body' per Assumption A6. The single asymmetry of "
    "form is the third left primary, broken short by 0.035 m (Wear item 3); "
    "everything else is bilaterally symmetric. Four splayed primary slots are "
    "modelled into the hand planform, not as alpha cards. No chamfers, rivets "
    "or radial symmetry anywhere (Art direction). No collider is baked into the "
    "mesh: the brief specifies no physics collider at all, only a prefab-side "
    "trigger SphereCollider of radius 3.00 m on 'root' for the 3.0 m flee. "
    "Textures, UVs and the three animation clips are out of scope for this "
    "geometry build."
)


def main():
    reset_scene()
    parts = build_parts()

    cc = contact_centroid(parts)
    shift = Vector((0.0, -cc.y, 0.0))
    translate_all(parts, shift)
    shift_y = shift.y

    arm = build_armature(shift_y)
    bind(parts, arm, shift_y)

    sharp = mark_sharp(parts, shift_y)
    for nm in PART_ORDER:
        triangulate(parts[nm])
    cn = add_custom_normals(parts)

    for ob in list(parts.values()) + [arm]:
        ob.location = (0.0, 0.0, 0.0)
        ob.rotation_euler = (0.0, 0.0, 0.0)
        ob.scale = (1.0, 1.0, 1.0)
    bpy.context.view_layer.update()

    dropped = export_glb()
    with open(GLB_PATH, "rb") as fh:
        raw = fh.read()

    tris, dims = run_checks(parts, arm, shift_y, raw)

    lines = []
    lines.append("CHR_HerringGull_01 - build check report")
    lines.append("Blender %s" % bpy.app.version_string)
    lines.append("Source brief: assets/herring-gull/brief.md")
    lines.append("Origin Y shift applied to land the contact patch on Y=0: %+.4f m" % shift_y)
    lines.append("Hard edges marked at the bill-to-face junction: %d" % sharp)
    lines.append("Custom split normals added on %d/%d meshes" % (cn, len(parts)))
    if dropped:
        lines.append("glTF exporter ignored unsupported options: %s" % ", ".join(dropped))
    lines.append("Export: %s (%.1f KB)" % (os.path.basename(GLB_PATH), len(raw) / 1024.0))
    lines.append("")
    w = max(len(c["name"]) for c in CHECKS)
    lines.append("%-*s  %-6s  %s" % (w, "CHECK", "RESULT", "MEASURED"))
    lines.append("%s  %s  %s" % ("-" * w, "-" * 6, "-" * 60))
    for c in CHECKS:
        lines.append("%-*s  %-6s  %s" % (w, c["name"], "PASS" if c["pass"] else "FAIL", c["measured"]))
    npass = sum(1 for c in CHECKS if c["pass"])
    ok = npass == len(CHECKS)
    lines.append("")
    lines.append("%d/%d checks passed - %s" % (npass, len(CHECKS), "OK" if ok else "FAILED"))
    report = "\n".join(lines)

    print("\n" + report + "\n")
    with open(LOG_PATH, "w") as fh:
        fh.write(report + "\n")
    with open(RESULT_PATH, "w") as fh:
        json.dump(
            {
                "ok": ok,
                "triangles": tris,
                "dimensions_m": [round(d, 4) for d in dims],
                "checks": CHECKS,
                "notes": NOTES,
            },
            fh,
            indent=2,
        )
        fh.write("\n")
    return 0 if ok else 1


if __name__ == "__main__":
    sys.exit(main())
