"""Author ten existing soft charts in the registered neutral frame N.

From the repository root:
  python -B test/scripts/human-source/body-anatomy/author_registered_soft_charts.py BAKED291 ARTIST_PACKET OPERATORS RAW_RIG NEW_DIRECTORY --bake-receipt BAKE_RECEIPT

The historical artist condition was a common-atlas-A chart followed by its
material bone blend. This NEW explicit condition evaluates the SAME chart
dimensions along N's lateral/vertical/anterior axes, between the SAME acquired
bone-vertex attachment ports carried by the admitted original operators.
The two conditions are different: neither one is measured personal anatomy.
No skin projection, nearest identity, thinning, optimizer or clinical target
supplies a chart. All other281 members,177 rig nodes,752 sites and two breast
fields retain their actual baked values. Only generation metadata is rebound.

Unbound controls use explicitly pinned OLD baked-N material station/ring
observations as artist reference goals, never measured anatomical identity.
Rectus ports use the same actual Pubic/Rib5 WORLD sites; aponeurosis consumes
the EXACT newly authored same-side Rectus context. Changed support requires genuine visceral
regeneration, followed by the existing23 cranial-N join and native SAT owner.
Normal whole315/F32/containment/quantity/GPU admission remains independent.
"""
import argparse
import copy
import hashlib
import json
import platform
import sys
import time
from pathlib import Path

import numpy as np
import trimesh

from atlas_inputs import read_raw_obj
from bake_static_joint_registration import normals, rotation_matrix, xyz

ROOT = Path(__file__).resolve().parents[4]
ARTIFACTS = ROOT/".wiki/08-campaigns/2707-human/artifacts/all-parts"
PARTS = tuple(side+kind for side in ("left", "right") for kind in
              ("LatissimusDorsi", "SacrotuberousLigament", "RectusAbdominis",
               "InternalOblique", "ExternalObliqueAponeurosis"))


def sha(data):
    return hashlib.sha256(data).hexdigest()


def encoded(value):
    return json.dumps(value, separators=(",", ":"), allow_nan=False).encode()


def point(value):
    """The existing source packets use either named XYZ or an XYZ array."""
    result = xyz(value) if isinstance(value, dict) else np.asarray(value, dtype=np.float64)
    if result.shape != (3,) or not np.isfinite(result).all():
        raise ValueError("An actual chart/source-joint point needs three finite metre coordinates")
    return result


def sheet_positions(grid, thickness):
    """Original two-layer chart station order; original triangles are retained."""
    du, dv = np.gradient(grid, axis=0), np.gradient(grid, axis=1)
    directions = np.cross(du, dv)
    lengths = np.linalg.norm(directions, axis=2)
    if not np.isfinite(lengths).all() or np.any(lengths < 1e-12):
        raise ValueError("Registered artist sheet has a degenerate support chart")
    directions /= lengths[:, :, None]
    upper = grid+directions*thickness[:, :, None]/2
    lower = grid-directions*thickness[:, :, None]/2
    return np.concatenate((upper.reshape((-1, 3)), lower.reshape((-1, 3))))


