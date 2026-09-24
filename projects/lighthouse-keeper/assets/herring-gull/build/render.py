"""Headless presentation of the supplied, unmodified herring-gull GLB.

Run with /Applications/Blender.app/Contents/MacOS/Blender --background --python
assets/herring-gull/build/render.py. All albedo swatches are from brief.md.
The input has neither UVs nor materials: masks use imported metre coordinates.
"""

import json
import math
import traceback
from pathlib import Path

print("PYTHON_STARTED: herring-gull headless presentation", flush=True)

import bpy
from mathutils import Vector
from bpy_extras.object_utils import world_to_camera_view


HERE = Path(__file__).resolve().parent
SAMPLES = 192
RESOLUTION = (1600, 1200)
ITERATION = 2
ASSIGNED_OBJECTS = []
RENDER_ATTEMPTS = 0
PALETTE = {
    "foam": "#A8B4B0", "zinc": "#5C6B6A", "black": "#0B1418",
    "brass": "#C2A15A", "oxide": "#6E2E24", "feet": "#836B5F",
    "lime": "#8C8578", "storm": "#2E4650",
}
MATERIALS = [
    {"zone": "Head, neck, breast, belly, flanks, undertail", "hex": PALETTE["foam"], "roughness": 0.62},
    {"zone": "Wet shoulders and upper wing coverts", "hex": PALETTE["zinc"], "roughness": 0.22},
    {"zone": "Drier mantle and lower coverts", "hex": PALETTE["zinc"], "roughness": 0.38},
    {"zone": "Primary tips, shafts and claws", "hex": PALETTE["black"], "roughness": 0.30},
    {"zone": "Tail, primary bases, trailing edges and mirrors", "hex": PALETTE["foam"], "roughness": 0.30},
    {"zone": "Bill ridge and hook", "hex": PALETTE["brass"], "roughness": 0.26},
    {"zone": "Bill base", "hex": PALETTE["brass"], "roughness": 0.40},
    {"zone": "Gonys spot", "hex": PALETTE["oxide"], "roughness": 0.26},
    {"zone": "Orbital eye ring", "hex": PALETTE["oxide"], "roughness": 0.34},
    {"zone": "Scaled legs and tarsi", "hex": PALETTE["feet"], "roughness": 0.34},
    {"zone": "Webbed feet", "hex": PALETTE["feet"], "roughness": 0.52},
    {"zone": "Iris", "hex": PALETTE["lime"], "roughness": 0.06},
    {"zone": "Pupil", "hex": PALETTE["black"], "roughness": 0.06},
    {"zone": "Patchy crown, nape and upper-mantle salt bloom", "hex": PALETTE["foam"], "roughness": 0.62},
    {"zone": "Lower-breast paraffin film, zinc component", "hex": PALETTE["zinc"], "roughness": 0.62},
    {"zone": "Lower-breast paraffin film, lime component", "hex": PALETTE["lime"], "roughness": 0.62},
]
NOTES = (
    "All materials are dielectric, metallic 0.00, with no emission or subsurface scattering. "
    "Exact brief sRGB swatches are converted to linear shader values. No new albedo colours. "
    "Supplied spread-wing bind pose and geometry retained; no perch animation or UVs exist in the GLB. "
    "Materials assigned by GullBody/GullWing/GullTail/GullLeg/GullFoot/GullEye names; bill has a separate body slot. "
    "Procedural masks substitute for missing textures: tracts at >=1 mm scale, "
    "wet-to-dry mantle roughness 0.22-0.38, bill 0.26-0.40, salt at 30-55% opacity only on normals Z>0.60, "
    "and asymmetric 15% lower-breast paraffin film mixing Weathered Zinc toward Lime Render. "
    "Chosen: head roughness follows dry down (0.62); salt 0.62, ring 0.34, claws 0.30; "
    "minor procedural roughness variation on other surfaces. "
    "Chosen presentation: orthographic elevated three-quarter camera, transparent RGBA, no floor; "
    "two 6500 K area lights as storm key/fill and one 2200 K area rim, low Iron Blue world fill. "
    "Light powers, sizes, camera and exposure are presentation choices; temperatures come from the brief. "
    "Final key/fill/rim powers 55/18/12 W, disk sizes 1.45/1.40/0.40 m; exposure 0 stops. "
    "Camera direction (2.5,-2.4,2.5), auto-fit to 86% frame bounds. "
    "Imported armature custom-shape helper excluded by its bone references. "
    "Iteration 1 revealed excessive warm specular wash on the zinc wings; iteration 2 reduces the rim "
    "and raises the three-quarter camera to increase vertical occupancy."
)


