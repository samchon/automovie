"""The default MPFB human sampled through MPFB's own services.

Recovered from the deleted body (`44dec918c:test/scripts/body-review/
body_extraction/session.py`) and face (`67b7d53e6^:test/scripts/face-review/
face_extraction/session.py`) extraction sessions, merged so one human carries
both weight bindings. The only behavioural change is that the MPFB data
directory is an argument instead of a repository-relative `.references` path,
so the pinned checkout can live in any acquisition directory.

The human is MPFB's default (every macro 0.5, equal ethnic mixture) with one
Catmull-Clark subdivision level, limit surface on, quality 3: the setting under
which both published bases' skin vertices are exact twins of this mesh.

Three weight bindings are interpolated by Blender through the subdivision:

- `bone:<name>` groups from `weights.game_engine.json`, the body skinning.
- `attach:<owner>` groups summing `weights.default.json` over the jaw subtree
  and each eye bone, the face attachment weights.
- `ray:<bone>` groups from the toe phalanx bones of `weights.default.json`
  (`toe1-1` to `toe5-3` per side), which partition the game-engine toe
  bone's weight vertex for vertex, the per-ray split of the toes.

Coordinates are Blender metres, Z up, facing -Y. The compiler converts them to
the shared Y-up, Z-forward frame.
"""
import json
import os
import re

import bpy
import numpy as np

EXTENSION = "bl_ext.user_default.mpfb"
# Toe phalanx bones of the MPFB default rig: toe<ray>-<phalanx>.<side>.
TOE_PHALANX = re.compile(r"^toe[1-5]-[1-3]\.[LR]$")

MACRO_DEFAULTS = {
    "gender": 0.5, "age": 0.5, "muscle": 0.5, "weight": 0.5,
    "proportions": 0.5, "height": 0.5, "cupsize": 0.5, "firmness": 0.5,
}

# Attachment owner -> root bones of the default-rig subtree it sums.
ATTACHMENT_ROOTS = {"jaw": ["jaw"], "eyeL": ["eye.L"], "eyeR": ["eye.R"]}


def enable_mpfb():
    """Enable the add-on from the isolated profile and return its service classes."""
    bpy.ops.preferences.addon_enable(module=EXTENSION)
    from bl_ext.user_default.mpfb.services.humanservice import HumanService
    from bl_ext.user_default.mpfb.services.targetservice import TargetService
    from bl_ext.user_default.mpfb.entities.objectproperties import HumanObjectProperties
    return HumanService, TargetService, HumanObjectProperties


def _read_json(path):
    with open(path, encoding="utf-8") as file:
        return json.load(file)


def attachment_weights(data):
    """Attachment owner -> {base vertex: summed weight} over its default-rig subtree."""
    rig = _read_json(os.path.join(data, "rigs", "standard", "rig.default.json"))
    weights = _read_json(os.path.join(data, "rigs", "standard", "weights.default.json"))["weights"]
    children = {}
    for name, bone in rig.items():
        children.setdefault(bone["parent"], []).append(name)
    out = {}
    for owner, roots in ATTACHMENT_ROOTS.items():
        members = list(roots)
        for member in members:
            members.extend(children.get(member, []))
        summed = {}
        for bone in members:
            for vertex, weight in weights.get(bone, []):
                summed[int(vertex)] = summed.get(int(vertex), 0.0) + float(weight)
        out[owner] = summed
    return out