def chart(part, ports):
    """Same fixed original artist dimensions, explicitly evaluated in N."""
    sign = 1 if part.startswith("left") else -1
    if part.endswith("LatissimusDorsi"):
        posterior, t7, l5, insertion = ports
        u, v = np.linspace(0, 1, 25), np.linspace(0, 1, 25)
        origins = np.asarray([(1-a)*l5+a*t7 for a in u])
        origins[:6] = np.asarray([(1-a)*posterior+a*l5 for a in np.linspace(0, 1, 6)])
        grid = np.empty((25, 25, 3))
        for i, a in enumerate(u):
            end = insertion+[0, (a-.5)*.022, (a-.5)*.006]
            for j, b in enumerate(v):
                grid[i, j] = (1-b)*origins[i]+b*end+[
                    sign*.062*np.sin(np.pi*b)*(1-.35*a),
                    -.035*np.sin(np.pi*b)*(1-a), -.060*np.sin(np.pi*b)]
        thickness = .0015+.005*np.sin(np.pi*u[:, None])*np.sin(np.pi*v[None, :])
        condition = {"lateralBowMm": 62, "inferiorBowMm": 35,
                     "posteriorSweepMm": 60, "terminalSpanMm": 22,
                     "terminalAPSpanMm": 6, "thicknessMm": [1.5, 6.5]}
    else:
        sacral, posterior, ischium = ports
        u, v = np.linspace(0, 1, 13), np.linspace(0, 1, 19)
        grid = np.empty((13, 19, 3))
        for i, a in enumerate(u):
            origin = (1-a)*sacral+a*posterior
            end = ischium+[sign*(a-.5)*.010, 0, (a-.5)*.004]
            for j, b in enumerate(v):
                grid[i, j] = (1-b)*origin+b*end+[0, 0, -.006*np.sin(np.pi*b)]
        thickness = np.full((13, 19), .002)
        condition = {"posteriorBowMm": 6, "terminalWidthMm": 10,
                     "terminalAPSpanMm": 4, "thicknessMm": 2}
    return sheet_positions(grid, thickness), condition


def rectus_chart(old_mesh, ports):
    """Old N material ring observations, with the same actual endpoint ports."""
    old = np.asarray(old_mesh["positions"], dtype=np.float64).reshape((-1, 3))
    if len(old) != 982:
        raise ValueError("Original Rectus reference requires49 rings of20 plus two cap stations")
    reference = old[:980].reshape((49, 20, 3)).mean(axis=1)
    pubis, _, rib5 = ports
    t = np.linspace(0, 1, 49)
    centres = reference+(1-t[:, None])*(pubis-reference[0])+t[:, None]*(rib5-reference[-1])
    centres[0], centres[-1] = pubis, rib5
    lobes = .58+.42*np.sin(4*np.pi*t)**2
    widths = (.009+.020*np.sin(np.pi*t)**.55)*lobes
    depths = (.002+.005*np.sin(np.pi*t)**.7)*lobes
    theta = np.arange(20)*(2*np.pi/20)
    c, s = np.cos(theta), np.sin(theta)
    rings = np.repeat(centres[:, None, :], 20, axis=1)
    rings[:, :, 0] += widths[:, None]*(np.sign(c)*abs(c)**.65)[None, :]
    rings[:, :, 2] += depths[:, None]*(np.sign(s)*abs(s)**.8)[None, :]
    positions = np.vstack((rings.reshape((-1, 3)), centres[0], centres[-1]))
    context = {"centres": centres, "widths": widths, "depths": depths}
    condition = {"bellyHalfWidthMm": 29, "bellyHalfDepthMm": 7,
                 "tendinousWaistFraction": .58, "referenceStationProtocol": "OLD baked-N49x20 material ring arithmetic means; endpoints use actual Pubic/Rib5 WORLD sites",
                 "oldNReferenceRingMeans": reference.tolist(),
                 "newNCentreline": centres.tolist(), "referenceMeaning": "Authored material reference observation; no clinical centreline identity"}
    return positions, condition, context


