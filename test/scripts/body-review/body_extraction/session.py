"""MPFB session: the pinned add-on, the default human, and evaluated samples.

This module is the only place that talks to MPFB. It enables the add-on from
the junction that points at `.references/mpfb2/src/mpfb` (the pinned revision,
never a store download), creates the default human whose macro values are all
0.5 with an equal ethnic mixture, binds the CC0 `weights.game_engine.json` as
one vertex group per bone so Blender interpolates them through subdivision,
and appends the subdivision modifier that reproduces the face basis vertices
exactly (Catmull-Clark, one level, limit surface on, quality 3; measured in the
T1 research record).

Two evaluations exist because the mask hides the helpers:

- `sample_skin` reads the evaluated object with its modifiers (mask + subsurf)
  and returns the 53,514 skin vertices of the subdivided body.
- `sample_helpers` disables the modifiers for one read and returns the 19,158
  base vertices with their shape keys applied, which is where the joint cubes
  live.

Endpoint states are driven through MPFB's own services (`load_target`,
`set_target_value`, `HumanObjectProperties` + `reapply_macro_details`), so a
state is exactly what the add-on would show a user. `restore` returns every
key to zero and the macro dictionary to its defaults; the entry script checks
that this recovers the neutral to the last bit before publishing.

Coordinates returned here are Blender metres, Z up, facing -Y; `clip` converts
to the face frame.
"""
import json
import os

import bpy
import numpy as np

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../.."))
MPFB_DATA = os.path.join(ROOT, ".references", "mpfb2", "src", "mpfb", "data")
EXTENSION = "bl_ext.user_default.mpfb"

MACRO_DEFAULTS = {
    "gender": 0.5, "age": 0.5, "muscle": 0.5, "weight": 0.5,
    "proportions": 0.5, "height": 0.5, "cupsize": 0.5, "firmness": 0.5,
}


def enable_mpfb():
    """Enable the pinned add-on and return its service classes."""
    bpy.ops.preferences.addon_enable(module=EXTENSION)
    from bl_ext.user_default.mpfb.services.humanservice import HumanService
    from bl_ext.user_default.mpfb.services.targetservice import TargetService
    from bl_ext.user_default.mpfb.entities.objectproperties import HumanObjectProperties
    return HumanService, TargetService, HumanObjectProperties


class Session:
    """One default human with its skin weights bound and its subdivision appended."""

    def __init__(self):
        self.HumanService, self.TargetService, self.Properties = enable_mpfb()
        for obj in list(bpy.data.objects):
            bpy.data.objects.remove(obj, do_unlink=True)
        self.human = self.HumanService.create_human()
        bpy.context.view_layer.objects.active = self.human
        self.bone_groups = self._bind_weights()
        subsurf = self.human.modifiers.new("subdivision", "SUBSURF")
        subsurf.levels = 1
        subsurf.render_levels = 1
        subsurf.subdivision_type = "CATMULL_CLARK"
        subsurf.use_limit_surface = True
        subsurf.quality = 3
        self.loaded = {}

    def _bind_weights(self):
        """Create one vertex group per game_engine bone from the CC0 weights file."""
        with open(os.path.join(MPFB_DATA, "rigs", "standard", "weights.game_engine.json"), encoding="utf-8") as file:
            weights = json.load(file)["weights"]
        groups = {}
        for bone, rows in weights.items():
            if not rows:
                continue
            group = self.human.vertex_groups.new(name="bone:" + bone)
            for vertex, weight in rows:
                group.add([int(vertex)], float(weight), "REPLACE")
            groups[bone] = group.index
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
        """Polygons, loop vertices, loop UVs and per-vertex bone weights of the neutral skin.

        Read once. The polygon and loop arrays are what the clip stencil and
        the triangulation consume; the deform weights are Blender's own
        interpolation of the bound groups through the subdivision.
        """
        evaluated, mesh = self._evaluated_mesh()
        loop_start = np.empty(len(mesh.polygons), dtype=np.int64)
        loop_total = np.empty(len(mesh.polygons), dtype=np.int64)
        mesh.polygons.foreach_get("loop_start", loop_start)
        mesh.polygons.foreach_get("loop_total", loop_total)
        loop_vertex = np.empty(len(mesh.loops), dtype=np.int64)
        mesh.loops.foreach_get("vertex_index", loop_vertex)
        uv_layer = mesh.uv_layers.active
        loop_uv = np.empty(len(mesh.loops) * 2, dtype=np.float64)
        uv_layer.data.foreach_get("uv", loop_uv)
        loop_uv = loop_uv.reshape(-1, 2)
        index_to_bone = {index: bone for bone, index in self.bone_groups.items()}
        weights = []
        for vertex in mesh.vertices:
            rows = [(index_to_bone[g.group], float(g.weight)) for g in vertex.groups if g.group in index_to_bone]
            weights.append(rows)
        evaluated.to_mesh_clear()
        return {
            "loop_start": loop_start,
            "loop_total": loop_total,
            "loop_vertex": loop_vertex,
            "loop_uv": loop_uv,
            "weights": weights,
        }

    def sample_helpers(self):
        """Base-mesh positions (19,158 x 3) with shape keys applied and no modifiers."""
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

    def target_path(self, name):
        """Resolve a target name such as `torso/torso-scale-vert-incr` to its gzip file."""
        return os.path.join(MPFB_DATA, "targets", name + ".target.gz")

    def set_target(self, name, weight):
        """Load a regional target once as a shape key and set its weight."""
        key = "body:" + name
        if key not in self.loaded:
            self.TargetService.load_target(self.human, self.target_path(name), weight=0.0, name=key)
            self.loaded[key] = True
        self.TargetService.set_target_value(self.human, key, float(weight))

    def set_macro(self, **values):
        """Set macro axes (others keep their defaults) and let MPFB rebuild its stack."""
        macro = dict(MACRO_DEFAULTS)
        macro.update(values)
        for name, value in macro.items():
            self.Properties.set_value(name, float(value), entity_reference=self.human)
        self.TargetService.reapply_macro_details(self.human, remove_zero_weight_targets=False)

    def macro_info(self):
        return self.TargetService.get_macro_info_dict_from_basemesh(self.human)

    def restore(self):
        """Return every regional key to zero and the macro axes to their defaults."""
        for key in self.loaded:
            self.TargetService.set_target_value(self.human, key, 0.0)
        self.set_macro()
