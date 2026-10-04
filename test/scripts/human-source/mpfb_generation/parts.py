"""Attached face parts refitted by MPFB under each macro state.

The published face carries five attached parts (eyebrows, eyelashes, teeth,
tongue, low-poly eyes). Each is a CC0 MHCLO proxy that MPFB fits to the base
mesh from the proxy's own vertex bindings. Refitting after every macro state
samples the part as MPFB would show it, so a part row driven by a body macro
can be regenerated at the body's node from the same base as the skin.

Positions are recorded at subdivision levels 0, 1 and 2 (Catmull-Clark,
limit surface, quality 3, as for the skin) because the published parts were
emitted at different levels; the compiler picks the level whose vertex count
and neutral match the published part, and reports a part it cannot match.
Coordinates are Blender metres in world space.
"""
import os

import bpy
import numpy as np

LEVELS = (0, 1, 2)


def part_files(assets, makehuman):
    """Published part surface id -> MHCLO path in the acquired upstream."""
    return {
        "Human.eyebrow001": os.path.join(assets, "eyebrows", "eyebrow001", "eyebrow001.mhclo"),
        "Human.eyelashes01": os.path.join(assets, "eyelashes", "eyelashes01", "eyelashes01.mhclo"),
        "Human.teeth_base": os.path.join(assets, "teeth", "teeth_base", "teeth_base.mhclo"),
        "Human.tongue01": os.path.join(assets, "tongue", "tongue01", "tongue01.mhclo"),
        "Human.low-poly": os.path.join(makehuman, "makehuman", "data", "eyes", "low-poly", "low-poly.mhclo"),
    }


class Parts:
    """The five parts loaded on one session's human, refitted on demand."""

    def __init__(self, session, files):
        from bl_ext.user_default.mpfb.entities.clothes.mhclo import Mhclo
        from bl_ext.user_default.mpfb.services.clothesservice import ClothesService
        from bl_ext.user_default.mpfb.services.humanservice import HumanService

        self.session = session
        self.ClothesService = ClothesService
        self.items = {}
        for part, path in files.items():
            obj = HumanService.add_mhclo_asset(path, session.human, asset_type="Eyes" if part.endswith("low-poly") else "Bodypart",
                                               subdiv_levels=0, set_up_rigging=False, interpolate_weights=False,
                                               import_subrig=False, import_weights=False)
            mhclo = Mhclo()
            mhclo.load(path)
            mhclo.clothes = obj
            self.items[part] = (obj, mhclo)

    def sample(self):
        """Part id -> level -> (n, 3) world positions after refitting to the current shape."""
        out = {}
        for part, (obj, mhclo) in self.items.items():
            self.ClothesService.fit_clothes_to_human(obj, self.session.human, mhclo=mhclo, set_parent=False)
            levels = {}
            for level in LEVELS:
                for modifier in list(obj.modifiers):
                    if modifier.type == "SUBSURF":
                        obj.modifiers.remove(modifier)
                if level > 0:
                    subsurf = obj.modifiers.new("subdivision", "SUBSURF")
                    subsurf.levels = level
                    subsurf.subdivision_type = "CATMULL_CLARK"
                    subsurf.use_limit_surface = True
                    subsurf.quality = 3
                evaluated = obj.evaluated_get(bpy.context.evaluated_depsgraph_get())
                mesh = evaluated.to_mesh()
                co = np.empty(len(mesh.vertices) * 3, dtype=np.float64)
                mesh.vertices.foreach_get("co", co)
                evaluated.to_mesh_clear()
                world = np.array(obj.matrix_world, dtype=np.float64)
                levels[level] = co.reshape(-1, 3) @ world[:3, :3].T + world[:3, 3]
            out[part] = levels
        return out