def rgba(key):
    h = PALETTE.get(key, key).lstrip("#")
    values = [int(h[i:i+2], 16) / 255 for i in (0, 2, 4)]
    return tuple(v / 12.92 if v <= 0.04045 else ((v + 0.055) / 1.055) ** 2.4 for v in values) + (1,)


class Shader:
    """Small node helpers, keeping colour constants restricted to PALETTE."""

    def __init__(self, name, colour, roughness):
        self.mat = bpy.data.materials.new(name)
        self.mat.use_nodes = True
        self.mat.diffuse_color = rgba(colour)
        self.mat["source"] = "brief.md: Art direction / Texture and material"
        self.mat["base_hex"] = PALETTE[colour]
        self.nodes = self.mat.node_tree.nodes
        self.links = self.mat.node_tree.links
        self.nodes.clear()
        out = self.nodes.new("ShaderNodeOutputMaterial")
        self.bsdf = self.nodes.new("ShaderNodeBsdfPrincipled")
        self.bsdf.inputs["Base Color"].default_value = rgba(colour)
        self.bsdf.inputs["Roughness"].default_value = roughness
        self.bsdf.inputs["Metallic"].default_value = 0.0
        self.bsdf.inputs["Subsurface Weight"].default_value = 0.0
        self.links.new(self.bsdf.outputs["BSDF"], out.inputs["Surface"])
        geo = self.nodes.new("ShaderNodeNewGeometry")
        self.position = geo.outputs["Position"]
        xyz = self.nodes.new("ShaderNodeSeparateXYZ")
        self.links.new(self.position, xyz.inputs[0])
        self.x, self.y, self.z = xyz.outputs
        normal = self.nodes.new("ShaderNodeSeparateXYZ")
        self.links.new(geo.outputs["Normal"], normal.inputs[0])
        self.up = self.op("GREATER_THAN", normal.outputs["Z"], 0.60)

    def set(self, socket, value):
        if isinstance(value, (float, int, tuple, list)):
            socket.default_value = value
        else:
            self.links.new(value, socket)

    def op(self, operation, a, b=0):
        n = self.nodes.new("ShaderNodeMath")
        n.operation = operation
        self.set(n.inputs[0], a)
        self.set(n.inputs[1], b)
        return n.outputs[0]

    def product(self, *values):
        result = values[0]
        for v in values[1:]:
            result = self.op("MULTIPLY", result, v)
        return result

    def ramp(self, value, start, end, low=0.0, high=1.0):
        n = self.nodes.new("ShaderNodeMapRange")
        n.clamp = True
        n.interpolation_type = "SMOOTHSTEP"
        for socket, v in zip(n.inputs, [value, start, end, low, high]):
            self.set(socket, v)
        return n.outputs[0]

    def mix(self, factor, a, b):
        n = self.nodes.new("ShaderNodeMixRGB")
        for socket, v in zip(n.inputs, [factor, a, b]):
            self.set(socket, rgba(v) if isinstance(v, str) else v)
        return n.outputs[0]

    def blend_number(self, factor, a, b):
        return self.op("ADD", self.product(self.op("SUBTRACT", 1, factor), a), self.product(factor, b))

    def noise(self, scale=(80, 80, 80)):
        vector = self.nodes.new("ShaderNodeVectorMath")
        vector.operation = "MULTIPLY"
        self.set(vector.inputs[0], self.position)
        vector.inputs[1].default_value = scale
        n = self.nodes.new("ShaderNodeTexNoise")
        self.links.new(vector.outputs[0], n.inputs["Vector"])
        n.inputs["Scale"].default_value = 1.0
        n.inputs["Detail"].default_value = 1.5
        n.inputs["Roughness"].default_value = 0.65
        return n.outputs["Fac"]

    def ellipse(self, a, b, ac, bc, ar, br):
        da = self.op("DIVIDE", self.op("SUBTRACT", a, ac), ar)
        db = self.op("DIVIDE", self.op("SUBTRACT", b, bc), br)
        distance = self.op("ADD", self.product(da, da), self.product(db, db))
        return self.ramp(distance, 0.7, 1.0, 1.0, 0.0)

    def bump(self, height, distance=0.0007, strength=0.24, mask=None):
        n = self.nodes.new("ShaderNodeBump")
        self.set(n.inputs["Height"], height)
        n.inputs["Distance"].default_value = distance
        self.set(n.inputs["Strength"], self.product(strength, mask) if mask is not None else strength)
        self.links.new(n.outputs[0], self.bsdf.inputs["Normal"])

    def output(self, colour, rough):
        self.set(self.bsdf.inputs["Base Color"], rgba(colour) if isinstance(colour, str) else colour)
        self.set(self.bsdf.inputs["Roughness"], rough)
        return self.mat

    def salt(self, colour, rough, region):
        patches = self.noise((135, 115, 125))
        mask = self.product(self.up, region, self.ramp(patches, 0.53, 0.69), self.ramp(patches, 0.5, 0.8, 0.30, 0.55))
        return self.mix(mask, colour, "foam"), self.blend_number(mask, rough, 0.62)


