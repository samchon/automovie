import { IAutoMovieVector3 } from "@automovie/interface";

/**
 * One inspection-owned cutting plane: the half-space a section view removes.
 *
 * A building is authored from cutaway drawings and then cannot be looked at the
 * way it was drawn. Standing outside hides the interior, standing inside shows
 * one room, and deleting a wall to look past it edits the production instead of
 * reviewing it. A section plane leaves the scene exactly as compiled and lets
 * the observer remove a half-space of it.
 *
 * It is not a field of an authored camera. A shot is judged on the image it
 * delivers, so an observation made after a wall was removed is a diagram about
 * the production rather than evidence about that image; `IAutoMovieCamera`
 * states the exclusion and the condition that reopens it.
 * `autoMovieSectionPlaneDistance`, `autoMovieSectionPlanesKeepPoint` and
 * `classifyAutoMovieSectionPlaneBox` evaluate it, and the viewer's
 * `applyAutoMovieSectionPlanes` hands the same plane to `three.js` clipping.
 *
 * @evidence contracts/common.md#principled-implementation A plane in point-normal form defines the half-space `n·(p − p0) > 0` as removed; the engine readers normalize the normal on use, keep the boundary itself, and refuse a zero or non-finite normal or a non-finite point, while the viewer negates the normal because `three.js` keeps the side its normal points at and also keeps distance zero, so engine and renderer agree on one closed kept side.
 * @evidence contracts/common.md#clear-and-simple-design A point and a normal rather than a signed offset, because an authoring agent reaches a cut through geometry it already has, such as a floor level, a room's content bounds or a wall's face, and can name a point on it and the side to discard without solving for an offset it never measured.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The plane lives beside the frustum tests instead of in the scene, so delivery acceptance never depends on it, and a degenerate plane throws rather than silently meaning keep everything or remove everything.
 * @evidence contracts/common.md#meaningful-documentation States why the type exists, why it is not a camera field, its evaluators and the viewer adapter, why it is spelled point-normal, and for each field its space, its units, the side the normal names and the normalization and refusal rules.
 * @evidenceExclude contracts/performance.md#efficient-algorithms A data shape with no runtime body; evaluating it is constant work per point answered on `autoMovieSectionPlaneDistance`.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Declared by the inspecting caller and read in place; nothing derived from it is cached in the engine, and the viewer rebuilds its runtime planes on every apply.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Two caller-owned vectors; the evaluators read them during the call and retain nothing.
 */
export interface IAutoMovieSectionPlane {
  /** A point the plane passes through, in world space, metres; finite. */
  point: IAutoMovieVector3;

  /**
   * Direction of the half-space that is removed. It need not be unit length,
   * because it is normalized on use, but it must be finite and non-zero: such a
   * vector names no half-space, so it is refused rather than read as "keep
   * everything".
   */
  normal: IAutoMovieVector3;
}
