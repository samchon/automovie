import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/**
 * Visibility evidence for one explicitly required subject in one delivered frame.
 *
 * @evidence contracts/development/design.md#principled-representation Frustum
 * exclusion, finite ray witnesses, and matching delivery pixel counts describe
 * different observations and have distinct result states.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The source
 * owns when a subject is required. The frame reporter owns subject identity and
 * time. Classification only needs framing and optional occlusion observations.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Bounds
 * overlap and ray frequency never satisfy a pixel-occlusion limit.
 * @evidence contracts/development/common.md#meaningful-documentation Defines the
 * scope, sample units, matching-raster requirement, and coverage limits.
 */
export interface IAutoMovieCameraInspection {
  /** Conservative framing grade for the full placed, camera-visible extent. */
  framing: IAutoMovieCameraInspection.Framing;

  /** Source-authored maximum occluded fraction, inclusive and in [0, 1]. */
  maxOcclusionRatio?: number;

  /** Finite checked rays that meet the subject's admitted surface. */
  witnesses?: IAutoMovieCameraInspection.IWitnesses;

  /** Exact counts from matching isolated and composite delivery observations. */
  pixels?: IAutoMovieCameraInspection.IPixels;
}

/** Related observations and grades for a single subject and frame. */
export namespace IAutoMovieCameraInspection {
  /** Bounds exclusion by a side or depth plane, possible overlap, or missing evidence. */
  export type Framing =
    | "outside"
    | "before-near"
    | "past-far"
    | "possible"
    | "unavailable";

  /** Evidence from rays through the actual delivery projection. */
  export interface IWitnesses {
    /** Rays that met an admitted opaque blocker before a subject surface. */
    blocked: number;

    /** Rays that met the subject with no potential intervening surface found. */
    clear: number;

    /** Camera-visible blocker hit in world metres, when available. */
    blocker?: IAutoMovieVector3;
  }

  /** Pixel counts using the same pose, projection, clipping and output raster. */
  export interface IPixels {
    /** Required-subject pixels in isolation, before coverage by other geometry. */
    isolated: number;

    /** The subset of isolated pixels still visible in the composited frame. */
    visible: number;
  }

  /** Occlusion grade and the evidence that supports its scope. */
  export type Occlusion =
    | { status: "not-applicable" | "unmeasured" | "no-target-pixels" }
    | { status: "witnesses"; samples: IWitnesses }
    | {
        status: "measured" | "within-limit" | "above-limit";
        pixels: IPixels;
        ratio: number;
      };

  /** Independent framing and occlusion grades. */
  export interface IResult {
    /** Complete exclusion, possible overlap, or unavailable bounds. */
    framing: Framing;

    /** Evidence of coverage only under the stated method. */
    occlusion: Occlusion;
  }
}
