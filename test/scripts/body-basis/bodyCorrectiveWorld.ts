import type { IAutoMovieHumanBodyBasis } from "@automovie/human";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieModel,
  IAutoMovieModelPart,
} from "@automovie/interface";

import { meshOfSegment, neighboursOf } from "./bodyContactGeometry";
import type { IBodySegmented } from "./readBodyContacts";

/**
 * The static tables the corrective solver reads from a body basis: which
 * bone dominates each vertex, the dominant-bone triangle partition into
 * segments, the vertex neighbour graph, each joint's rest pose, parent and
 * bone length.
 *
 * Everything is in the basis vertex order and is independent of the
 * correctives a basis carries, so one world serves every candidate basis of a
 * revision. The partition is the one `segmentHumanBodyModel` measures
 * crossings on: a triangle belongs to the bone that dominates its corners,
 * and a triangle whose second and third corners agree against its first
 * belongs to that agreeing bone. Only the first surface is read, the
 * connected skin.
 */
export interface IBodyCorrectiveWorld {
  surface: IAutoMovieHumanBodyBasis["surfaces"][number];
  vertices: number;
  near: number[][];

  /** Bone of each segment to its corner list, three corners per triangle. */
  segments: Map<string, number[]>;

  /** The bone that dominates a vertex. */
  dominant: (vertex: number) => string;

  /** Rest pose of each joint by bone. */
  neutral: Map<
    AutoMovieHumanoidBone,
    IAutoMovieHumanBodyBasis["joints"][number]["neutral"]
  >;

  /** Head to tail distance of each bone at rest, metres. */
  lengths: Map<AutoMovieHumanoidBone, number>;

  /** Parent of each bone. */
  parents: Map<AutoMovieHumanoidBone, AutoMovieHumanoidBone | null>;
}

/** Read the tables of a basis. Throws when a joint names a missing landmark. */
export function createBodyCorrectiveWorld(
  basis: IAutoMovieHumanBodyBasis,
): IBodyCorrectiveWorld {
  const surface = basis.surfaces[0];
  const vertices = surface.positions.length / 3;
  const landmarkAt = (id: string): number[] => {
    const at = basis.landmarks.ids.indexOf(id);
    if (at < 0) throw new Error("The basis has no landmark " + id);
    return basis.landmarks.positions.slice(at * 3, at * 3 + 3);
  };
  const dominant = (v: number): string => {
    let best = 0;
    for (let k = 1; k < 4; k++)
      if (surface.skin.weights[v * 4 + k] > surface.skin.weights[v * 4 + best])
        best = k;
    return surface.skin.joints[surface.skin.boneIndices[v * 4 + best]];
  };
  const segments = new Map<string, number[]>();
  for (let t = 0; t < surface.indices.length; t += 3) {
    const corners = [
      surface.indices[t],
      surface.indices[t + 1],
      surface.indices[t + 2],
    ];
    const bones = corners.map(dominant);
    const owner =
      bones[1] === bones[2] && bones[0] !== bones[1] ? bones[1] : bones[0];
    const list = segments.get(owner);
    if (list === undefined) segments.set(owner, corners);
    else list.push(...corners);
  }
  return {
    surface,
    vertices,
    near: neighboursOf(surface.indices, vertices),
    segments,
    dominant,
    neutral: new Map(basis.joints.map((joint) => [joint.bone, joint.neutral])),
    lengths: new Map(
      basis.joints.map((joint) => {
        const h = landmarkAt(joint.head);
        const t = landmarkAt(joint.tail);
        return [joint.bone, Math.hypot(t[0] - h[0], t[1] - h[1], t[2] - h[2])];
      }),
    ),
    parents: new Map(basis.joints.map((joint) => [joint.bone, joint.parent])),
  };
}

/**
 * The segments of a body given as bare positions in basis vertex order, the
 * form the solver works in while it pushes: one mesh part per bone segment
 * and the basis vertices each part reads, as `createHumanBodySegmenter`
 * returns for a built body. Only the parts a crossing reading needs are
 * filled in: the model has no materials, skeleton or body.
 */
export function segmentBodyPositions(
  world: IBodyCorrectiveWorld,
  positions: number[],
): IBodySegmented {
  const sources = new Map<string, number[]>();
  const parts: IAutoMovieModelPart[] = [...world.segments].map(
    ([bone, corners]) => {
      sources.set(bone, [...new Set(corners)]);
      return {
        id: bone,
        name: null,
        geometry: { type: "mesh", mesh: meshOfSegment(positions, corners) },
        material: null,
        attachedBone: null,
        transform: null,
      };
    },
  );
  const model: IAutoMovieModel = {
    id: "segmented",
    name: null,
    origin: "imported",
    parts,
    skeleton: null,
    body: null,
    materials: [],
    asset: null,
  };
  return { model, sources };
}
