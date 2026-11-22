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
  /**
   * Bounds exclusion by a side or depth plane, possible overlap, or missing evidence.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names each of the five framing grades.
   * @evidence contracts/development/design.md#principled-representation Three exclusion grades name the plane that excludes the bounds, apart from possible overlap and missing evidence.
   * @evidence contracts/development/design.md#minimal-and-owned-surface A closed literal union read by the classifier and the frame reporter.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Possible overlap never claims visibility, and missing evidence stays distinct from exclusion.
   */
  export type Framing =
    | "outside"
    | "before-near"
    | "past-far"
    | "possible"
    | "unavailable";

  /**
   * Evidence from rays through the actual delivery projection.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what each ray count and the optional blocker point mean, in world metres.
   * @evidence contracts/development/design.md#principled-representation Counts of blocked and clear rays with the first blocker hit as finite witnesses.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Two counts and one optional point, produced by the bounded ray pass.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Ray counts are witnesses only and never form an occlusion ratio.
   */
  export interface IWitnesses {
    /** Rays that met an admitted opaque blocker before a subject surface. */
    blocked: number;

    /** Rays that met the subject with no potential intervening surface found. */
    clear: number;

    /** Camera-visible blocker hit in world metres, when available. */
    blocker?: IAutoMovieVector3;
  }

  /**
   * Pixel counts using the same pose, projection, clipping and output raster.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States that both counts share one raster and that visible is a subset of isolated.
   * @evidence contracts/development/design.md#principled-representation Isolated and visible counts of the same delivered raster, so their ratio is the occluded fraction.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Two integers produced by the matched mask renders.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Counts from different rasters, poses or projections are not admitted as a pair.
   */
  export interface IPixels {
    /** Required-subject pixels in isolation, before coverage by other geometry. */
    isolated: number;

    /** The subset of isolated pixels still visible in the composited frame. */
    visible: number;
  }

  /**
   * Occlusion grade and the evidence that supports its scope.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names each status and the evidence each carries.
   * @evidence contracts/development/design.md#principled-representation A union discriminated by status keeps ungraded states, ray witnesses and pixel measurements apart, each with only its own evidence.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Produced by classifyAutoMovieCameraInspection alone.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Only pixel counts carry a ratio and a limit grade; witnesses never do.
   */
  export type Occlusion =
    | { status: "not-applicable" | "unmeasured" | "no-target-pixels" }
    | { status: "witnesses"; samples: IWitnesses }
    | {
        status: "measured" | "within-limit" | "above-limit";
        pixels: IPixels;
        ratio: number;
      };

  /**
   * Independent framing and occlusion grades.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the two grades and states that they are independent.
   * @evidence contracts/development/design.md#principled-representation Framing and occlusion are graded separately, so an excluded subject still states that occlusion does not apply.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Two members, returned by the classifier to the frame reporter.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Occlusion is never inferred from framing beyond marking it not applicable.
   */
  export interface IResult {
    /** Complete exclusion, possible overlap, or unavailable bounds. */
    framing: Framing;

    /** Evidence of coverage only under the stated method. */
    occlusion: Occlusion;
  }
}
