"""Sample the source's population model on the face basis (offline, Blender).

Run from the repository root:

    blender --background --factory-startup --python test/scripts/face-review/extract-face-population.py -- PRE_DENTAL_BASIS.json.gz OUTPUT.npz

MPFB builds a human from macro axes by a multilinear blend of its
`macrodetails` targets: each `race-gender-age` target is weighted by the
product of the race share, the gender component and the age component, and
the `universal-gender-age-muscle-weight` targets by the product of their four
components (`TargetService.calculate_target_stack_from_macro_info_dict`).
Linear shape channels reproduce such a blend only on one axis at a time;
across axes the products are missing (1 to 2.6 mm rms over the face when a
pure ancestry, a sex and an age are combined). This script samples the model
at every corner the face basis needs, so `prepare-population-basis.ts` can
publish the ancestry axes as channels and the products as correctives, which
the builder evaluates as the same products.

States: race in {default equal mixture, pure african, pure asian, pure
caucasian} x gender in {0, 0.5, 1} x age in {0.25, 0.5, 1.0}, the corners the
face basis's `globalSexualDimorphism` and `globalAgeStructure` endpoints were
sampled at (extraction receipt `macroSource`), muscle and weight at their
defaults. Every state is read on all six surfaces through the same
evaluation that reproduces the basis: the skin through the limit-surface
subdivision and the committed correspondence, and the five system-asset
proxies fitted to the base mesh by MPFB's own `fit_clothes_to_human` and
subdivided as the basis has them (eyes twice and the tongue once on the
limit surface, the rest not at all), each matched to the basis order by
exact position at the neutral. The joint cubes are read as centroids. The
neutral of the pre-dental basis is required because the dental revision
moved the maxillary arch after extraction.

Each state is stored as positions in the face frame; the binocular frame
shift is left to the preparation, which subtracts the change of the eye
surface centroid exactly as the original extraction did. Restoring the
default state must recover the neutral to the last bit, or nothing is
written.
"""
import gzip
import json
import os
import sys
import time

import bpy
import numpy as np
from mathutils import Vector, kdtree

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from face_extraction.correspondence import Correspondence, to_face_frame  # noqa: E402
from face_extraction.session import MPFB_DATA, ROOT, Session  # noqa: E402

ASSETS = os.path.join(ROOT, ".references", "makehuman-system-assets", "extracted")
PROXIES = {
    "Human.eyebrow001": ("eyebrows/eyebrow001/eyebrow001.mhclo", "Eyebrows", 0),
    "Human.eyelashes01": ("eyelashes/eyelashes01/eyelashes01.mhclo", "Eyelashes", 0),
    "Human.low-poly": ("eyes/low-poly/low-poly.mhclo", "Eyes", 2),
    "Human.teeth_base": ("teeth/teeth_base/teeth_base.mhclo", "Teeth", 0),
    "Human.tongue01": ("tongue/tongue01/tongue01.mhclo", "Tongue", 1),
}
CUBES = [
    "joint-mouth", "joint-jaw", "joint-l-eye", "joint-r-eye", "joint-l-eye-target", "joint-r-eye-target",
    "joint-head", "joint-head-2", "joint-neck", "joint-tongue-1", "joint-tongue-2", "joint-tongue-3", "joint-tongue-4",
]
RACES = {
    "default": None,
    "african": {"african": 1.0, "asian": 0.0, "caucasian": 0.0},
    "asian": {"african": 0.0, "asian": 1.0, "caucasian": 0.0},
    "caucasian": {"african": 0.0, "asian": 0.0, "caucasian": 1.0},
}
GENDERS = [0.0, 0.5, 1.0]
AGES = [0.25, 0.5, 1.0]
EXACT = 1e-7


def log(*parts):
    print("[population]", *parts, flush=True)


def evaluated(obj):
    depsgraph = bpy.context.evaluated_depsgraph_get()
    ev = obj.evaluated_get(depsgraph)
    mesh = ev.to_mesh()
    out = np.empty(len(mesh.vertices) * 3, dtype=np.float64)
    mesh.vertices.foreach_get("co", out)
    ev.to_mesh_clear()
    return out.reshape(-1, 3)


def cube_groups():
    with open(os.path.join(MPFB_DATA, "mesh_metadata", "basemesh_vertex_groups.json"), encoding="utf-8") as file:
        groups = json.load(file)
    return {name: np.concatenate([np.arange(a, b + 1) for a, b in groups[name]]) for name in CUBES}


