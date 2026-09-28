"""MPFB session for the face: the pinned add-on, the default human, attachment groups.

This module is the only place that talks to MPFB. It enables the add-on from
the junction that points at `.references/mpfb2/src/mpfb` (the pinned revision
`817587ceb2ea03ea17a5b47e04396cbb4ddfa2d5`, never a store download), creates
the default human whose macro values are all 0.5 with an equal ethnic mixture,
binds the CC0 `weights.default.json` as one vertex group per attachment owner
so Blender interpolates them through subdivision, and appends the subdivision
modifier that reproduces the face basis vertices exactly (Catmull-Clark, one
level, limit surface on, quality 3; the same settings the body extraction
measured against the committed face basis).

An attachment owner is a subtree of the source `default` rig, not one bone:
the mandible is `jaw` with everything parented under it (the lip roots
`oris*`, `special04`, the tongue chain), because rotating the jaw bone alone
carries all of them rigidly, so a skin vertex's mandibular weight is the sum
of its weights over that subtree. Each globe is the single `eye.L`/`eye.R`
bone. Everything else is the cranium, which the face frame holds still, so it
needs no group of its own.

Two evaluations exist because the mask hides the helpers:

- `sample_skin` reads the evaluated object with its modifiers (mask + subsurf)
  and returns the subdivided skin vertices.
- `sample_helpers` disables the modifiers for one read and returns the 19,158
  base vertices with their shape keys applied, which is where the joint cubes
  live.

Endpoint states are driven through MPFB's own services (`load_target`,
`set_target_value`, `HumanObjectProperties` + `reapply_macro_details`), so a
state is exactly what the add-on would show a user. `restore` returns every
key to zero and the macro dictionary to its defaults; the entry script checks
that this recovers the neutral to the last bit before publishing.

Coordinates returned here are Blender metres, Z up, facing -Y; the
correspondence module converts to the face frame.
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

# Attachment owner -> root bones of the source rig subtree it sums.
ATTACHMENT_ROOTS = {"jaw": ["jaw"], "eyeL": ["eye.L"], "eyeR": ["eye.R"]}


def enable_mpfb():
    """Enable the pinned add-on and return its service classes."""
    bpy.ops.preferences.addon_enable(module=EXTENSION)
    from bl_ext.user_default.mpfb.services.humanservice import HumanService
    from bl_ext.user_default.mpfb.services.targetservice import TargetService
    from bl_ext.user_default.mpfb.entities.objectproperties import HumanObjectProperties
    return HumanService, TargetService, HumanObjectProperties


def rig_subtrees():
    """Attachment owner -> every bone of its subtree, read from rig.default.json."""
    with open(os.path.join(MPFB_DATA, "rigs", "standard", "rig.default.json"), encoding="utf-8") as file:
        rig = json.load(file)
    children = {}
    for name, bone in rig.items():
        children.setdefault(bone["parent"], []).append(name)
    out = {}
    for owner, roots in ATTACHMENT_ROOTS.items():
        members = list(roots)
        for member in members:
            members.extend(children.get(member, []))
        out[owner] = members
    return out


def attachment_weights():
    """Attachment owner -> {base vertex: summed weight} from weights.default.json."""
    with open(os.path.join(MPFB_DATA, "rigs", "standard", "weights.default.json"), encoding="utf-8") as file:
        weights = json.load(file)["weights"]
    out = {}
    for owner, members in rig_subtrees().items():
        summed = {}
        for bone in members:
            for vertex, weight in weights.get(bone, []):
                summed[int(vertex)] = summed.get(int(vertex), 0.0) + float(weight)
        out[owner] = summed
    return out


class Session:
    """One default human with its attachment groups bound and its subdivision appended."""

    def __init__(self):
        self.HumanService, self.TargetService, self.Properties = enable_mpfb()
        for obj in list(bpy.data.objects):
            bpy.data.objects.remove(obj, do_unlink=True)
        self.human = self.HumanService.create_human()
        bpy.context.view_layer.objects.active = self.human
        self.groups = self._bind_groups()
        subsurf = self.human.modifiers.new("subdivision", "SUBSURF")
        subsurf.levels = 1
        subsurf.render_levels = 1
        subsurf.subdivision_type = "CATMULL_CLARK"
        subsurf.use_limit_surface = True
        subsurf.quality = 3
        self.loaded = {}

    def _bind_groups(self):
        """Create one vertex group per attachment owner from the summed CC0 weights."""
        groups = {}
        for owner, rows in attachment_weights().items():
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
        """Edges and per-vertex attachment weights of the neutral subdivided skin.

        Read once. The edges, with the fan diagonals the face's triangulation
        added, locate the affine ring vertices of the face's neck clip; the
        weights are Blender's own interpolation of the bound groups through the
        subdivision.
        """
        evaluated, mesh = self._evaluated_mesh()
        edges = np.empty(len(mesh.edges) * 2, dtype=np.int64)
        mesh.edges.foreach_get("vertices", edges)
        loop_start = np.empty(len(mesh.polygons), dtype=np.int64)
        loop_total = np.empty(len(mesh.polygons), dtype=np.int64)
        mesh.polygons.foreach_get("loop_start", loop_start)
        mesh.polygons.foreach_get("loop_total", loop_total)
        loop_vertex = np.empty(len(mesh.loops), dtype=np.int64)
        mesh.loops.foreach_get("vertex_index", loop_vertex)
        # The face basis was fan-triangulated from each polygon's first loop
        # corner before its neck clip, so a clipped edge can be a fan diagonal
        # as well as a mesh edge; both are offered to the correspondence.
        diagonals = []
        for polygon in range(len(loop_start)):
            start, total = int(loop_start[polygon]), int(loop_total[polygon])
            for k in range(2, total - 1):
                diagonals.append((int(loop_vertex[start]), int(loop_vertex[start + k])))
        if diagonals:
            edges = np.concatenate([edges.reshape(-1, 2), np.array(diagonals, dtype=np.int64)], axis=0).reshape(-1)
        index_to_owner = {index: owner for owner, index in self.groups.items()}
        weights = []
        for vertex in mesh.vertices:
            weights.append({index_to_owner[g.group]: float(g.weight) for g in vertex.groups if g.group in index_to_owner})
        evaluated.to_mesh_clear()
        return {"edges": edges.reshape(-1, 2), "weights": weights}

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
        """Resolve a target name such as `head/head-scale-horiz-incr` to its gzip file."""
        return os.path.join(MPFB_DATA, "targets", name + ".target.gz")

    def set_target(self, name, weight):
        """Load a regional target once as a shape key and set its weight."""
        key = "face:" + name
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

    def restore(self):
        """Return every regional key to zero and the macro axes to their defaults."""
        for key in self.loaded:
            self.TargetService.set_target_value(self.human, key, 0.0)
        self.set_macro()
