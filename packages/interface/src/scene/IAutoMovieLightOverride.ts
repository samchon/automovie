import type { IAutoMovieColor } from "../color/IAutoMovieColor";
import type { IAutoMovieQuaternion } from "../geometry/IAutoMovieQuaternion";
import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/**
 * The animatable property values accumulated for one light before they are
 * folded back onto it. Absent fields retain their staged values. The shot
 * resolver bypasses rebuilding entirely when no sampled channel creates an
 * override; direct applyLightOverride calls still return a new light record.
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