def supported_chart(part, old_mesh, ports, rectus):
    """Existing sheet charts with explicit material-N or new Rectus support."""
    side = "left" if part.startswith("left") else "right"
    sign = 1 if side == "left" else -1
    if part.endswith("InternalOblique"):
        old = np.asarray(old_mesh["positions"], dtype=np.float64).reshape((-1, 3))
        if len(old) != 950:
            raise ValueError("Original internal-oblique station reference requires19x25x2 vertices")
        terminal_goal = (old[474]+old[949])/2
        crest, lumbar, rib12 = ports
        u, v = np.linspace(0, 1, 19), np.linspace(0, 1, 25)
        grid = np.empty((19, 25, 3))
        for i, a in enumerate(u):
            origin = (1-a)*crest+a*lumbar
            terminal = (1-a)*rib12+a*terminal_goal
            for j, b in enumerate(v):
                grid[i, j] = (1-b)*origin+b*terminal+[sign*.040*np.sin(np.pi*b),
                    -.012*np.sin(np.pi*a)*np.sin(np.pi*b), .049*np.sin(np.pi*b)]
        thickness = .0025+.002*np.sin(np.pi*u[:, None])*np.sin(np.pi*v[None, :])
        condition = {"lateralWrapMm": 40, "inferiorWrapMm": 12, "anteriorWrapMm": 49,
                     "thicknessMm": [2.5, 4.5], "oldNMaterialTerminal": terminal_goal.tolist(),
                     "referenceVertices": [474, 949], "referenceMeaning": "OLD baked-N upper/lower material station(18,24), not an anatomical correspondence"}
    else:
        centres, widths, depths = rectus["centres"], rectus["widths"], rectus["depths"]
        u, v = np.linspace(0, 1, 33), np.linspace(0, 1, 17)
        grid = np.empty((33, 17, 3))
        for i, a in enumerate(u):
            k = int(round(a*(len(centres)-1)))
            centre = centres[k]
            for j, b in enumerate(v):
                grid[i, j] = [sign*((1-b)*(abs(centre[0])+widths[k]+.003)+b*.0015),
                              centre[1], centre[2]+depths[k]+.0015+.002*np.sin(np.pi*b)]
        thickness = np.full((33, 17), .001)
        condition = {"thicknessMm": 1, "midlineHalfGapMm": 1.5,
                     "lateralTransitionGapMm": 3, "superficialSupportMm": 1.5,
                     "anteriorBowMm": 2, "sharedSupportPart": side+"RectusAbdominis",
                     "sharedSupportMeaning": "EXACT same in-memory newly authored Rectus context; no duplicated centreline policy"}
    return sheet_positions(grid, thickness), condition


def original_profile(part, record):
    """This producer owns the exact existing ten profiles and port order."""
    side = "left" if part.startswith("left") else "right"
    profile = record["artistProfile"]
    if part.endswith("LatissimusDorsi"):
        expected = [(side+"CoxalBone", "authoredPosteriorIliacCrest"),
                    ("t7", "authoredLatissimusSpinousSupport"+side.title()),
                    ("l5", "authoredLatissimusSpinousSupport"+side.title()),
                    (side+"Humerus", "authoredLatissimusGrooveInsertion")]
        valid = profile["bellyThicknessMm"] == [1.5, 6.5] and profile["terminalSpanMm"] == 22 and profile["posteriorSweepMm"] == 60
    elif part.endswith("SacrotuberousLigament"):
        expected = [("sacrum", "authoredSacrotuberousOrigin"+side.title()),
                    (side+"CoxalBone", "authoredPosteriorIliacCrest"),
                    (side+"CoxalBone", "authoredIschialTuberosity")]
        valid = profile["thicknessMm"] == 2 and profile["terminalWidthMm"] == 10
    elif part.endswith("RectusAbdominis"):
        expected = [(side+"CoxalBone", "authoredPubicCrest"),
                    (side+"Rib7", "authoredAnteriorRectusCostalSupport"),
                    (side+"Rib5", "authoredAnteriorRectusCostalSupport")]
        valid = profile["bellyHalfWidthMm"] == 29 and profile["bellyHalfDepthMm"] == 7 and profile["tendinousWaistFraction"] == .58
    elif part.endswith("InternalOblique"):
        expected = [(side+"CoxalBone", "authoredIliacCrestAbdominal"),
                    ("l3", "authoredAbdominalFascialSupport"+side.title()),
                    (side+"Rib12", "authoredInternalObliqueCostalSupport")]
        valid = profile["thicknessMm"] == [2.5, 4.5] and profile["lateralWrapMm"] == 40 and profile["anteriorWrapMm"] == 49
    else:
        expected = [(side+"CoxalBone", "authoredPubicCrest"),
                    (side+"Rib7", "authoredAnteriorRectusCostalSupport")]
        valid = profile["thicknessMm"] == 1 and profile["midlineHalfGapMm"] == 1.5
    actual = [(row["bone"], row["site"]) for row in record["attachments"]]
    if not valid or actual != expected:
        raise ValueError("The exact original artist dimensions/attachment order changed: "+part)
    return record["attachments"]


