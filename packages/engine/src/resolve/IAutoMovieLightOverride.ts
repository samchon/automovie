import {
  IAutoMovieColor,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

/**
 * The animatable property values accumulated for one light before they are
 * folded back onto it. Absent fields retain their staged values. The shot
 * resolver bypasses rebuilding entirely when no sampled channel creates an
 * override; direct applyLightOverride calls still return a new light record.
 *
 *
 * @evidence contracts/development/design.md#principled-representation Accumulate only authored light-property samples; absent members preserve staged values and rotation/position remain separate from light-kind-specific scalar properties.
 * @evidence contracts/development/design.md#minimal-and-owned-surface A sparse intermediate record separates channel sampling from the exhaustive light reconstruction in applyLightOverride.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No zero or identity value is invented for absent animation; range/cone fields cannot create those fields on unsupported light kinds.
 * @evidence contracts/development/common.md#meaningful-documentation Members state intensity/color, metre range/position, degree cone angle and world orientation; direct reconstruction and untouched-shot identity are distinguished.
 */
export interface IAutoMovieLightOverride {
  /** Radiant intensity, when an `intensity` track wrote one. */
  intensity?: number;

  /** Linear colour, when a `color` track wrote one. */
  color?: IAutoMovieColor;

  /** Falloff range in metres, when a `range` track wrote one. */
  range?: number;

  /** Cone half-angle in degrees, when a `coneAngle` track wrote one. */
  coneAngle?: number;

  /** World translation in metres, when a `position` track wrote one. */
  position?: IAutoMovieVector3;

  /** World orientation, when a `rotation` track wrote one. */
  rotation?: IAutoMovieQuaternion;
}