def body_material():
    s = Shader("Plumage | Sea Foam down + Weathered Zinc mantle", "foam", 0.62)
    mantle = s.product(s.ramp(s.y, -0.19, -0.12), s.ramp(s.z, 0.225, 0.28))
    wet = s.ramp(s.y, -0.10, 0.11, 0.22, 0.38)
    dry = s.ramp(s.noise((95, 50, 115)), 0.2, 0.8, 0.59, 0.65)
    colour = s.mix(mantle, "foam", "zinc")
    rough = s.blend_number(mantle, dry, wet)
    smear = s.product(s.ellipse(s.y, s.z, -0.115, 0.166, 0.060, 0.045), s.ramp(s.x, -0.07, 0.07, 0.4, 1), 0.15)
    film = s.mix(s.noise((35, 30, 45)), "zinc", "lime")
    colour = s.mix(smear, colour, film)
    region = s.ramp(s.y, -0.08, 0.10, 1, 0)
    colour, rough = s.salt(colour, rough, region)
    s.bump(s.noise((210, 65, 160)), distance=0.00065, strength=0.25)
    return s.output(colour, rough)


def bill_material():
    s = Shader("Bill | Brass-coloured KERATIN + Oxide Red gonys | metallic ZERO", "brass", 0.26)
    gonys = s.ellipse(s.y, s.z, -0.356, 0.327, 0.004, 0.0035)
    colour = s.mix(gonys, "brass", "oxide")
    # A subtle mouth seam uses the palette's existing dark, no added geometry.
    mouth = s.product(s.ellipse(s.y, s.z, -0.341, 0.332, 0.021, 0.0006), 0.5)
    colour = s.mix(mouth, colour, "black")
    base = s.ramp(s.y, -0.355, -0.316, 0.26, 0.40)
    ridge = s.ramp(s.z, 0.335, 0.343)
    rough = s.blend_number(ridge, base, 0.26)
    s.bump(s.noise((110, 70, 110)), distance=0.00015, strength=0.1)
    return s.output(colour, rough)


