import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";
import type { IAutoMovieMotionAudit } from "./IAutoMovieMotionAudit";

/** Displayed-pose witnesses, time-windowed geometric promises and finite-sample audit results. */
export namespace IAutoMovieMeasurePhysicalMotionConstraint {
  /**
   * A displayed bone-origin witness, a rigid local offset, a ray extension or a blend between origins.
   *
   * The union excludes simultaneous localPoint, ray and blend; offsets and ray distance are metres, while blend weight is dimensionless in [0,1]. measurePhysicalMotionConstraint resolves witnesses from the supplied body's frame without modifying it; an omitted localPoint uses the bone origin. Motion-audit admission checks bone references and finite parameters; measurement rejects missing poses or coincident ray origins instead of inventing a witness.
   *
   * @evidence contracts/development/common.md#meaningful-documentation A displayed bone-origin witness, a rigid local offset, a ray extension or a blend between origins.
   * @evidence contracts/development/design.md#principled-representation The union excludes simultaneous localPoint, ray and blend; offsets and ray distance are metres, while blend weight is dimensionless in [0,1].
   * @evidence contracts/development/design.md#minimal-and-owned-surface measurePhysicalMotionConstraint resolves witnesses from the supplied body's frame without modifying it; an omitted localPoint uses the bone origin.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Motion-audit admission checks bone references and finite parameters; measurement rejects missing poses or coincident ray origins instead of inventing a witness.
   */
  export type IAnchor = {
    /** Endpoint bone id. */

    /** Bone or admitted witness id within the audited body's frame. */
    bone: string;
  } & (
    | {
        /** Bone-local metres. */
        localPoint?: IAutoMovieVector3;

        /** Mutually exclusive with a rigid offset. */
        ray?: never;

        /** Mutually exclusive with a rigid offset. */
        blend?: never;
      }
    | {
        /** Extension beyond bone along from -> bone, metres. */
        ray: {
          /** Ray origin bone. */
          from: string;

          /** Nonnegative extension. */
          distance: number;
        };

        /** A ray already defines the point. */
        localPoint?: never;

        /** A ray already defines the point. */
        blend?: never;
      }
    | {
        /** Interpolation between actual segment origins. */
        blend: {
          /** Other actual segment. */
          other: string;

          /** Share toward other, in [0,1]. */
          weight: number;
        };

        /** A blend already defines the point. */
        localPoint?: never;

        /** A blend already defines the point. */
        ray?: never;
      }
  );