class RegisteredPorts:
    """Exact acquired source-vertex locators and existing rig-site addresses."""

    def __init__(self, packet, operators, raw_rig, baked_rig, inputs):
        self.packet, self.inputs = packet, inputs
        self.annotations = {(site["bone"], site["site"]): site for site in packet["proposedSharedSites"]}
        self.resources = {row["file"]: row for row in packet["sourceReferences"]}
        self.operators = {row["bone"]: row for row in operators["transforms"]}
        self.raw = {row["id"]: row for row in raw_rig["nodes"]}
        self.baked = {row["id"]: row for row in baked_rig["nodes"]}
        if set(self.raw) != set(self.baked) or set(self.raw) != set(self.operators) or any(len(rows) != 177 for rows in (raw_rig["nodes"], baked_rig["nodes"], operators["transforms"])):
            raise ValueError("Registered chart ports require the complete original177 graph")
        self.translation = np.asarray(operators["oldCanonicalTranslationMetres"], dtype=np.float64)
        self.cache, self.receipts = {}, []
        site_count, maximum = 0, 0.0
        for bone, raw in self.raw.items():
            mapped = self.baked[bone]
            if mapped["joint"]["kind"] != "fixed" or mapped["projections"]:
                raise ValueError("Target-N charts preserve the original held-neutral rig only")
            operator = self.operators[bone]["canonicalToTarget"]
            a, b = np.asarray(operator["linear"]).reshape((3, 3)), np.asarray(operator["translation"])
            if not np.isfinite(a).all() or not np.isfinite(b).all() or np.linalg.det(a) <= 0:
                raise ValueError("Original chart registration needs finite positive operators")
            origin, target = xyz(raw["rest"]["position"]), xyz(mapped["rest"]["position"])
            maximum = max(maximum, float(np.linalg.norm(a@origin+b-target)))
            old_r, new_r = rotation_matrix(raw["rest"]["rotation"]), rotation_matrix(mapped["rest"]["rotation"])
            target_sites = {site["id"]: site for site in mapped["sites"]}
            if {site["id"] for site in raw["sites"]} != set(target_sites):
                raise ValueError("Registered chart cannot rename or lose a source site")
            for site in raw["sites"]:
                world = origin+old_r@xyz(site["position"])
                target_world = target+new_r@xyz(target_sites[site["id"]]["position"])
                maximum = max(maximum, float(np.linalg.norm(a@world+b-target_world)))
                site_count += 1
        if site_count != 752 or maximum > 1e-9:
            raise ValueError("The baked graph does not carry all752 actual WORLD sites by the same operators")
        shared = []
        for row in operators["sharedJointSiteAudit"]:
            source_point = (point(row["sourcePair"]["child"]["world"])+point(row["sourcePair"]["parent"]["world"]))/2+self.translation
            targets = []
            for bone in (row["bone"], row["parent"]):
                mapping = self.operators[bone]["canonicalToTarget"]
                targets.append(np.asarray(mapping["linear"]).reshape((3, 3))@source_point+np.asarray(mapping["translation"]))
            shared.append(float(np.linalg.norm(targets[0]-targets[1])))
        if len(shared) != 151 or max(shared) > 1e-9:
            raise ValueError("Original actual151 shared-source joint conditions are required")
        self.graph_readback = {"bones": 177, "sites": site_count, "maximumWorldResidualMetres": maximum,
                              "sharedSites": 151, "maximumSharedResidualMetres": max(shared)}

    def resolve(self, reference):
        key = reference["bone"], reference["site"]
        annotation = self.annotations[key]
        resource = self.resources[annotation["sourceFile"]]
        if annotation["sourceSha256"] != resource["sha256"]:
            raise ValueError("Every acquired chart port must retain its actual resource SHA")
        path = (ROOT/resource["uri"]).resolve()
        if not path.is_relative_to(ROOT):
            raise ValueError("Original acquired chart port escaped its declared repository input")
        if annotation["sourceFile"] not in self.cache:
            digests = {}
            points, _ = read_raw_obj(path, digests, ROOT)
            digest = digests[str(path.relative_to(ROOT)).replace("\\", "/")]
            if digest != resource["sha256"] or digest != annotation["sourceSha256"]:
                raise ValueError("Original acquired chart port changed")
            self.inputs[str(path.relative_to(ROOT)).replace("\\", "/")] = digest
            self.cache[annotation["sourceFile"]] = points
        points = self.cache[annotation["sourceFile"]]
        ordinal = annotation["sourceVertex"]
        if not isinstance(ordinal, int) or not 0 <= ordinal < len(points):
            raise ValueError("Original authored port has an invalid actual vertex ordinal")
        actual = points[ordinal]
        if not np.array_equal(actual, np.asarray(annotation["world"], dtype=np.float64)):
            raise ValueError("Original annotation differs from its acquired vertex coordinates")
        node = self.raw[key[0]]
        site = next(site for site in node["sites"] if site["id"] == key[1])
        canonical = actual+self.translation
        world = xyz(node["rest"]["position"])+rotation_matrix(node["rest"]["rotation"])@xyz(site["position"])
        if np.linalg.norm(canonical-world) > 1e-9:
            raise ValueError("Original chart annotation and raw source rig site differ")
        operator = self.operators[key[0]]["canonicalToTarget"]
        a, b = np.asarray(operator["linear"]).reshape((3, 3)), np.asarray(operator["translation"])
        operator_target = a@canonical+b
        baked_node = self.baked[key[0]]
        baked_site = next(site for site in baked_node["sites"] if site["id"] == key[1])
        target = xyz(baked_node["rest"]["position"])+rotation_matrix(baked_node["rest"]["rotation"])@xyz(baked_site["position"])
        if np.linalg.norm(operator_target-target) > 1e-9:
            raise ValueError("Chart target port and actual baked WORLD site differ")
        self.receipts.append({"bone": key[0], "site": key[1], "sourceFile": annotation["sourceFile"],
            "sourceVertex": ordinal, "sourceSha256": annotation["sourceSha256"],
            "sourceAtlasWorld": actual.tolist(), "sourceCanonicalWorld": canonical.tolist(),
            "targetNeutralWorld": target.tolist(), "operatorMappedTargetNeutralWorld": operator_target.tolist(),
            "qualification": annotation["qualification"]})
        return target


