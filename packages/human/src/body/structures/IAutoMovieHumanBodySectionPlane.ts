import type { IAutoMovieVector3 } from "@automovie/interface";

/**
 * A cutting plane for one body section measurement.
 *
 * The plane passes through `point` with normal `normal`. A vertex whose
 * signed distance is zero counts as the positive side, so every crossing is an
 * interior point of its edge.
 *
 * @evidence contracts/common.md#principled-implementation The signed distance to one point-normal plane decides each vertex's side, with on-plane vertices assigned to the positive side.
 * @evidence contracts/common.md#clear-and-simple-design One named record replaces the section instrument's anonymous plane type.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The caller chooses the plane; the instrument holds no anatomy.
 * @evidence contracts/common.md#meaningful-documentation States the plane definition, units and the on-plane rule.
 * @evidence contracts/modeling.md#spatial-conventions The point is metres and the normal a direction in the body's Y-up, Z-forward frame.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping A plane defines no part.
 * @evidenceExclude contracts/modeling.md#parameter-channels A plane is not a shaping channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry A plane emits no geometry.
 * @evidenceExclude contracts/modeling.md#shared-boundaries A plane builds no boundary.
 * @evidenceExclude contracts/modeling.md#rendered-observation The measurement reader observes the section.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The measurement rule that places the plane carries the source.
 * @evidenceExclude contracts/anatomy.md#permitted-range A plane bounds no value.
 * @evidenceExclude contracts/anatomy.md#parametric-authority A plane is not a person-authoring input.
 * @author Samchon
 */
export interface IAutoMovieHumanBodySectionPlane {
  /** A point the plane passes through, in metres. */
  point: IAutoMovieVector3;

  /** Plane normal; its positive side includes on-plane vertices. */
  normal: IAutoMovieVector3;
}