def wing_material():
    s = Shader("Wings | Zinc coverts, Storm Black primaries, Sea Foam edges and mirrors", "zinc", 0.30)
    ax = s.op("ABSOLUTE", s.x)
    u = s.ramp(ax, 0.055, 0.720)
    # Read planform directly from the supplied wing: the outer 0.14 m is black.
    leading = s.op("ADD", -0.1477, s.product(0.110, s.op("POWER", u, 1.6)))
    chord_distance = s.op("SUBTRACT", s.y, leading)
    outer = s.ramp(ax, 0.573, 0.582)
    trailing = s.ramp(chord_distance, s.blend_number(u, 0.195, 0.055), s.blend_number(u, 0.211, 0.067))
    colour = s.mix(trailing, "zinc", "foam")
    colour = s.mix(outer, colour, "black")
    mirrors = s.op("MAXIMUM", s.ellipse(ax, s.y, 0.663, -0.016, 0.009, 0.013), s.ellipse(ax, s.y, 0.708, -0.009, 0.007, 0.009))
    colour = s.mix(s.product(mirrors, outer), colour, "foam")
    rough = s.ramp(chord_distance, 0.015, 0.17, 0.22, 0.38)
    rough = s.blend_number(s.op("MAXIMUM", outer, trailing), rough, 0.30)
    colour, rough = s.salt(colour, rough, s.product(s.ramp(ax, 0.08, 0.36, 1, 0), s.ramp(chord_distance, 0.03, 0.13, 1, 0)))
    # Feather groups (centimetres), never tiny barbs. Broad shallow tract grooves.
    phase = s.op("ADD", s.product(ax, 320), s.product(s.y, 85))
    groups = s.op("POWER", s.op("ABSOLUTE", s.op("SINE", phase)), 10)
    detail = s.op("ADD", s.product(groups, 0.6), s.product(s.noise((165, 40, 90)), 0.4))
    s.bump(detail, distance=0.0010, strength=0.32)
    return s.output(colour, rough)


def tail_material():
    s = Shader("Tail rectrices | Sea Foam | stiff feather", "foam", 0.30)
    grooves = s.op("POWER", s.op("ABSOLUTE", s.op("SINE", s.product(s.x, 325))), 12)
    s.bump(s.op("ADD", s.product(grooves, 0.65), s.product(s.noise((150, 35, 100)), 0.35)), distance=0.0007)
    return s.output("foam", s.ramp(s.noise((70, 45, 80)), 0.2, 0.8, 0.28, 0.32))


def leg_material():
    s = Shader("Legs and tarsi | permitted tint 836B5F | scaled keratin", "feet", 0.34)
    scales = s.op("ABSOLUTE", s.op("SINE", s.product(s.z, 1300)))
    s.bump(scales, distance=0.0003, strength=0.25)
    return s.output("feet", s.ramp(s.noise((160, 160, 90)), 0.2, 0.8, 0.32, 0.36))


def foot_material():
    s = Shader("Feet | permitted tint web + Storm Black claws", "feet", 0.52)
    ax = s.op("ABSOLUTE", s.x)
    claws = s.ellipse(ax, s.y, 0.032, -0.0268, 0.0026, 0.0075)
    claws = s.op("MAXIMUM", claws, s.ellipse(ax, s.y, 0.051, -0.021, 0.0026, 0.0055))
    colour = s.mix(claws, "feet", "black")
    s.bump(s.noise((180, 180, 180)), distance=0.0002, strength=0.2)
    return s.output(colour, s.blend_number(claws, s.ramp(s.noise(), 0.2, 0.8, 0.49, 0.55), 0.30))


