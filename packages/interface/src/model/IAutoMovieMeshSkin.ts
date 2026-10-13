import { AutoMovieHumanoidBone } from "../skeleton/AutoMovieHumanoidBone";

/**
 * Per-vertex skeletal binding: which bones influence each vertex and by how
 * much. Drives mesh deformation when the skeleton poses.
 *
 * Both arrays are grouped in fours per vertex (glTF's 4-influences-per-vertex
 * convention): vertex `i` is influenced by `bones[4i .. 4i+3]` with normalized
 * `weights[4i .. 4i+3]`.
 *
 * @author Samchon
 */
export interface IAutoMovieMeshSkin {
  /** The bones any vertex may be bound to (the skin's joint set). */
  joints: AutoMovieHumanoidBone[];

  /** Per-vertex bone indices into `joints`, grouped in fours. */
  boneIndices: number[];

  /**
   * Per-vertex influence weights in `[0,1]`, grouped in fours, summing to 1.
   */
  weights: number[];
}
