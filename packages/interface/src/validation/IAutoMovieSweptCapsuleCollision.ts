import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/**
 * A continuous query over two capsules with explicitly supplied motion.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Documents affine input authority, world units, sample brackets, tested work and unknown outcomes.
 * @evidence contracts/development/design.md#principled-representation A span holds endpoints of each capsule centre segment at the same two times, with a fixed radius. A closed union distinguishes proven clearance, sampled violation and unverified motion or work.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The caller supplies one continuous affine span after splitting at source knots, cuts and contact windows. Geometry and time stay independent from a host's reports and marks.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts A null span conveys unavailable evidence. A sampled violation supplies a witness time and enclosing checked interval, without an asserted first time of impact.
 */
export namespace IAutoMovieSweptCapsuleCollision {
  /**
   * One constant-radius capsule with affine endpoint motion over the admitted interval.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Describes the four world-metre axis endpoints, radius and authority over the source interval.
   * @evidence contracts/development/design.md#principled-representation Each axis endpoint follows its own affine trajectory; equal endpoints may describe a sphere.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The motion source attests the geometry. The sweep query evaluates only this supplied interval.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Formerly sampled poses provide no authority to claim affine motion or displayed geometry.
   */
  export interface ISpan {
    /** Segment's first endpoint at interval start, world metres. */
    a0: IAutoMovieVector3;
    /** Segment's second endpoint at interval start, world metres. */
    b0: IAutoMovieVector3;
    /** Segment's first endpoint at interval end, world metres. */
    a1: IAutoMovieVector3;
    /** Segment's second endpoint at interval end, world metres. */
    b1: IAutoMovieVector3;
    /** Positive world radius in metres. A degenerate segment can describe a sphere. */
    radius: number;
    /** The source's authority for the supplied solid over this interval. */
    basis: "displayed" | "proxy";
  }

  /**
   * One pair of spans read on the same uninterrupted source clock.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Specifies admission of the spans, shared clock, allowed world penetration and work limit.
   * @evidence contracts/development/design.md#principled-representation Both spans share the same inclusive, increasing clock and one depth allowance throughout.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The source splits at law and allowance knots. The query owns the work within an admitted cell.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Missing motion is explicit. A caller cannot use the type to span across an unsupported discontinuity.
   */
  export interface IProps {
    /** First capsule or null when the source cannot certify this motion. */
    first: ISpan | null;
    /** Second capsule or null when the source cannot certify this motion. */
    second: ISpan | null;
    /** Inclusive start, layer-local seconds. */
    startSeconds: number;
    /** Inclusive end, strictly later than start, on the same clock. */
    endSeconds: number;
    /** Nonnegative depth allowed throughout this interval. */
    maxPenetration: number;
    /** Maximum intervals whose bound and optional centre sample can be examined. */
    maxIntervals: number;
  }

  /**
   * A deterministic result for the supplied geometry and work budget.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Explains the clearance, sampled witness with local bracket, and deferred outcomes.
   * @evidence contracts/development/design.md#principled-representation Clearance carries geometry authority. The sampled result owns a concrete world point and time.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Consumers can display a sampled witness or report remaining coverage without reconstructing trajectories.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No time of first impact is claimed. Unproven clearance remains deferred.
   */
  export type IResult =
    | {
        /** A bound proves the permitted depth holds over every elementary interval. */
        status: "clear";
        /** Whether every participating capsule describes the actual displayed solid. */
        basis: "displayed" | "proxy";
        /** Intervals examined. */
        compared: number;
      }
    | {
        /** One sampled violation within a checked interval. */
        status: "confirmed" | "proxy";
        /** Seconds of the actual sample, on the input clock. */
        seconds: number;
        /** Enclosing interval start on the input clock. */
        startSeconds: number;
        /** Enclosing interval end on the input clock. */
        endSeconds: number;
        /** Measured distance between the chosen axis points, less the two radii, in metres. */
        separation: number;
        /** World-metre contact witness between the axis points, weighted by the two radii. */
        point: IAutoMovieVector3;
        /** Intervals examined before finding the sample. */
        compared: number;
      }
    | {
        /** The complete interval lacks a proof. */
        status: "deferred";
        /** Why remaining coverage could not be established. */
        reason: "unsupported-motion" | "budget" | "precision";
        /** Intervals examined before deferral. */
        compared: number;
      };
}
