import { type IAutoMovieLight, type IAutoMovieStageLight, type IAutoMovieCameraClearanceEnvelope, type IAutoMovieStageSetPiece, type IAutoMovieVector3, type IAutoMovieTransform, type IAutoMovieViolationCollector, type IAutoMovieCameraDepthPrecisionConstraint, type IAutoMovieFog } from "@automovie/interface";
import { lightTypeOf as lightTypeOfImplementation } from "./staging/internal/lightTypeOf";
import { lowerCameraClearanceEnvelope as lowerCameraClearanceEnvelopeImplementation } from "./staging/internal/lowerCameraClearanceEnvelope";
import { lowerLightPlacement as lowerLightPlacementImplementation } from "./staging/internal/lowerLightPlacement";
import { setPieceMatrix as setPieceMatrixImplementation } from "./staging/internal/setPieceMatrix";
import { setPieceScale as setPieceScaleImplementation } from "./staging/internal/setPieceScale";
import { setPieceTransform as setPieceTransformImplementation } from "./staging/internal/setPieceTransform";
import { validateCameraClearanceEnvelope as validateCameraClearanceEnvelopeImplementation } from "./staging/internal/validateCameraClearanceEnvelope";
import { validateCameraDepthPrecision as validateCameraDepthPrecisionImplementation } from "./staging/internal/validateCameraDepthPrecision";
import { validateFogPlacement as validateFogPlacementImplementation } from "./staging/internal/validateFogPlacement";
import { validateLightPlacementShape as validateLightPlacementShapeImplementation } from "./staging/internal/validateLightPlacementShape";

/** Public operations for Auto Movie Engine Staging. */
export namespace AutoMovieEngineStaging {
  /**
   * A light placement's kind: its declared `type`, or `"directional"`, the
   * sun-like parallel source, when it is omitted.
   *
   * @param light The staging light placement.
   * @returns The declared kind or the directional default.
   */
  export function lightTypeOf(light: IAutoMovieStageLight): IAutoMovieLight["type"] {
    return lightTypeOfImplementation(light);
  }

  /**
   * Copy an accepted camera-clearance envelope onto the resolved scene camera.
   *
   * The body sphere and the optional parent-rig sphere keep their centres in
   * metres and radii in metres; `null` stays `null`. The copy is deep, so a
   * caller that later mutates the staging write cannot change the composed scene.
   * Precondition: `validateCameraClearanceEnvelope` accepted it.
   *
   * @param envelope The validated staging envelope.
   * @returns A fresh envelope with the same spheres.
   */
  export function lowerCameraClearanceEnvelope(envelope: IAutoMovieCameraClearanceEnvelope): IAutoMovieCameraClearanceEnvelope {
    return lowerCameraClearanceEnvelopeImplementation(envelope);
  }

  /**
   * Lower one accepted light placement into the scene light it describes.
   *
   * The node transform translates to `position`, or the origin for a light
   * without one, and turns by the shortest-arc rotation that puts local `-Z` on
   * `direction`, or the identity for a light without one, such as a point light,
   * which radiates every way. An omitted color is neutral white with `a: null`,
   * the light-slot convention {@link IAutoMovieColor} documents. `castShadow` and
   * `shadow` are copied when present. A point or spot light's omitted `range`
   * becomes `0`, which the light model reads as unlimited range, and a spot's
   * omitted `coneAngle` becomes 45 degrees. An area light takes the `width` and
   * `height` the placement must state: a panel has no default size, because an
   * unstated width is an author who has not decided how big the window is.
   *
   * Precondition: `validateLightPlacementShape` accepted the placement, so its
   * type is supported, an aimed light has a direction, and an area light has both
   * extents. The vectors, color and shadow are the placement's own objects.
   *
   * @param light The accepted staging light placement.
   * @returns The scene light of the placement's kind.
   */
  export function lowerLightPlacement(light: IAutoMovieStageLight): IAutoMovieLight {
    return lowerLightPlacementImplementation(light);
  }

  /**
   * The column-major world matrix one staged set piece is drawn under.
   *
   * It composes {@link setPieceTransform}, the transform `stageScene` lowers a set
   * piece onto: translation `position`, rotation `rotation` when given and
   * otherwise a turn of `facingDeg` degrees about world +Y, `0` when that is
   * omitted too, and {@link setPieceScale}'s scale. Composed as `T · R · S` the
   * way the renderer composes it, a prop's declared boxes measured under it land
   * where the prop is drawn.
   *
   * @param piece The staged set piece.
   * @returns A new sixteen-number matrix, column-major.
   */
  export function setPieceMatrix(piece: IAutoMovieStageSetPiece): number[] {
    return setPieceMatrixImplementation(piece);
  }

  /**
   * A set piece's optional size multiplier as the node transform's scale.
   *
   * Omitted keeps the model's authored size, a number scales uniformly, and a
   * vector scales per axis and is returned as given. One forged primitive can
   * therefore stand in for a wall, a step and a table top, the same box at three
   * sizes. The result is not validated here: `stageScene` refuses a non-finite or
   * non-positive axis.
   *
   * @param scale The authored multiplier, or `undefined`.
   * @returns The per-axis scale.
   */
  export function setPieceScale(scale: number | IAutoMovieVector3 | undefined): IAutoMovieVector3 {
    return setPieceScaleImplementation(scale);
  }

