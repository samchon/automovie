import type { AutoMovieHumanoidBone } from "../skeleton/AutoMovieHumanoidBone";

/**
 * Per-vertex skeletal binding: which bones influence each vertex and by how
 * much. Drives mesh deformation when the skeleton poses.
 *
 * Both arrays are grouped in fours per vertex (glTF's 4-influences-per-vertex
 * convention): vertex `i` is influenced by `boneIndices[4i .. 4i+3]` with
 * normalized `weights[4i .. 4i+3]`.
 *
 * The joints' transforms blend by `method`. Every bone transform is rigid,
 * because rig rest scale is ignored by convention, so both methods receive
 * rotations and translations only.
 */
export interface IAutoMovieMeshSkin {
  /** The bones any vertex may be bound to (the skin's joint set). */
  joints: AutoMovieHumanoidBone[];

  /** Per-vertex bone indices into `joints`, grouped in fours. */
  boneIndices: number[];

  /**
   * Finite per-vertex weights in `[0,1]`, grouped in fours. Admission accepts
   * absolute sum error at most 1e-6 from one; viewer construction subsequently
   * normalizes its skin buffer.
   */
  weights: number[];

  /**
   * How a vertex blends its joints' transforms; omission means `"linear"`.
   *
   * `"linear"` sums the weighted joint matrices. The sum is not rigid, so a
   * strongly bent joint collapses and a twisted one pinches.
   * `"dual-quaternion"` sums the weighted unit dual quaternions, each aligned
   * to the hemisphere of the vertex's largest-weight joint, and normalizes the
   * result into one rigid transform per vertex, which keeps the volume but
   * bulges slightly on the outside of a bent joint and flips once two
   * influences differ by more than 180 degrees.
   *
   * `skinAutoMovieMesh` in `@automovie/engine` evaluates the same formula the
   * viewer's shader draws. A dual quaternion skin needs its part transform to
   * scale uniformly, because a non-uniform scale makes the blended transform
   * non-rigid; admission refuses that combination.
   */
  method?: "linear" | "dual-quaternion";
}