def main():
    args = sys.argv[sys.argv.index("--") + 1:]
    basis_path, output = args[0], args[1]
    with gzip.open(basis_path, "rt", encoding="utf-8") as file:
        basis = json.load(file)
    started = time.time()
    session = Session()
    from bl_ext.user_default.mpfb.entities.clothes.mhclo import Mhclo
    from bl_ext.user_default.mpfb.services.clothesservice import ClothesService
    from bl_ext.user_default.mpfb.services.humanservice import HumanService

    skin = session.sample_skin()
    correspondence = Correspondence(skin, session.read_topology()["edges"], basis)
    if correspondence.worst > EXACT:
        raise SystemExit("The subdivided skin does not reproduce the basis.")
    proxies = {}
    for surface, (relative, kind, levels) in PROXIES.items():
        path = os.path.join(ASSETS, relative)
        obj = HumanService.add_mhclo_asset(path, session.human, asset_type=kind, subdiv_levels=0, material_type="NONE", set_up_rigging=False)
        for modifier in list(obj.modifiers):
            obj.modifiers.remove(modifier)
        if levels:
            modifier = obj.modifiers.new("subdivision", "SUBSURF")
            modifier.levels = levels
            modifier.render_levels = levels
            modifier.use_limit_surface = True
            modifier.quality = 3
        mhclo = Mhclo()
        mhclo.load(path)
        mhclo.clothes = obj
        target = np.array(next(s for s in basis["surfaces"] if s["id"] == surface)["positions"]).reshape(-1, 3)
        points = to_face_frame(evaluated(obj), correspondence.offset)
        tree = kdtree.KDTree(len(points))
        for index, point in enumerate(points):
            tree.insert(Vector(point.tolist()), index)
        tree.balance()
        order = np.empty(len(target), dtype=np.int64)
        worst = 0.0
        for index, point in enumerate(target):
            _co, source, distance = tree.find(Vector(point.tolist()))
            order[index] = source
            worst = max(worst, distance)
        if worst > EXACT or len(set(order.tolist())) != len(order):
            raise SystemExit(f"{surface} does not reproduce the basis (worst {worst}).")
        proxies[surface] = (obj, mhclo, order)
        log("proxy", surface, "vertices", len(target), "worst", worst)
    groups = cube_groups()

    def sample():
        for obj, mhclo, _order in proxies.values():
            ClothesService.fit_clothes_to_human(obj, session.human, mhclo, set_parent=False)
        out = {"Human": correspondence.evaluate(session.sample_skin())}
        for surface, (obj, _mhclo, order) in proxies.items():
            out[surface] = to_face_frame(evaluated(obj), correspondence.offset)[order]
        helpers = session.sample_helpers()
        out["landmarks"] = to_face_frame(np.array([helpers[rows].mean(axis=0) for rows in groups.values()]), correspondence.offset)
        return out

    def set_state(race, gender, age):
        session.set_macro(gender=gender, age=age)
        values = race or {"african": 1 / 3, "asian": 1 / 3, "caucasian": 1 / 3}
        if race is None:
            values = None
        if values is not None:
            for name, value in values.items():
                session.Properties.set_value(name, float(value), entity_reference=session.human)
            session.TargetService.reapply_macro_details(session.human, remove_zero_weight_targets=False)

    def restore_race():
        default = session.TargetService.get_default_macro_info_dict()["race"]
        for name, value in default.items():
            session.Properties.set_value(name, float(value), entity_reference=session.human)

    neutral = sample()
    for surface, positions in neutral.items():
        if surface == "landmarks":
            continue
        reference = np.array(next(s for s in basis["surfaces"] if s["id"] == surface)["positions"]).reshape(-1, 3)
        error = float(np.abs(positions - reference).max())
        log("neutral", surface, error)
        if error > EXACT:
            raise SystemExit(f"The neutral {surface} does not reproduce the basis ({error}).")
    states = {}
    for race_name, race in RACES.items():
        for gender in GENDERS:
            for age in AGES:
                restore_race()
                set_state(race, gender, age)
                key = f"{race_name}|{gender}|{age}"
                states[key] = sample()
                log("state", key, round(time.time() - started, 1))
    restore_race()
    session.set_macro()
    recovered = sample()
    recovery = max(float(np.abs(recovered[s] - neutral[s]).max()) for s in neutral)
    log("recovery", recovery)
    if recovery != 0.0:
        raise SystemExit("Restoring the default did not recover the neutral exactly.")
    arrays = {}
    for key, sample_ in states.items():
        for surface, positions in sample_.items():
            arrays[f"{key}|{surface}"] = positions
    np.savez_compressed(output, **arrays)
    log("written", output, len(arrays), "arrays", round(time.time() - started, 1), "s")


main()