  /**
   * The world transform a staged set piece's node carries.
   *
   * Translation is `position`. Rotation is the authored unit `rotation` when
   * present, else a turn of `facingDeg` degrees about world up, `0` facing `+Z`
   * when that is omitted too. Scale is {@link setPieceScale}'s reading of the
   * optional size multiplier. `stageScene` refuses a piece that states both
   * `rotation` and `facingDeg`, so the precedence only decides input that reaches
   * this helper unvalidated.
   *
   * @param piece The staged set piece.
   * @returns A transform that shares `position`, an authored `rotation` and a
   *   vector `scale` with the piece rather than copying them.
   */
  export function setPieceTransform(piece: IAutoMovieStageSetPiece): IAutoMovieTransform {
    return setPieceTransformImplementation(piece);
  }

  /**
   * Validate one camera-clearance envelope before it reaches the resolved scene.
   *
   * The `body` sphere and a non-null `parentRig` sphere each need a `radius`
   * greater than zero, in metres. Violations go to `out` at `<path>.body.radius`
   * and `<path>.parentRig.radius`.
   *
   * @param value The authored envelope.
   * @param path Violation path of the envelope.
   * @param out Collector the violations are appended to.
   */
  export function validateCameraClearanceEnvelope(value: IAutoMovieCameraClearanceEnvelope, path: string, out: IAutoMovieViolationCollector): void {
    validateCameraClearanceEnvelopeImplementation(value, path, out);
  }

  /**
   * Validate a staged camera's depth-precision requirement before it reaches the
   * resolved scene.
   *
   * `minimumDepthBits` must be a positive integer small enough that `2^bits - 1`,
   * the largest zero-based depth code, is a safe integer, so at most 53, and
   * `maximumStepMeters`, the largest accepted gap between adjacent representable
   * depths, must be greater than zero. Violations go to `out` at
   * `<path>.minimumDepthBits` and `<path>.maximumStepMeters`.
   *
   * @param value The authored requirement.
   * @param path Violation path of the requirement.
   * @param out Collector the violations are appended to.
   */
  export function validateCameraDepthPrecision(value: IAutoMovieCameraDepthPrecisionConstraint, path: string, out: IAutoMovieViolationCollector): void {
    validateCameraDepthPrecisionImplementation(value, path, out);
  }

  /**
   * Validate the staged atmosphere, the only check a fog gets before `stageScene`
   * lowers it verbatim into the scene and the renderer's fog law reads it.
   *
   * {@link IAutoMovieFog} carries two facts and both are checked: an extinction
   * density, per metre, that must be at least zero, since a negative one has no
   * extinction meaning; and a canonical linear color with nullable alpha and a matching
   * optional sRGB label, checked by validateColor. Density has no upper bound: a
   * dense fog is a look, not a mistake. Violations go to `out` at
   * `<path>.density`, `<path>.color` and `<path>.color.<channel>`.
   *
   * @param fog The authored fog.
   * @param path Violation path of the fog.
   * @param out Collector the violations are appended to.
   */
  export function validateFogPlacement(fog: IAutoMovieFog, path: string, out: IAutoMovieViolationCollector): void {
    validateFogPlacementImplementation(fog, path, out);
  }

  /**
   * The staging light contract, per kind: each placement takes exactly the
   * parameters its `type` can act on, so `stageScene` can lower it to the scene
   * light that kind names without guessing.
   *
   * - Every light has nonnegative intensity.
   * - An aimed light (`directional`, `spot`, `area`) needs a finite non-zero
   *   `direction`, and a `point` light must not carry one, since it radiates
   *   every way.
   * - A positioned light (`point`, `spot`, `area`) needs a finite `position`, and a
   *   `directional` light must not carry one, since it is infinitely distant.
   * - `range` belongs to the two punctual falloff kinds and must be finite and at
   *   least zero; `coneAngle` belongs to `spot` alone, within `(0, 90]`; `width`
   *   and `height` belong to `area` alone and must be positive, and both are
   *   reported when both are wrong.
   * - `color`, when given, follows validateColor's canonical linear RGBA rule,
   *   including nullable alpha and an optional matching sRGB hex label.
   * - `castShadow` is refused on an `area` light, which renders no shadow map, and
   *   when `true` requires `shadow`; `shadow` requires `castShadow: true` and
   *   carries a positive safe-integer `mapSize`, a positive `near` and a `far`
   *   beyond it.
   *
   * A parameter that cannot act is refused rather than ignored, because silently
   * dropping a `coneAngle` on a point light stages a light that is not the one
   * authored.
   */
  export function validateLightPlacementShape(light: IAutoMovieStageLight, path: string, out: IAutoMovieViolationCollector): void {
    validateLightPlacementShapeImplementation(light, path, out);
  }
}