  /**
   * A time-windowed goal, distance or bend promise evaluated against displayed poses.
   *
   * kind chooses required witnesses; limits use metres for goal/distance and radians for bend, where straight is zero. The inclusive window uses film seconds. AutoMovieMotionAudit invokes optional enabled before measuring and target only for enabled goal samples; callbacks are synchronous, borrowed for the run and must not mutate poses. Admission requires a nonblank label, finite ordered window and at least one finite bound; disabled samples are skipped. Callback failures and degenerate angle geometry reject the audit.
   *
   * @evidence contracts/development/common.md#meaningful-documentation A time-windowed goal, distance or bend promise evaluated against displayed poses.
   * @evidence contracts/development/design.md#principled-representation kind chooses required witnesses; limits use metres for goal/distance and radians for bend, where straight is zero. The inclusive window uses film seconds.
   * @evidence contracts/development/design.md#minimal-and-owned-surface AutoMovieMotionAudit invokes optional enabled before measuring and target only for enabled goal samples; callbacks are synchronous, borrowed for the run and must not mutate poses.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Admission requires a nonblank label, finite ordered window and at least one finite bound; disabled samples are skipped. Callback failures and degenerate angle geometry reject the audit.
   */
  export type IConstraint = {
    /** Caller-owned measurement identity. */
    label: string;

    /** Inclusive first film second. */
    start: number;

    /** Inclusive last film second. */
    end: number;

    /** Inclusive lower acceptance limit; omitted means unbounded. */
    minimum?: number;

    /** Inclusive upper acceptance limit; omitted means unbounded. */
    maximum?: number;

    /** Optional synchronous phase predicate at film seconds; only false skips the sample. Omitted means enabled throughout the inclusive window; exceptions reject the audit.
     *
     * @evidence contracts/development/common.md#meaningful-documentation Specifies the enabled callback or sampling contract, including its clock and ownership obligations.
     * @evidenceExclude contracts/development/implementation.md#principled-implementation This is a callable contract with no implementation body; its producer owns algorithmic work and resource retention under the documented sampling and lifetime obligations.
     * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This is a callable contract with no implementation body; its producer owns algorithmic work and resource retention under the documented sampling and lifetime obligations.
     * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts This is a callable contract with no implementation body; its producer owns algorithmic work and resource retention under the documented sampling and lifetime obligations.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This is a callable contract with no implementation body; its producer owns algorithmic work and resource retention under the documented sampling and lifetime obligations.
     * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This is a callable contract with no implementation body; its producer owns algorithmic work and resource retention under the documented sampling and lifetime obligations.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This is a callable contract with no implementation body; its producer owns algorithmic work and resource retention under the documented sampling and lifetime obligations.
     */
    enabled?: (seconds: number) => boolean;
  } & (
    | {
        /** Euclidean endpoint error. */
        kind: "goal";

        /** Actual displayed witness. */
        point: IAutoMovieMeasurePhysicalMotionConstraint.IAnchor;

        /** Synchronous desired world point in metres at the sampled film second; must be finite and stable for that time. The audit neither retains nor mutates the returned point.
         *
         * @evidence contracts/development/common.md#meaningful-documentation Specifies the target callback or sampling contract, including its clock and ownership obligations.
         * @evidenceExclude contracts/development/implementation.md#principled-implementation This is a callable contract with no implementation body; its producer owns algorithmic work and resource retention under the documented sampling and lifetime obligations.
         * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This is a callable contract with no implementation body; its producer owns algorithmic work and resource retention under the documented sampling and lifetime obligations.
         * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts This is a callable contract with no implementation body; its producer owns algorithmic work and resource retention under the documented sampling and lifetime obligations.
         * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This is a callable contract with no implementation body; its producer owns algorithmic work and resource retention under the documented sampling and lifetime obligations.
         * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This is a callable contract with no implementation body; its producer owns algorithmic work and resource retention under the documented sampling and lifetime obligations.
         * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This is a callable contract with no implementation body; its producer owns algorithmic work and resource retention under the documented sampling and lifetime obligations.
         */
        target: (seconds: number) => IAutoMovieVector3;
      }
    | {
        /** Pairwise separation, including support-to-root spread. */
        kind: "distance";

        /** First witness. */
        from: IAutoMovieMeasurePhysicalMotionConstraint.IAnchor;

        /** Second witness. */
        to: IAutoMovieMeasurePhysicalMotionConstraint.IAnchor;

        /** When true, measure world X/Z separation only; omitted or false includes world Y. */
        horizontal?: boolean;
      }
    | {
        /** Bend from a straight three-point chain. */
        kind: "angle";

        /** Proximal witness. */
        from: IAutoMovieMeasurePhysicalMotionConstraint.IAnchor;

        /** Joint centre. */
        pivot: IAutoMovieMeasurePhysicalMotionConstraint.IAnchor;

        /** Distal witness. */
        to: IAutoMovieMeasurePhysicalMotionConstraint.IAnchor;
      }
  );

  /**
   * Promise of the complete finite-sample motion audit.
   *
   * samples counts all sampled instants including both endpoints; findings retains every measured bound violation, with units selected by its kind. AutoMovieMotionAudit.run allocates the result and finding records; callers may edit them after the promise resolves. Invalid policies, missing frames, nonfinite measurements or callback failures reject instead of returning a partial passing result; no findings certifies only sampled instants.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Promise of the complete finite-sample motion audit.
   * @evidence contracts/development/design.md#principled-representation samples counts all sampled instants including both endpoints; findings retains every measured bound violation, with units selected by its kind.
   * @evidence contracts/development/design.md#minimal-and-owned-surface AutoMovieMotionAudit.run allocates the result and finding records; callers may edit them after the promise resolves.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Invalid policies, missing frames, nonfinite measurements or callback failures reject instead of returning a partial passing result; no findings certifies only sampled instants.
   */
  export type IRunResult = Promise<{
    /** Number of sampled instants: ceil((end-start)*rate)+1, including a final sample clamped to end. */
    samples: number;

    /** New mutable array of all violations encountered; empty means all supplied checks passed at the sampled instants. */
    findings: IAutoMovieMotionAudit.IFinding[];
  }>;
}
