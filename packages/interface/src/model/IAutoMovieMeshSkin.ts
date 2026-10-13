import { AutoMovieHumanoidBone } from "../skeleton/AutoMovieHumanoidBone";

/**
 * Per-vertex skeletal binding: which bones influence each vertex and by how much. Drives mesh deformation when the skeleton poses.
 *
 * Both arrays are grouped in fours per vertex (glTF's 4-influences-per-vertex convention): vertex `i` is influenced by `boneIndices[4i .. 4i+3]` with normalized `weights[4i .. 4i+3]`.
 *
 * @evidence contracts/common.md#principled-implementation Four joint indices and four nonnegative normalized weights per render vertex encode linear blend skinning; mesh validation resolves the joint palette against the model skeleton and requires each index and weight group to be valid.
 * @evidence contracts/common.md#clear-and-simple-design A local joint palette separates skeleton bone names from compact per-vertex indices, while weights align with the mesh's position order instead of copying positions into the skin record.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No bone name is guessed from imported vertex order; each stored index must address the declared joint palette, and missing or unnormalized influence groups are validation findings.
 * @evidence contracts/common.md#meaningful-documentation Gives the four-influence grouping, correct boneIndices field name, palette lookup and unit-interval weights summing to one per vertex.
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
