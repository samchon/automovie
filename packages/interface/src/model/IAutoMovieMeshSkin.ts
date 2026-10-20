import { AutoMovieHumanoidBone } from "../skeleton/AutoMovieHumanoidBone";

/**
 * Per-vertex skeletal binding: which bones influence each vertex and by how much. Drives mesh deformation when the skeleton poses.
 *
 * Both arrays are grouped in fours per vertex (glTF's 4-influences-per-vertex convention): vertex `i` is influenced by `boneIndices[4i .. 4i+3]` with normalized `weights[4i .. 4i+3]`.
 *
 * The joints' transforms blend by `method`. Every bone transform is rigid, because rig rest scale is ignored by convention, so both methods receive rotations and translations only.
 *
 * @evidence contracts/common.md#principled-implementation Four joint indices and unit-interval weights per render vertex feed linear blend skinning or dual quaternion skinning (Kavan et al. 2008), chosen by `method`. Mesh admission resolves a unique joint palette and every index, including zero-weight indices, accepts finite weight sums within 1e-6 of one and admits only the two method names; the viewer normalizes its constructed skin weights.
 * @evidence contracts/common.md#clear-and-simple-design A local joint palette separates skeleton bone names from compact per-vertex indices, while weights align with the mesh's position order instead of copying positions into the skin record; the blend is one optional closed union on the same record because it changes how these inputs combine, not what they are.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No bone name is guessed from imported vertex order; each stored index must address the declared joint palette, and missing or unnormalized influence groups are validation findings.
 * @evidence contracts/common.md#meaningful-documentation Gives the four-influence grouping, correct boneIndices field name, palette lookup and unit-interval weights summing to one per vertex, and each method's behaviour, default and part-scale premise.
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

  /**
   * How a vertex blends its joints' transforms; omission means `"linear"`.
   *
   * `"linear"` sums the weighted joint matrices. The sum is not rigid, so a strongly bent joint collapses and a twisted one pinches. `"dual-quaternion"` sums the weighted unit dual quaternions, each aligned to the hemisphere of the vertex's largest-weight joint, and normalizes the result into one rigid transform per vertex, which keeps the volume but bulges slightly on the outside of a bent joint and flips once two influences differ by more than 180 degrees.
   *
   * `skinAutoMovieMesh` in `@automovie/engine` evaluates the same formula the viewer's shader draws. A dual quaternion skin needs its part transform to scale uniformly, because a non-uniform scale makes the blended transform non-rigid; admission refuses that combination.
   */
  method?: "linear" | "dual-quaternion";
}
