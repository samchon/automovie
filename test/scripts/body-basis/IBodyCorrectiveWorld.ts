import type { IAutoMovieHumanBodyBasis } from "@automovie/human/body/structures/IAutoMovieHumanBodyBasis";
import type { AutoMovieHumanoidBone } from "@automovie/interface";

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