def main():
    started = time.perf_counter()
    parser = argparse.ArgumentParser(description=__doc__)
    for name in ("assembly", "artist_packet", "operators", "raw_rig", "output"):
        parser.add_argument(name, type=Path)
    parser.add_argument("--bake-receipt", type=Path, required=True)
    args = parser.parse_args()
    output = args.output.resolve()
    if not output.is_relative_to(ARTIFACTS) or output.exists():
        raise ValueError("Registered chart authoring needs a NEW exclusive campaign directory")
    paths = {name: getattr(args, name).resolve() for name in
             ("assembly", "artist_packet", "operators", "raw_rig", "bake_receipt")}
    if any(not path.is_relative_to(ROOT) for path in paths.values()):
        raise ValueError("Registered chart inputs must retain repository-relative provenance")
    blobs = {name: path.read_bytes() for name, path in paths.items()}
    values = {name: json.loads(data) for name, data in blobs.items()}
    inputs = {str(paths[name].relative_to(ROOT)).replace("\\", "/"): sha(data) for name, data in blobs.items()}
    assembly, packet = values["assembly"], values["artist_packet"]
    operators, bake = values["operators"], values["bake_receipt"]
    if bake["operatorSha256"] != sha(blobs["operators"]):
        raise ValueError("Actual bake receipt belongs to different source operators")
    if assembly["mode"] != "neutral-only" or assembly["shape"] != {} or assembly["basis"] != operators["targetBodyBasis"]:
        raise ValueError("Chart authoring consumes the identified unshaped target-N bake only")
    if len(assembly["parts"]) != 259 or sum(len(part["surfaces"]) for part in assembly["parts"]) != 291:
        raise ValueError("The full259-part/291-member source bake is required")
    fields = [{"part": part["id"], "sha256": sha(encoded(field))} for part in assembly["parts"] for field in part.get("shapeFields", [])]
    if len(fields) != 2 or {row["part"] for row in fields} != {"leftBreastFibroglandular", "rightBreastFibroglandular"}:
        raise ValueError("The original two breast fields must remain present and unchanged")
    recipes = {name: sha((Path(__file__).parent/name).read_bytes()) for name in
               ("author_registered_soft_charts.py", "atlas_inputs.py", "bake_static_joint_registration.py")}
    if bake["recipeSha256"] != recipes["bake_static_joint_registration.py"]:
        raise ValueError("Actual bake receipt does not bind the maintained bake owner")
    historical = (ROOT/packet["recipe"]).resolve()
    if not historical.is_relative_to(ROOT) or sha(historical.read_bytes()) != packet["recipeSha256"]:
        raise ValueError("Original artist-profile recipe bytes changed; no ignored executable is imported")
    inputs[str(historical.relative_to(ROOT)).replace("\\", "/")] = packet["recipeSha256"]
    ports = RegisteredPorts(packet, operators, values["raw_rig"], assembly["rig"], inputs)
    original_rig = copy.deepcopy(assembly["rig"]["nodes"])
    source_members = {row["member"]: row for row in bake["members"]}
    original_profiles = {row["id"]: row for row in packet["parts"]}
    prepared, rectus_contexts = {}, {}
    for side in ("left", "right"):
        name = side+"RectusAbdominis"
        original = next(part for part in assembly["parts"] if part["id"] == name)
        references = original_profile(name, original_profiles[name])
        endpoints = [ports.resolve(reference) for reference in references]
        positions, condition, context = rectus_chart(original["surfaces"][0]["mesh"], endpoints)
        prepared[name] = positions, condition
        rectus_contexts[side] = context
    records, unchanged = [], []
    output.parent.mkdir(parents=True, exist_ok=True)
    output.mkdir()
    for part in assembly["parts"]:
        if part["id"] not in PARTS:
            unchanged.append({"part": part["id"], "sha256": sha(encoded(part))})
            continue
        if len(part["surfaces"]) != 1 or part.get("shapeFields"):
            raise ValueError("These ten original single charts have no shape field to reinterpret")
        surface = part["surfaces"][0]
        old_mesh, parent_source = surface["mesh"], copy.deepcopy(surface["source"])
        old = source_members[surface["id"]]
        if sha(encoded(old_mesh)) != old["bakedRawMeshSha256"] or parent_source["sha256"] != old["bakedRawMeshSha256"]:
            raise ValueError("Original registered chart payload differs from its actual bake receipt")
        profile = original_profiles[part["id"]]
        if old["originalSource"]["sha256"] != profile["meshSha256"]:
            raise ValueError("The baked chart is not the same original artist source")
        if part["id"] in prepared:
            points, condition = prepared[part["id"]]
        else:
            resolved = [ports.resolve(reference) for reference in original_profile(part["id"], profile)]
            if part["id"].endswith(("LatissimusDorsi", "SacrotuberousLigament")):
                points, condition = chart(part["id"], resolved)
            else:
                side = "left" if part["id"].startswith("left") else "right"
                points, condition = supported_chart(part["id"], old_mesh, resolved, rectus_contexts[side])
        if part["id"].endswith(("RectusAbdominis", "InternalOblique")):
            condition["pinnedNReference"] = {"uri": parent_source["uri"], "sha256": parent_source["sha256"],
                "meaning": "OLD baked-N material station observations, not anatomical correspondence or clinical measurements"}
        if len(points) != profile["vertices"] or len(old_mesh["positions"]) != 3*len(points):
            raise ValueError("New chart cannot change original source station identities")
        faces = np.asarray(old_mesh["indices"], dtype=np.int64).reshape((-1, 3))
        boundary = trimesh.Trimesh(vertices=points, faces=faces, process=False)
        if not boundary.is_watertight or not boundary.is_winding_consistent or not np.isfinite(boundary.volume) or boundary.volume <= 0:
            raise ValueError("Original chart topology does not form a positive target-N boundary")
        mesh = {**old_mesh, "positions": points.ravel().tolist()}
        mesh["normals"] = normals(mesh["positions"], mesh["indices"])
        data = encoded(mesh)
        file = output/(part["id"]+".mesh.json")
        file.write_bytes(data)
        surface["mesh"] = mesh
        surface["source"] = {**parent_source, "uri": str(file.relative_to(ROOT)).replace("\\", "/"),
            "sha256": sha(data), "revision": "registered-neutral-artist-chart/"+recipes["author_registered_soft_charts.py"],
            "acquisition": parent_source["acquisition"]+"; NEW target-N artist chart with same acquired attachment locators and fixed profile; original baked parent "+parent_source["uri"]+" SHA256 "+parent_source["sha256"]}
        surface["compiledMeshSha256"] = ""
        part["qualification"] += "; explicit fixed-profile target-N artist chart, not measured anatomy or skin-fitted thickness"
        records.append({"part": part["id"], "member": surface["id"], "parentSource": parent_source,
            "originalArtistProfile": profile["artistProfile"], "targetNeutralArtistCondition": condition,
            "file": str(file.relative_to(ROOT)).replace("\\", "/"), "sha256": sha(data),
            "vertices": len(points), "triangles": len(faces), "indexLineagePreserved": True,
            "positiveBoundaryVolumeCubicMetres": float(boundary.volume)})
    if {row["part"] for row in records} != set(PARTS) or assembly["rig"]["nodes"] != original_rig:
        raise ValueError("Ten chart identities or original held rig changed")
    if sum(len(part["surfaces"]) for part in assembly["parts"] if part["id"] not in PARTS) != 281:
        raise ValueError("Every original other281 source member must remain present")
    generation = "registered-neutral-soft-charts-"+sha(encoded({"inputs": inputs, "recipes": recipes, "charts": records}))[:20]
    assembly["generation"] = generation
    assembly["rig"]["generation"] = generation
    assembly["registration"] += "; ten fixed-profile target-N soft charts with pinned material references; unchanged held graph; genuine visceral regeneration pending"
    assembly_data = encoded(assembly)+b"\n"
    (output/"adapted-assembly-before-depot.json").write_bytes(assembly_data)
    receipt = {"generation": generation, "assemblySha256": sha(assembly_data), "inputs": inputs,
        "recipes": recipes, "runtime": {"python": platform.python_version(), "executable": sys.executable,
            "numpy": np.__version__, "trimesh": trimesh.__version__}, "parts": 259, "members": 291,
        "charts": records, "unchangedParts": unchanged, "unchangedShapeFields": fields, "attachmentPorts": ports.receipts,
        "generationMetadataRebound": True,
        "unchangedRig": ports.graph_readback, "pendingVisceralRegeneration": True, "nativeSATSeparate": True,
        "qualification": "NEW explicit target-N artist condition; same existing ports/profiles/topology, no clinical acquisition, skin projection, global injectivity, per-member containment, Float32, quantity, pose or GPU acceptance.",
        "elapsedSeconds": time.perf_counter()-started}
    (output/"authoring-receipt.json").write_text(json.dumps(receipt, indent=2, allow_nan=False)+"\n", encoding="utf-8")
    print(json.dumps({"generation": generation, "parts": 259, "members": 291, "charts": len(records),
                      "output": str(output.relative_to(ROOT)), "elapsedSeconds": receipt["elapsedSeconds"]}), flush=True)


if __name__ == "__main__":
    main()
