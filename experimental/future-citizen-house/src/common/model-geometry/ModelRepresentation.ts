import { IAutoMovieMaterial, IAutoMovieMesh, IAutoMovieModel } from "@automovie/interface";
import { boreCuts, boxWithBore } from "./bore-mesh";
import { type Bounds, MeshWriter, type Vec, cross, cutBoxes, dot, miteredBox, normalize, planarBox, sub } from "./orthogonal-mesh";
import { cylinder, ellipsoid } from "./round-mesh";
import { authoredSilhouette } from "./silhouette-mesh";
import { groovedMat } from "./textile-mesh";
import { radialShell, vessel } from "./vessel-mesh";
import type { ModelPartRecord } from "./ModelPartRecord";
import type { ModelStateRecord } from "./ModelStateRecord";
import type { ModelPrototype } from "./ModelPrototype";



function plantLeaf(
  w: MeshWriter,
  b: Bounds,
  apex: number[],
  thickness: number,
): void {
  const a: Vec = [apex[0], apex[1], apex[2]];
  // Authored leaf AABBs are the finite end wedge extents. The beginning is
  // its single @plant-apex; the four remaining vertices form its end edge.
  const end: Vec[] = [
    [b.x[0], b.y[1], b.z[0]],
    [b.x[1], b.y[1], b.z[0]],
    [b.x[0], b.y[1] - thickness, b.z[1]],
    [b.x[1], b.y[1] - thickness, b.z[1]],
  ];
  const faces: [Vec, Vec, Vec][] = [
    [a, end[0], end[1]],
    [a, end[1], end[3]],
    [a, end[3], end[2]],
    [a, end[2], end[0]],
    [end[0], end[2], end[3]],
    [end[0], end[3], end[1]],
  ];
  const direction: Vec = normalize([
    (b.x[0] + b.x[1]) / 2 - a[0],
    0,
    (b.z[0] + b.z[1]) / 2 - a[2],
  ]);
  const tangent: Vec = [-direction[2], 0, direction[0]];
  for (const face of faces) {
    const n: Vec = normalize(cross(sub(face[1], face[0]), sub(face[2], face[0])));
    const ids: number[] = face.map((p: Vec) : number =>
      w.vertex(p, n, [dot(sub(p, a), tangent), Math.hypot(...sub(p, a))]),
    );
    w.triangle(ids[0], ids[1], ids[2]);
  }
}


function buildPart(
  part: ModelPartRecord,
  state: ModelStateRecord,
  anchor: string,
): IAutoMovieMesh {
  const w: MeshWriter = new MeshWriter();
  const bounds: Bounds = { x: part.x, y: part.y, z: part.z };
  if (state.apices?.[part.id]) {
    if (!state.plantSpec)
      throw new Error("plant leaf lacks authored specification");
    plantLeaf(
      w,
      bounds,
      state.apices[part.id],
      (state.plantSpec.leafThickness * Number(state.state)) / 1000,
    );
  } else if (part.shape === "hollow" && vessel(w, bounds, state, part)) {
    /* authored cavity */
  } else if (state.radial?.[part.id] && state.radial[part.id][2] > 0)
    radialShell(w, bounds, state.radial[part.id]);
  else if (
    part.shape === "hollow" &&
    state.bores?.[part.id] &&
    !state.voids?.[part.id] &&
    !state.pieces?.[part.id] &&
    state.bores[part.id].axis !== "-y" &&
    boxWithBore(w, bounds, state.bores[part.id])
  ) {
    /* circular host bore */
  } else if (
    part.shape === "hollow" ||
    (part.shape === "box" && (state.voids?.[part.id]?.length ?? 0) > 0)
  ) {
    const voids: Bounds[] = [
      ...(state.voids?.[part.id] ?? []),
      ...(state.bores?.[part.id] ? boreCuts(state.bores[part.id], bounds) : []),
    ];
    const pieces: Bounds[] = state.pieces?.[part.id] ?? [];
    if (!voids.length && !pieces.length)
      throw new Error(
        `hollow part without authored cavity: ${state.state}/${part.id}`,
      );
    cutBoxes(w, bounds, pieces, voids);
  } else if (
    part.shape === "box" &&
    anchor === "household-textiles" &&
    state.state === "outdoor-mat"
  )
    groovedMat(w, bounds);
  else if (part.shape === "cylinder") cylinder(w, bounds);
  else if (part.shape === "mitered-box") miteredBox(w, bounds);
  else if (state.pieces?.[part.id])
    cutBoxes(w, bounds, state.pieces[part.id], []);
  else if (part.shape === "curved") {
    if (!authoredSilhouette(w, bounds, anchor, state.state, part.id))
      ellipsoid(w, bounds);
  } else planarBox(w, bounds);
  return w.finish();
}
/**
 * Assemble one selected draft prototype state with caller-owned materials.
 *
 * Each build uses the first exact state token, emits its part records in order and calls the material resolver once per part. Missing states or material IDs, conflicting JSON material descriptions and geometry errors throw. Composition, envelope and join records are not assembled into the returned model; finite positive dimensions and valid recipe tokens remain input premises.
 *
 * The outdoor-mat recipe and cabinet, murphy-bed and flex-desk identities are authored production-content cases. Curved parts can fall back to ellipsoids, so this draft assembly does not establish complete designed silhouettes, contacts or room placements.
 *
 * State lookup is linear. Every part pays fresh geometry construction, material callback effects and any JSON conflict comparison; a per-build map collapses material IDs while retaining the last equivalent callback record. Catalog inputs persist in their owning modules. Output arrays and meshes belong to the build caller, with no native handles or tasks acquired.
 */
