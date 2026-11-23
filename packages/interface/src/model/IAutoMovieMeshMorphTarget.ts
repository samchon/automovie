import type { IAutoMovieMorphTargetDriver } from "./IAutoMovieMorphTargetDriver";

/**
 * One morph target of a mesh: per-vertex displacements added to the rest
 * geometry in proportion to the target's weight, before skinning (the glTF
 * morph target model with relative deltas).
 *
 * The weight comes from an expression, which writes it by name, or from
 * `driver`, which follows the pose. A mesh's deformed position is `p + sum(w_t
 * * positions_t)` and its normal `n + sum(w_t * normals_t)`, then skinned.
 */
export interface IAutoMovieMeshMorphTarget {
  /**
   * Nonempty name, unique within the mesh. Expressions write ARKit channel and
   * preset names, matching exactly first and then ignoring case.
   */
  name: string;

  /**
   * Flat position deltas `[dx,dy,dz,...]` in metres, one triple per mesh
   * vertex, in the mesh's own frame.
   */
  positions: number[];

  /**
   * Flat normal deltas `[dx,dy,dz,...]`, one triple per mesh vertex, or `null`
   * to leave normals unchanged by this target.
   */
  normals: number[] | null;

  /**
   * Pose-driven weight; `null` or omission leaves the weight to expressions. A
   * driven target cannot share its name with an expression preset or ARKit
   * channel, ignoring case, because the viewer writes those names from the
   * expression after the pose.
   */
  driver?: IAutoMovieMorphTargetDriver | null;
}
