"""Register the whole atlas anatomy into the target neutral body.

From the repository root:
  python test/scripts/human-source/body-anatomy/author_body_registration.py PLAN OPERATORS LAYER_SURFACES OUTPUT

PLAN is the compile plan of the registered whole assembly this candidate
replaces members of. OPERATORS is the superseded per-bone operator packet;
its bone composition and joint spans pose the atlas, and its operators carry
rig sites back to the atlas frame, but no geometry is placed by them.
LAYER_SURFACES is the layer-surfaces.json the compile entry wrote for the
same body basis: the package's own fascial face, consumed and not
recomputed. OUTPUT must lie under the campaign artifacts.

One map carries every bone, muscle, connective part and gland from the atlas
frame A to the target neutral frame N (Dicko et al., Anatomy Transfer, ACM
TOG 32(6), 2013, with an automatic pose initialisation):

1. The atlas is posed like the target, region by region, under one size.
   Harmonic weights with zero flux at the boundary blend the regions.
2. The atlas's under-skin sheet, posed, is matched to the target's fascial
   face, and that boundary displacement alone is extended harmonically
   inward. The atlas's external genitalia are removed first.
3. Each bone group is placed nearest to where step 2 carried it, inside the
   fascial face, moving as one body with scales along its own axes.
4. With the bones held there, the boundary displacement is extended inward
   again, now zero on the bones. Steps 1, 3 and 4 make the map.

The map is authored on the atlas's right half and mirrored, because the
atlas is one asymmetric person and the target is symmetric; left members are
mirror images of right ones. The body's faces end at the collar, so above it
the atlas boundary is left free and containment is not judged: the head's
skin belongs to the face owner. This is an overview pass of a generic
adaptation of one male atlas individual. Regions are coarse (the spine and
ribs move as one body, a scapula with its clavicle), and nothing here is a
personal reconstruction, a clinical joint centre or a tissue distribution.
"""
import argparse
import json
import sys
import time
from pathlib import Path

import numpy as np
import trimesh
from scipy import ndimage
from scipy.spatial import cKDTree

from anatomy_field import HalfGrid, connected_to, extend, sample, solid_points, solve_laplace
from atlas_exterior import cap_rims, remove_unmatched_exterior, skin_sheets
from atlas_inputs import plan_members, read_member, read_raw_obj, read_target, sagittal_plane, sha256
from bone_groups import COARSE, REAUTHORED, REPRESENTATIVE, BoneGroups, coarse_of
from bone_registration import condylar_centre, contained_fit, femoral_head, malleolar_centre, mirrored
from closest_surface import ClosestSurface
from coccyx_authoring import author_coccyx
from fold_reading import read_folds
from skin_correspondence import edge_list, fit

ROOT = Path(__file__).resolve().parents[4]
ARTIFACTS = ROOT / ".wiki/08-campaigns/2707-human/artifacts"
SKIN = ROOT / ".references/bodyparts3d/compartment-references/FJ2810.obj"
SKIN_PARTOF_SHA256 = "50fb17d0b3559b8b6c5481dbe7f877d25726e576564da615c45b2dd7654e315d"
MIRROR = np.asarray([-1.0, 1.0, 1.0])
FIT_VERTICES = 300
ADIPOSE = {"subcutaneousAdipose", "abdominalVisceralAdipose"}
# Named skin points of the target and the atlas bone whose named extreme lies under each.
LANDMARKS = {"midpatella-right": ("rightPatella", 2, 1), "stylion-right": ("rightRadius", 1, -1),
             "metacarpale-ii-right": ("rightIndexFingerMetacarpal", 1, -1), "metacarpale-v-right": ("rightLittleFingerMetacarpal", 1, -1)}


def symmetrise(points, faces):
    """Average a midline surface with its own mirror image, vertex by vertex."""
    reflected, _ = ClosestSurface(points, faces).query(points * MIRROR)
    return (points + reflected * MIRROR) / 2