export class ModelRepresentation {
  /**
 * Build fresh meshes for the first matching state, resolving materialFor(anchor, stateName, partId) once for each ordered part.
 *
 * The returned materials retain callback object references. Repeated IDs admit the same object or equal JSON serialization; this is order-sensitive serialization equality rather than semantic material equality, and serialization errors propagate. All parts have null attachment and transform, and the model has no asset, skeleton or body. Unknown states, missing material IDs and recipe failures throw without returning a partial model.
 *
 * Cabinet states use cabinet/state IDs, murphy-bed states share murphy-bed, and folded/open desks share work-desk/flex; other models use anchor/state. Catalog records are reused, but callback effects and fresh mutable mesh output prevent cross-call caching. Local maps end on return or throw; returned meshes and material references remain caller-owned.
 */
static build(
    prototype: ModelPrototype,
    stateName: string,
    materialFor: (
      anchor: string,
      state: string,
      part: string,
    ) => IAutoMovieMaterial,
  ): IAutoMovieModel {
    const state: ModelStateRecord | undefined = prototype.states.find((item: ModelStateRecord) : boolean => item.state === stateName);
    if (!state) throw new Error(`unknown state ${prototype.anchor}/${stateName}`);
    const materials: Map<string, IAutoMovieMaterial> = new Map<string, IAutoMovieMaterial>();
    const parts: { id: string; name: string; geometry: { type: "mesh"; mesh: IAutoMovieMesh; }; material: string; attachedBone: null; transform: null; }[] = state.parts.map((record: ModelPartRecord) : { id: string; name: string; geometry: { type: "mesh"; mesh: IAutoMovieMesh; }; material: string; attachedBone: null; transform: null; } => {
      const material: IAutoMovieMaterial = materialFor(prototype.anchor, stateName, record.id);
      if (!material || !material.id)
        throw new Error(
          `material missing for ${prototype.anchor}/${stateName}/${record.id}`,
        );
      const previous: IAutoMovieMaterial | undefined = materials.get(material.id);
      if (
        previous &&
        previous !== material &&
        JSON.stringify(previous) !== JSON.stringify(material)
      )
        throw new Error(`conflicting material ${material.id}`);
      materials.set(material.id, material);
      return {
        id: record.id,
        name: record.id,
        geometry: {
          type: "mesh" as const,
          mesh: buildPart(record, state, prototype.anchor),
        },
        material: material.id,
        attachedBone: null,
        transform: null,
      };
    });
    // Cabinet is explicitly named by its shape/mm/state token. Flex work and
    // guest sleep remain two fixed results of one authored prototype identity.
    const id: string =
      prototype.anchor === "cabinet-and-shelf"
        ? `cabinet/${stateName}`
        : prototype.anchor === "murphy-bed"
          ? "murphy-bed"
          : prototype.anchor === "work-desk" &&
              (stateName === "folded" || stateName === "open")
            ? "work-desk/flex"
            : `${prototype.anchor}/${stateName}`;
    return {
      id,
      name: prototype.name,
      origin: "generated",
      parts,
      materials: [...materials.values()],
      asset: null,
      skeleton: null,
      body: null,
    };
  }
}