class Session:
    """One default human with both weight bindings and its subdivision appended."""

    def __init__(self, data):
        self.data = data
        self.HumanService, self.TargetService, self.Properties = enable_mpfb()
        for obj in list(bpy.data.objects):
            bpy.data.objects.remove(obj, do_unlink=True)
        self.human = self.HumanService.create_human()
        bpy.context.view_layer.objects.active = self.human
        self.bone_groups = self._bind_bones()
        self.attachment_groups = self._bind_attachments()
        self.ray_groups = self._bind_toe_rays()
        subsurf = self.human.modifiers.new("subdivision", "SUBSURF")
        subsurf.levels = 1
        subsurf.render_levels = 1
        subsurf.subdivision_type = "CATMULL_CLARK"
        subsurf.use_limit_surface = True
        subsurf.quality = 3
        self.loaded = {}

    def _bind_bones(self):
        weights = _read_json(os.path.join(self.data, "rigs", "standard", "weights.game_engine.json"))["weights"]
        groups = {}
        for bone, rows in weights.items():
            if not rows:
                continue
            group = self.human.vertex_groups.new(name="bone:" + bone)
            for vertex, weight in rows:
                group.add([int(vertex)], float(weight), "REPLACE")
            groups[bone] = group.index
        return groups

    def _bind_toe_rays(self):
        weights = _read_json(os.path.join(self.data, "rigs", "standard", "weights.default.json"))["weights"]
        groups = {}
        for bone in sorted(weights):
            if not TOE_PHALANX.match(bone) or not weights[bone]:
                continue
            group = self.human.vertex_groups.new(name="ray:" + bone)
            for vertex, weight in weights[bone]:
                group.add([int(vertex)], float(weight), "REPLACE")
            groups[bone] = group.index
        return groups

    def _bind_attachments(self):
        groups = {}
        for owner, rows in attachment_weights(self.data).items():
            group = self.human.vertex_groups.new(name="attach:" + owner)
            for vertex, weight in rows.items():
                group.add([vertex], weight, "REPLACE")
            groups[owner] = group.index
        return groups

    def _evaluated_mesh(self):
        depsgraph = bpy.context.evaluated_depsgraph_get()
        evaluated = self.human.evaluated_get(depsgraph)
        return evaluated, evaluated.to_mesh()

    def sample_skin(self):
        """Positions of the masked, subdivided skin as an (n, 3) float64 array."""
        evaluated, mesh = self._evaluated_mesh()
        positions = np.empty(len(mesh.vertices) * 3, dtype=np.float64)
        mesh.vertices.foreach_get("co", positions)
        evaluated.to_mesh_clear()
        return positions.reshape(-1, 3)

    def read_topology(self):
        """Polygons, loop vertices, loop UVs and both interpolated weight bindings."""
        evaluated, mesh = self._evaluated_mesh()
        loop_start = np.empty(len(mesh.polygons), dtype=np.int64)
        loop_total = np.empty(len(mesh.polygons), dtype=np.int64)
        mesh.polygons.foreach_get("loop_start", loop_start)
        mesh.polygons.foreach_get("loop_total", loop_total)
        loop_vertex = np.empty(len(mesh.loops), dtype=np.int64)
        mesh.loops.foreach_get("vertex_index", loop_vertex)
        loop_uv = np.empty(len(mesh.loops) * 2, dtype=np.float64)
        mesh.uv_layers.active.data.foreach_get("uv", loop_uv)
        bones = {index: name for name, index in self.bone_groups.items()}
        owners = {index: name for name, index in self.attachment_groups.items()}
        rays = {index: name for name, index in self.ray_groups.items()}
        bone_rows, attachment_rows, ray_rows = [], [], []
        for vertex in mesh.vertices:
            bone_rows.append([(bones[g.group], float(g.weight)) for g in vertex.groups if g.group in bones])
            attachment_rows.append([(owners[g.group], float(g.weight)) for g in vertex.groups if g.group in owners])
            ray_rows.append([(rays[g.group], float(g.weight)) for g in vertex.groups if g.group in rays])
        evaluated.to_mesh_clear()
        return {
            "loop_start": loop_start,
            "loop_total": loop_total,
            "loop_vertex": loop_vertex,
            "loop_uv": loop_uv.reshape(-1, 2),
            "bones": bone_rows,
            "attachments": attachment_rows,
            "rays": ray_rows,
        }

    def sample_helpers(self):
        """Base-mesh positions (helpers included) with shape keys applied and no modifiers."""
        states = [(modifier, modifier.show_viewport) for modifier in self.human.modifiers]
        for modifier, _ in states:
            modifier.show_viewport = False
        evaluated, mesh = self._evaluated_mesh()
        positions = np.empty(len(mesh.vertices) * 3, dtype=np.float64)
        mesh.vertices.foreach_get("co", positions)
        evaluated.to_mesh_clear()
        for modifier, shown in states:
            modifier.show_viewport = shown
        return positions.reshape(-1, 3)

    def set_target_file(self, key, path, weight):
        """Load a target file once as a shape key and set its weight."""
        if key not in self.loaded:
            self.TargetService.load_target(self.human, path, weight=0.0, name=key)
            self.loaded[key] = True
        self.TargetService.set_target_value(self.human, key, float(weight))

    def set_macro(self, **values):
        """Set macro axes (others keep their defaults) and let MPFB rebuild its stack."""
        macro = dict(MACRO_DEFAULTS)
        macro.update(values)
        for name, value in macro.items():
            self.Properties.set_value(name, float(value), entity_reference=self.human)
        self.TargetService.reapply_macro_details(self.human, remove_zero_weight_targets=False)

    def restore(self):
        """Return every loaded key to zero and the macro axes to their defaults."""
        for key in self.loaded:
            self.TargetService.set_target_value(self.human, key, 0.0)
        self.set_macro()