def eye_material(obj):
    s = Shader(obj.name + " | Lime iris, Storm Black pupil, Oxide orbital ring", "lime", 0.06)
    points = [obj.matrix_world @ v.co for v in obj.data.vertices]
    centre = sum(points, Vector()) / len(points)
    radius = max(abs(p.z - centre.z) for p in points)
    iris = s.ellipse(s.y, s.z, centre.y - 0.0015, centre.z, radius * 0.83, radius * 0.86)
    pupil = s.ellipse(s.y, s.z, centre.y - 0.0015, centre.z, radius * 0.30, radius * 0.32)
    colour = s.mix(iris, "oxide", "lime")
    colour = s.mix(pupil, colour, "black")
    return s.output(colour, s.blend_number(iris, 0.34, 0.06))


def assign_materials(meshes):
    materials = {
        "GullBody": body_material(), "GullWing": wing_material(),
        "GullTail": tail_material(), "GullLeg": leg_material(), "GullFoot": foot_material(),
    }
    bill = bill_material()
    for obj in meshes:
        obj.data.materials.clear()
        if obj.name.startswith("GullEye"):
            mat = eye_material(obj)
        else:
            key = next((k for k in materials if obj.name.startswith(k)), None)
            if key is None:
                raise ValueError("No material zone identified for imported mesh " + repr(obj.name))
            mat = materials[key]
        obj.data.materials.append(mat)
        if obj.name == "GullBody":
            obj.data.materials.append(bill)
            for poly in obj.data.polygons:
                y = sum((obj.matrix_world @ obj.data.vertices[i].co).y for i in poly.vertices) / len(poly.vertices)
                poly.material_index = 1 if y < -0.316 else 0
        print("MATERIAL", obj.name, [m.name for m in obj.data.materials], flush=True)
        ASSIGNED_OBJECTS.append(obj.name)


def point_at(obj, target):
    obj.rotation_euler = (Vector(target) - obj.location).to_track_quat("-Z", "Y").to_euler()


def area(name, position, target, power, size, temperature):
    data = bpy.data.lights.new(name, "AREA")
    data.energy = power
    data.shape = "DISK"
    data.size = size
    # Blender's temperature control avoids inventing light-colour hexes.
    data.use_temperature = True
    data.temperature = temperature
    obj = bpy.data.objects.new(name, data)
    bpy.context.collection.objects.link(obj)
    obj.location = position
    point_at(obj, target)


def camera_and_lights(scene, meshes):
    target = Vector((0, -0.04, 0.20))
    camera = bpy.data.objects.new("Camera | three-quarter asset presentation", bpy.data.cameras.new("Presentation camera"))
    bpy.context.collection.objects.link(camera)
    camera.location = target + Vector((2.5, -2.4, 2.5))
    point_at(camera, target)
    camera.data.type = "ORTHO"
    scene.camera = camera
    bpy.context.view_layer.update()
    depsgraph = bpy.context.evaluated_depsgraph_get()
    points = []
    for obj in meshes:
        ev = obj.evaluated_get(depsgraph)
        points.extend(ev.matrix_world @ v.co for v in ev.data.vertices)
    inverse = camera.matrix_world.inverted()
    projected = [inverse @ p for p in points]
    xmin, xmax = min(p.x for p in projected), max(p.x for p in projected)
    ymin, ymax = min(p.y for p in projected), max(p.y for p in projected)
    camera.location += camera.rotation_euler.to_quaternion() @ Vector(((xmin + xmax) / 2, (ymin + ymax) / 2, 0))
    aspect = RESOLUTION[0] / RESOLUTION[1]
    camera.data.ortho_scale = max(xmax - xmin, (ymax - ymin) * aspect) / 0.86
    camera.data.lens = 65
    bpy.context.view_layer.update()
    uv = [world_to_camera_view(scene, camera, p) for p in points]
    bounds = [min(p.x for p in uv), min(p.y for p in uv), max(p.x for p in uv), max(p.y for p in uv)]
    print("FRAME_BOUNDS", bounds, flush=True)
    assert min(bounds[:2]) > 0.04 and max(bounds[2:]) < 0.96, "Framing cropped the asset"
    area("Key | broad cold storm | 6500 K", (-0.75, -1.50, 1.40), target, 55, 1.45, 6500)
    area("Fill | quiet storm return | 6500 K", (1.20, -1.60, 0.50), target, 18, 1.40, 6500)
    area("Rim | lighthouse lamp | 2200 K", (0.50, 1.30, 1.10), target, 12, 0.40, 2200)
    world = bpy.data.worlds.new("Low Iron Blue storm ambient")
    world.use_nodes = True
    world.node_tree.nodes["Background"].inputs["Color"].default_value = rgba("storm")
    world.node_tree.nodes["Background"].inputs["Strength"].default_value = 0.18
    scene.world = world


