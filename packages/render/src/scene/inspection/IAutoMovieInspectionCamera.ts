import type { IAutoMovieVector3 } from "@automovie/interface";

/**
 * The camera an inspection view resolved to, as a record keeps it so a later round draws through the same camera.
 *
 * @evidence contracts/development/design.md#principled-representation A camera is its eye, the point it looks at, its up direction in world metres and its projection; a perspective camera adds its vertical field of view in degrees and an orthographic one its scale in metres per pixel, and the member the other projection does not have is null. Clip distances are in metres from the eye.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Produced by `resolveAutoMovieInspectionView` and stored by every host's capture record; `view` is the text that asked for it, so the record says both what was asked and what it became.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The record holds numbers and text only, not a three.js camera, so it can be written and compared; that the null member matches the projection is kept by its producer.
 * @evidence contracts/development/common.md#meaningful-documentation States what each member is with its unit and frame, and which member is null under which projection.
 */
export interface IAutoMovieInspectionCamera {
  /** The view text that resolved to this camera, such as `front@ortho` or `film`. */
  view: string;

  /** Which projection draws the picture. */
  projection: "perspective" | "orthographic";

  /** Eye, world metres. */
  position: IAutoMovieVector3;

  /** Point looked at, world metres. */
  target: IAutoMovieVector3;

  /** Up direction of the picture, a world unit vector. */
  up: IAutoMovieVector3;

  /** Vertical field of view in degrees for a perspective camera, null for an orthographic one. */
  fovDeg: number | null;

  /** Metres of world one picture pixel spans for an orthographic camera, null for a perspective one. */
  metresPerPixel: number | null;

  /** Near clip distance, metres. */
  near: number;

  /** Far clip distance, metres. */
  far: number;
}
