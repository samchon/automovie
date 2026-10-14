import { AutoMovieHumanoidBone } from "../skeleton/AutoMovieHumanoidBone";

/**
 * Per-vertex skeletal binding: which bones influence each vertex and by how much. Drives mesh deformation when the skeleton poses.
 *
 * Both arrays are grouped in fours per vertex (glTF's 4-influences-per-vertex convention): vertex `i` is influenced by `boneIndices[4i .. 4i+3]` with normalized `weights[4i .. 4i+3]`.
 *
 * @evidence contracts/common.md#principled-implementation Four joint indices and unit-interval weights per render vertex encode linear blend skinning. Mesh admission resolves a unique joint palette and every index, including zero-weight indices, and accepts finite weight sums within 1e-6 of one; the viewer normalizes its constructed skin weights.
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
   * Finite per-vertex weights in `[0,1]`, grouped in fours. Admission accepts absolute sum error at most 1e-6 from one; viewer construction subsequently normalizes its skin buffer.
   */
  weights: number[];
}