def main():
    started = time.perf_counter()
    parser = argparse.ArgumentParser()
    for name in ("plan", "operators", "layer_surfaces", "output"):
        parser.add_argument(name, type=Path)
    parser.add_argument("--pitch-metres", type=float, default=.004)
    args = parser.parse_args()
    output = args.output.resolve()
    if not output.is_relative_to(ARTIFACTS):
        raise ValueError("Registration candidates belong under the campaign artifacts.")
    output.mkdir(parents=True, exist_ok=True)
    pitch = args.pitch_metres
    receipts = {}
    plan_bytes = args.plan.read_bytes()
    plan = json.loads(plan_bytes)
    plan_directory = args.plan.resolve().parent
    all_parts = ARTIFACTS / "all-parts"
    body_id, _, target_faces, _, named = read_target((plan_directory / plan["bodyView"]).resolve(), receipts, ROOT)
    layer_bytes = args.layer_surfaces.read_bytes()
    layer = json.loads(layer_bytes)
    # Every limited offset observation must be present and non-refusing. Older
    # packets omit no-hit coverage and cannot establish the current condition.
    layer_counts = [layer.get(name) for name in (
        "beyondReachVertices", "unmeasuredReachVertices", "dermalInvertedTriangles", "invertedTriangles")]
    if layer["basis"] != body_id or any(type(count) is not int or count != 0 for count in layer_counts):
        raise ValueError("Layer registration requires the same basis, complete opposite-sheet observations and no reported offset inversion or reach refusal; this is not a proof of global embedding.")
    fascia = np.asarray(layer["fascia"], dtype=np.float64).reshape((-1, 3))
    target = ClosestSurface(fascia, target_faces)
    collar = float(fascia[:, 1].max())

    def depth(points):
        """Signed distance to the fascial face; above the collar the body has no face to judge by."""
        signed = target.signed(points * np.where(points[:, 0:1] > 0, MIRROR, 1.0))
        return np.where(points[:, 1] > collar - .01, -1.0, signed)

    by_part = {}
    for part, member, file in plan_members(plan):
        by_part.setdefault(part, []).append((member, file))
    plane = 0.0

    def atlas(part, member):
        points, faces = read_member(part, member, all_parts, receipts, ROOT)
        return points - np.asarray([plane, 0.0, 0.0]), faces

    plane = sagittal_plane(atlas("leftGluteusMedius", by_part["leftGluteusMedius"][0][0])[0], atlas("rightGluteusMedius", by_part["rightGluteusMedius"][0][0])[0])
    operator_bytes = args.operators.read_bytes()
    packet = json.loads(operator_bytes)
    groups = BoneGroups(packet, plane)
    bones = {}
    for part in groups.owner:
        surfaces = [atlas(part, member) for member, _ in by_part[part]]
        bones[part] = [(symmetrise(points, faces), faces) for points, faces in surfaces] if groups.midline(part) else surfaces
    size = groups.size()
    transforms = groups.pose(size)
    posed = {name: {"linear": linear.tolist(), "translation": translation.tolist()} for name, (linear, translation) in transforms.items()}

    skin_points, skin_faces = read_raw_obj(SKIN, receipts, ROOT)
    # BodyParts3D ships FJ2810 in both trees with different bytes; this map consumes the part-of member (BP10155).
    if receipts[str(SKIN.relative_to(ROOT)).replace("\\", "/")] != SKIN_PARTOF_SHA256:
        raise ValueError("The atlas exterior is not the registered part-of FJ2810 member.")
    skin_points = skin_points - np.asarray([plane, 0.0, 0.0])
    _, sheet, skin_account = skin_sheets(skin_points, skin_faces)
    top = max(points[:, 1].max() for points, _ in bones["c1"]) + .01
    grid = HalfGrid((skin_points[:, 1].min(), skin_points[:, 2].min()), np.abs(skin_points[:, 0]).max(), (top, skin_points[:, 2].max()), pitch)
    capped_points, capped_faces, skin_account["cappedRims"] = cap_rims(skin_points, sheet)
    # A cell counts when its centre is inside the sheet. The atlas arm lies
    # against the trunk closer than a cell; counting every touched cell would
    # weld the armpit shut and carry that weld into the target's open one.
    solid = solid_points(trimesh.Trimesh(vertices=capped_points, faces=capped_faces, process=False), pitch, ClosestSurface(skin_points, sheet).signed)
    skin_account["latticeVolumeCubicMetres"] = float(len(solid) * pitch ** 3)
    # Centre-sampled cells hold the enclosed volume to within half a cell layer over the sheet's area.
    if abs(skin_account["latticeVolumeCubicMetres"] - skin_account["innerVolumeCubicMetres"]) > skin_account["outerAreaSquareMetres"] * pitch / 2:
        raise ValueError("The atlas under-skin sheet does not enclose its own volume on this lattice.")
    body = grid.occupy(solid[(solid[:, 0] < 0) & (solid[:, 1] < top)])
    coxal = bones["rightCoxalBone"][0][0]
    body, unmatched = remove_unmatched_exterior(body, grid, coxal[coxal[:, 0] > -.03])
    # Each bone cell belongs to one fine group: the first bone, in the packet's
    # proximal-first order, whose solid reaches it.
    label = np.full(grid.shape, -1, dtype=np.int16)
    for part, surfaces in bones.items():
        for points, faces in surfaces:
            cells = solid_points(trimesh.Trimesh(vertices=points, faces=faces, process=False), pitch)
            reached = grid.occupy(cells[(cells[:, 0] < 0) & (cells[:, 1] < top)])
            label[reached & (label < 0)] = groups.fine.index(groups.owner[part])
    bone_cells = label >= 0
    region_of = np.asarray([COARSE.index(coarse_of(owner)) for owner in groups.fine])
    region_cells = {name: bone_cells & (region_of[np.maximum(label, 0)] == at) for at, name in enumerate(COARSE)}
    whole = body | bone_cells
    volume = connected_to(whole, bone_cells)
    solves, weights = {}, {}
    for name in COARSE[1:]:
        field, solves["weight:" + name] = solve_laplace(volume, bone_cells, region_cells[name].astype(np.float64), tolerance=1e-7)
        weights[name] = extend(field, volume).astype(np.float32)

    def blended(points, placements):
        """Region or group placements blended by the regions' harmonic weights (right half)."""
        share = {name: sample(grid, weights[name], points) for name in COARSE[1:]}
        share["pelvis"] = 1 - sum(share.values())
        result = np.zeros_like(points)
        for name in COARSE:
            linear, translation = placements[name]
            result += share[name][:, None] * (points @ linear.T + translation)
        return result

    index, inside = grid.cells(skin_points)
    chosen = np.zeros(len(skin_points), dtype=bool)
    chosen[np.unique(sheet)] = True
    chosen &= (skin_points[:, 0] <= 0) & inside
    # A sheet vertex sits on the boundary, so its own cell may be an outside
    # one; it is kept when any cell touching it belongs to the volume.
    near = ndimage.binary_dilation(volume, structure=np.ones((3, 3, 3)))
    chosen[chosen] = near[index[chosen, 0], index[chosen, 1], index[chosen, 2]]
    # Above the collar the body has no fascial face; that boundary stays free.
    chosen[chosen] = blended(skin_points[chosen], transforms)[:, 1] < collar - .01
    edges, counts = edge_list(sheet, chosen)
    source_skin = skin_points[chosen]
    aligned = blended(source_skin, transforms)
    tree = cKDTree(source_skin)
    pins = []
    for name, (bone, axis, sign) in LANDMARKS.items():
        points = bones[bone][0][0]
        pins.append((int(tree.query(points[(sign * points[:, axis]).argmax()])[1]), fascia[named[name]]))
    fitted, remaining = fit(aligned, edges, counts, target, pins)
    skin_index = index[chosen]
    skin_cells = np.zeros(grid.shape, dtype=bool)
    skin_cells[skin_index[:, 0], skin_index[:, 1], skin_index[:, 2]] = True
    skin_cells &= ~bone_cells & volume
    flat = np.ravel_multi_index(skin_index.T, grid.shape)
    hits = np.bincount(flat, minlength=int(np.prod(grid.shape))).reshape(grid.shape)

    def inward(displacement, fixed, name, on_bone=None):
        """Harmonic extension of a boundary displacement and, when given, of the bone cells' own."""
        fields = []
        for axis in range(3):
            total = np.bincount(flat, weights=displacement[:, axis], minlength=int(np.prod(grid.shape))).reshape(grid.shape)
            values = np.where(skin_cells, total / np.maximum(hits, 1), 0.0)
            if on_bone is not None:
                values[bone_cells] = on_bone[:, axis]
            field, solves[name + ":" + "xyz"[axis]] = solve_laplace(volume, fixed, values, "odd" if axis == 0 else "even", 1e-7)
            fields.append(extend(field, volume).astype(np.float32))
        return fields

    # The boundary alone first decides where the interior goes; the bones carry no condition yet.
    free = inward(fitted - aligned, skin_cells, "boundaryOnly")
    print("fields solved", round(time.perf_counter() - started), "s", flush=True)
    placements, fits = {}, {}
    for owner in groups.fine:
        own = np.vstack([points for part, surfaces in bones.items() if groups.owner[part] == owner for points, _ in surfaces])
        own = own[own[:, 0] <= 0]
        carried = blended(own, transforms) + np.column_stack([sample(grid, field, own) for field in free])
        step = max(1, len(own) // FIT_VERTICES)
        fit_points, fit_carried = own[::step], carried[::step]
        midline = not owner.startswith("right")
        if midline:
            # A midline group is fitted with its mirror image and keeps the sagittal plane.
            fit_points, fit_carried = np.vstack((fit_points, fit_points * MIRROR)), np.vstack((fit_carried, fit_carried * MIRROR))
        linear, translation, account = contained_fit(fit_points, fit_carried, depth, midline=midline)
        depths = depth(own @ linear.T + translation)
        # The fit steered on a subsample; containment is read back on every vertex and nothing is clamped.
        account.update({"allVertices": int(len(own)), "outsideVertices": int((depths > 0).sum()), "deepestOutsideMetres": float(max(depths.max(), 0.0)), "refused": bool((depths > 0).any())})
        placements[owner], fits[owner] = (linear, translation), account
    # Regions are blended by their representative group's placement. A bone
    # cell of another group of the region then carries the difference to its
    # own group's placement, so every bone cell maps exactly as its bone does.
    print("bones placed", round(time.perf_counter() - started), "s", flush=True)
    region_placements = {name: placements[REPRESENTATIVE[name]] for name in COARSE}
    centres = grid.centres(bone_cells)
    own_label = label[bone_cells]
    on_bone = -blended(centres, region_placements)
    for at, owner in enumerate(groups.fine):
        mine = own_label == at
        on_bone[mine] += centres[mine] @ placements[owner][0].T + placements[owner][1]
    residual = inward(fitted - blended(source_skin, region_placements), bone_cells | skin_cells, "displacement", on_bone)

    def registered(points):
        """The whole map A -> N, for points on either side of the plane."""
        side = np.where(points[:, 0] > 0, -1.0, 1.0)
        right = points * np.column_stack((side, np.ones(len(points)), np.ones(len(points))))
        result = blended(right, region_placements) + np.column_stack([sample(grid, field, right) for field in residual])
        result[:, 0] *= side
        return result

    low = float(skin_points[:, 1].min())
    heights = np.linspace(low, top, 7)
    fold, folded = read_folds(grid, volume, registered, {"band" + str(at) + ":" + format(heights[at], ".2f") + "-" + format(heights[at + 1], ".2f"): (heights[at], heights[at + 1] + (1 if at == 5 else 0)) for at in range(6)})
    written = []

    def write(part, member, points, faces=None, account="", consumed=None, authored=None):
        name = part + "--" + member.replace("/", "-")
        (output / (name + ".positions.f64")).write_bytes(np.ascontiguousarray(points, dtype="<f8").tobytes())
        record = {"part": part, "member": member, "vertices": int(len(points)), "positions": name + ".positions.f64", "account": account}
        if faces is not None:
            (output / (name + ".indices.i32")).write_bytes(np.ascontiguousarray(faces, dtype="<i4").tobytes())
            record["indices"] = name + ".indices.i32"
        if consumed is not None:
            record["consumedPart"], record["consumedMember"] = consumed
        if authored is not None:
            record["authoredSource"] = authored
        written.append(record)

    soft = {}
    for part, sources in by_part.items():
        origin = groups.right_origin(part)
        if origin is not None:
            if len(sources) != len(bones[origin]):
                raise ValueError("Mirrored bones need the same member count on both sides: " + part)
            linear, translation = placements[groups.owner[origin]]
            for (member, _), (origin_member, _), (points, faces) in zip(sources, by_part[origin], bones[origin]):
                placed = points @ linear.T + translation
                if origin == part:
                    write(part, member, placed, None, "own atlas member under its bone group's registered placement")
                else:
                    write(part, member, placed * MIRROR, faces[:, [0, 2, 1]],
                          "sagittal mirror of " + origin + "; the original left member is retained by its receipt and not consumed", (origin, origin_member))
        elif part not in ADIPOSE and part not in REAUTHORED:
            for member, _ in sources:
                points, _ = atlas(part, member)
                right = points * np.where(points[:, 0:1] > 0, MIRROR, 1.0)
                cell, valid = grid.cells(right)
                known = valid.copy()
                known[valid] = volume[cell[valid, 0], cell[valid, 1], cell[valid, 2]]
                image = registered(points)
                depths = depth(image)
                soft[part + "/" + member] = {"vertices": int(len(points)), "atlasVerticesOutsideAtlasVolume": int((~known).sum()),
                                             "verticesInFoldedCells": int(folded[cell[valid, 0], cell[valid, 1], cell[valid, 2]].sum()),
                                             "outsideFasciaVertices": int((depths > 0).sum()), "deepestOutsideMetres": float(max(depths.max(), 0.0))}
                write(part, member, image, None, "harmonic registration of its own atlas member")
    sacrum = bones["sacrum"][0][0] @ placements["sacrum"][0].T + placements["sacrum"][1]
    coccyx_points, coccyx_faces, coccyx_account = author_coccyx(sacrum)
    coccyx_depths = depth(coccyx_points)
    coccyx_account.update({"outsideVertices": int((coccyx_depths > 0).sum()), "deepestOutsideMetres": float(max(coccyx_depths.max(), 0.0)), "refused": bool((coccyx_depths > 0).any())})
    for part in REAUTHORED:
        (output / (part + ".authored.json")).write_text(json.dumps({"positions": coccyx_points.reshape(-1).tolist(), "indices": coccyx_faces.reshape(-1).tolist(), "account": coccyx_account}), encoding="utf-8")
        write(part, by_part[part][0][0], coccyx_points, coccyx_faces, "authored in the target frame as a continuation of the registered sacrum", None, part + ".authored.json")

    femur, femur_faces = bones["rightFemur"][0]
    hip, hip_account = femoral_head(femur, 1.0)
    knee = condylar_centre(femur, femur_faces)
    ankle = malleolar_centre(bones["rightTibia"][0][0], bones["rightFibula"][0][0])
    place = lambda owner, point: placements[owner][0] @ point + placements[owner][1]
    joint_centres = {"rightCoxalBone": {"joint-r-upper-leg": place("sacrum", hip)}, "rightFemur": {"joint-r-upper-leg": place("rightFemur", hip), "joint-r-knee": place("rightFemur", knee)},
               "rightTibia": {"joint-r-knee": place("rightTibia", knee), "joint-r-ankle": place("rightTibia", ankle)}, "rightTalus": {"joint-r-ankle": place("rightfootSegment", ankle)}}
    congruence = {"hipHeadCentreToSocketCentreMetres": float(np.linalg.norm(place("sacrum", hip) - place("rightFemur", hip))),
                  "kneeCentreFemurToTibiaMetres": float(np.linalg.norm(place("rightFemur", knee) - place("rightTibia", knee))),
                  "ankleCentreTibiaToFootMetres": float(np.linalg.norm(place("rightTibia", ankle) - place("rightfootSegment", ankle)))}
    operators = {record["bone"]: record["canonicalToTarget"] for record in packet["transforms"]}
    registration = json.loads((plan_directory / plan["registration"]).resolve().read_bytes())
    old_shift = np.asarray(registration["translationMetres"]) + np.asarray([plane, 0.0, 0.0])
    nodes = json.loads((plan_directory / plan["rig"]).resolve().read_bytes())["nodes"]
    xyz = lambda value: np.asarray([value["x"], value["y"], value["z"]])
    for node in nodes:
        bone = node["id"]
        origin = "sacrum" if bone in REAUTHORED else groups.right_origin(bone)
        if origin is None:
            continue
        linear, translation = placements[groups.owner[origin]]
        if origin != bone and bone not in REAUTHORED:
            linear, translation = mirrored(linear, translation)
        old_linear = np.asarray(operators[bone]["linear"]).reshape((3, 3))
        old_translation = np.asarray(operators[bone]["translation"])
        # Old target point -> old canonical atlas point -> centred atlas point -> registered point.
        carry = lambda point: linear @ (np.linalg.solve(old_linear, point - old_translation) - old_shift) + translation
        q = node["rest"]["rotation"]
        x, y, z, w = q["x"], q["y"], q["z"], q["w"]
        rotation = np.asarray([[1 - 2 * (y * y + z * z), 2 * (x * y - z * w), 2 * (x * z + y * w)], [2 * (x * y + z * w), 1 - 2 * (x * x + z * z), 2 * (y * z - x * w)],
                               [2 * (x * z - y * w), 2 * (y * z + x * w), 1 - 2 * (x * x + y * y)]])
        old_rest = xyz(node["rest"]["position"])
        new_rest = carry(old_rest)
        for site in node["sites"]:
            site["position"] = dict(zip("xyz", map(float, rotation.T @ (carry(old_rest + rotation @ xyz(site["position"])) - new_rest))))
        node["rest"]["position"] = dict(zip("xyz", map(float, new_rest)))
        for landmark, world in joint_centres.get(origin, {}).items() if bone not in REAUTHORED else ():
            if origin != bone:
                landmark, world = landmark.replace("joint-r-", "joint-l-"), world * MIRROR
            node["sites"].append({"id": "registeredJointCentre:" + landmark, "position": dict(zip("xyz", map(float, rotation.T @ (world - new_rest)))),
                                  "account": "Atlas joint centre (femoral head sphere fit, distal condylar centroid or malleolar midpoint) under this bone's registered placement; named for the target rig landmark it is compared with",
                                  "qualification": "Authored geometric convention on one atlas individual, not a measured functional joint centre; the rig landmark is a skinning pivot and is not moved"})
    (output / "source-rig-nodes.json").write_text(json.dumps(nodes, separators=(",", ":")) + "\n", encoding="utf-8")

    closure = {file.name: sha256(file.read_bytes()) for file in sorted(Path(__file__).resolve().parent.glob("*.py"))}
    refusals = [owner for owner, account in fits.items() if account["refused"]] + (["coccyx"] if coccyx_account["refused"] else [])
    receipt = {
        "schema": "automovie-body-anatomy-registration/4", "targetBodyBasis": body_id, "planSha256": sha256(plan_bytes),
        "operatorsSha256": sha256(operator_bytes), "layerSurfacesSha256": sha256(layer_bytes), "layerFieldSha256": layer["fieldSha256"],
        "inputs": receipts, "producer": closure, "pitchMetres": pitch,
        "frames": {"atlas": "BodyParts3D common metres, +X left/+Y up/+Z anterior, sagittal plane moved to x=0", "target": "canonical body metres at zero shape and no pose"},
        "atlasSagittalPlaneMetres": plane, "upperLimitAtlasMetres": float(top), "collarTargetMetres": collar, "atlasExterior": skin_account, "unmatchedExteriorRemoved": unmatched,
        "poseSize": size, "poseInitialisation": posed,
        "bonePlacements": {name: {"linear": linear.tolist(), "translation": translation.tolist()} for name, (linear, translation) in placements.items()},
        "boneFits": fits, "refusedBoneGroups": refusals, "coccyx": coccyx_account, "jointCongruence": congruence, "femoralHeadFit": hip_account,
        "volume": {"shape": list(grid.shape), "cells": int(volume.sum()), "discardedCells": int((whole & ~volume).sum()), "boneCells": {name: int(cells.sum()) for name, cells in region_cells.items()}},
        "solves": solves,
        "boundaryFit": {"vertices": int(chosen.sum()), "posedToTargetMetres": {"median": float(np.median(np.linalg.norm(fitted - aligned, axis=1))), "maximum": float(np.linalg.norm(fitted - aligned, axis=1).max())},
                        "beforeFinalProjectionMetres": {"median": float(np.median(remaining)), "maximum": float(remaining.max())}, "landmarks": list(LANDMARKS)},
        "fold": fold, "soft": soft, "members": written,
        "rights": "BodyParts3D members under the publisher's receipts; the atlas exterior is the part-of tree FJ2810 (BP10155) named by artifacts/all-parts/atlas-skin-FJ2810-rights-receipt.json. The per-OBJ licence (official page CC BY 4.0, OBJ header CC BY-SA 2.1 JP) is registered as unknown, so this candidate is not published to the tracked tree.",
        "qualification": "Overview pass. Authored generic adaptation of one male atlas individual to the target neutral exterior, symmetric by construction. The atlas's external genitalia are removed before matching; its pelvis is placed by size and not reshaped to another sex; its muscle bulk and the room between its muscles and its skin are that individual's. Regions are coarse and nothing above the collar is judged. Not a personal reconstruction, clinical joint centre, physiological tissue distribution or rendered acceptance.",
        "wallSeconds": time.perf_counter() - started, "python": sys.version.split()[0],
    }
    (output / "registration-receipt.json").write_text(json.dumps(receipt, indent=1) + "\n", encoding="utf-8")
    print(json.dumps({"refusedBoneGroups": len(refusals), "groups": len(fits), "coccyx": {key: coccyx_account[key] for key in ("outsideVertices", "deepestOutsideMetres")}, "jointCongruence": congruence,
                      "fold": {key: fold[key] for key in ("interiorCells", "nonPositive")}, "members": len(written), "wallSeconds": receipt["wallSeconds"]}))


if __name__ == "__main__":
    main()
