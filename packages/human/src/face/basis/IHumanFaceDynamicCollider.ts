import type { IAutoMovieMesh } from "@automovie/interface";

/**
 * One generated collider's common rest and performed exterior.
 * The contact owner's existing source collider retains its reach and cover.
 *
 * @evidence contracts/common.md#principled-implementation Both query states carry complete generated incidence rather than substituting resident vertex indices.
 * @evidence contracts/common.md#clear-and-simple-design Two meshes describe the same exterior before and after the owner's rigid motion.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Carries no replacement budget, tolerance or clinical clearance.
 * @evidence contracts/common.md#meaningful-documentation States query-state identity and policy ownership.
 * @evidence contracts/modeling.md#spatial-conventions Both meshes are head-frame metres.
 * @evidenceExclude contracts/anatomy.md#anatomical-source Geometry transport, without a measured value.
 * @evidenceExclude contracts/anatomy.md#permitted-range The contact owner admits the supplied geometry.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Defines no shaping input.
 *
 * @author Samchon
 */
export interface IHumanFaceDynamicCollider {
  /** Exact generated part identity for query diagnostics; absent on legacy callers. */
  id?: string;

  /** Producer-owned physical identity of every query point, when its assembly supplies one. */
  pointIds?: readonly string[];

  /** Generated source-frame exterior without gaze. */
  rest: IAutoMovieMesh;

  /** The identical exterior with the existing eye owner's gaze. */
  posed: IAutoMovieMesh;
}
