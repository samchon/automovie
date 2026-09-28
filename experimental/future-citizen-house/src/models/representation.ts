import {
  IAutoMovieMaterial,
  IAutoMovieMesh,
  IAutoMovieModel,
} from "@automovie/interface";

import { boreCuts, boxWithBore } from "./bore-mesh";
import {
  type Bounds,
  MeshWriter,
  type Vec,
  cross,
  cutBoxes,
  dot,
  miteredBox,
  normalize,
  planarBox,
  sub,
} from "./orthogonal-mesh";
import { cylinder, ellipsoid } from "./round-mesh";
import { authoredSilhouette } from "./silhouette-mesh";
import { groovedMat } from "./textile-mesh";
import { radialShell, vessel } from "./vessel-mesh";

/** Coordinates and part identities are copied from the reviewed @part rows. */
export interface ModelPartRecord {
  id: string;
  shape: "box" | "cylinder" | "curved" | "hollow" | "mitered-box";
  x: [number, number];
  y: [number, number];
  z: [number, number];
}
export interface ModelStateRecord {
  state: string;
  envelope: Bounds;
  parts: ModelPartRecord[];
  voids?: Record<string, Bounds[]>;
  pieces?: Record<string, Bounds[]>;
  radial?: Record<string, [number, number, number, number]>;
  ellipse?: Record<string, [number, number, number, number, number, number]>;
  bores?: Record<string, { axis: string; args: string[] }>;
  profiles?: Record<string, string[]>;
  joins?: Record<string, number[]>;
  apices?: Record<string, number[]>;
  plantSpec?: {
    wallMinimum: number;
    wallFactor: number;
    potBottomRadius: number;
    potTopRadius: number;
    potHeight: number;
    soilSurface: number;
    leafThickness: number;
    [key: string]: unknown;
  };
  compose?: { anchor: string; state: string; offset: [number, number, number] };
}
export interface ModelPrototype {
  anchor: string;
  name: string;
  states: ModelStateRecord[];
}

function plantLeaf(
  w: MeshWriter,
  b: Bounds,
  apex: number[],
  thickness: number,
): void {
  const a: Vec = [apex[0], apex[1], apex[2]];
  // Reviewed leaf AABBs are the finite end wedge extents. The beginning is
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
  const direction = normalize([
    (b.x[0] + b.x[1]) / 2 - a[0],
    0,
    (b.z[0] + b.z[1]) / 2 - a[2],
  ]);
  const tangent: Vec = [-direction[2], 0, direction[0]];
  for (const face of faces) {
    const n = normalize(cross(sub(face[1], face[0]), sub(face[2], face[0])));
    const ids = face.map((p) =>
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
  const w = new MeshWriter();
  const bounds: Bounds = { x: part.x, y: part.y, z: part.z };
  if (state.apices?.[part.id]) {
    if (!state.plantSpec)
      throw Error("plant leaf lacks authored specification");
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
    const voids = [
      ...(state.voids?.[part.id] ?? []),
      ...(state.bores?.[part.id] ? boreCuts(state.bores[part.id], bounds) : []),
    ];
    const pieces = state.pieces?.[part.id] ?? [];
    if (!voids.length && !pieces.length)
      throw Error(
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

/** Builds exactly the selected reviewed state; material ownership stays downstream. */
export class ModelRepresentation {
  static build(
    prototype: ModelPrototype,
    stateName: string,
    materialFor: (
      anchor: string,
      state: string,
      part: string,
    ) => IAutoMovieMaterial,
  ): IAutoMovieModel {
    const state = prototype.states.find((item) => item.state === stateName);
    if (!state) throw Error(`unknown state ${prototype.anchor}/${stateName}`);
    const materials = new Map<string, IAutoMovieMaterial>();
    const parts = state.parts.map((record) => {
      const material = materialFor(prototype.anchor, stateName, record.id);
      if (!material || !material.id)
        throw Error(
          `material missing for ${prototype.anchor}/${stateName}/${record.id}`,
        );
      const previous = materials.get(material.id);
      if (
        previous &&
        previous !== material &&
        JSON.stringify(previous) !== JSON.stringify(material)
      )
        throw Error(`conflicting material ${material.id}`);
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
    // guest sleep remain two fixed results of one reviewed prototype identity.
    const id =
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