def main():
    global RENDER_ATTEMPTS
    bpy.ops.wm.read_factory_settings(use_empty=True)
    scene = bpy.context.scene
    scene.render.engine = "CYCLES"
    scene.cycles.device = "CPU"
    scene.cycles.samples = SAMPLES
    scene.cycles.use_denoising = True
    scene.cycles.adaptive_min_samples = 128
    scene.cycles.adaptive_threshold = 0.01
    scene.cycles.max_bounces = 8
    scene.render.resolution_x, scene.render.resolution_y = RESOLUTION
    scene.render.resolution_percentage = 100
    scene.render.film_transparent = True
    scene.render.image_settings.file_format = "PNG"
    scene.render.image_settings.color_mode = "RGBA"
    scene.render.image_settings.color_depth = "8"
    scene.render.filepath = str(HERE / "render.png")
    scene.view_settings.view_transform = "AgX"
    scene.view_settings.look = "AgX - Medium High Contrast"
    scene.view_settings.exposure = 0.0
    bpy.ops.import_scene.gltf(filepath=str(HERE / "asset.glb"))
    # glTF's importer also creates a mesh used only as a bone display shape.
    # Discover those through the imported armature, not a guessed object name.
    bone_shapes = {bone.custom_shape for rig in scene.objects if rig.type == "ARMATURE"
                   for bone in rig.pose.bones if bone.custom_shape is not None}
    for shape in bone_shapes:
        shape.hide_render = True
    meshes = [obj for obj in scene.objects if obj.type == "MESH"
              and obj not in bone_shapes and not obj.hide_render]
    # Inspect what actually imported; never require a predetermined mesh count.
    for obj in scene.objects:
        item = {"object": obj.name, "type": obj.type,
                "bone_display_helper": obj in bone_shapes, "hide_render": obj.hide_render}
        if obj.type == "MESH":
            points = [obj.matrix_world @ v.co for v in obj.data.vertices]
            item.update({
                "mesh": obj.data.name,
                "materials": [slot.material.name if slot.material else None for slot in obj.material_slots],
                "vertices": len(points),
                "uv_layers": [uv.name for uv in obj.data.uv_layers],
                "bounds": [[min(p[i] for p in points), max(p[i] for p in points)] for i in range(3)],
            })
        print("IMPORTED", json.dumps(item), flush=True)
    if not meshes:
        raise ValueError("The imported GLB contains no renderable mesh")
    assign_materials(meshes)
    camera_and_lights(scene, meshes)
    RENDER_ATTEMPTS += 1
    bpy.ops.render.render(write_still=True)


if __name__ == "__main__":
    report = {"ok": False, "image": "render.png", "samples": SAMPLES,
              "resolution": list(RESOLUTION), "materials": [],
              "iterations": 0, "notes": NOTES}
    try:
        main()
        report["ok"] = True
    except Exception:
        report["notes"] += " ERROR: " + traceback.format_exc()
        raise
    finally:
        report["materials"] = MATERIALS if ASSIGNED_OBJECTS else []
        report["iterations"] = ITERATION if RENDER_ATTEMPTS else 0
        (HERE / "render.json").write_text(json.dumps(report, indent=2) + "\n")
