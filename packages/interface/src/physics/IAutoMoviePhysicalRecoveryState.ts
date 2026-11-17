import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";
import type { IAutoMoviePhysicalBalance } from "./IAutoMoviePhysicalBalance";
import type { IAutoMovieStepPlanner } from "./IAutoMovieStepPlanner";

/**
 * Every field needed for a deterministic checkpoint continuation.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Distinguishes pending steps, confirmed landings, authored handoffs, recovery clocks and mutable checkpoint ownership.
 * @evidence contracts/development/design.md#principled-representation Local-second history and world-metre offsets retain causal recovery ownership; resolved status distinguishes landing, cancellation and failure.
 * @evidence contracts/development/design.md#minimal-and-owned-surface advancePhysicalBalance mutates this caller-owned state and checkpoint replay preserves the same history rather than reconstructing it from a requested goal.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Optional history supports initially empty state; later landings cannot be treated as earlier support and revision only invalidates transient goals.
 */
export interface IAutoMoviePhysicalRecoveryState {
  /** Last physical assessment. */ last: IAutoMoviePhysicalBalance.IResult["state"];
  /** Active support swing, if any. */ swing?: IAutoMovieStepPlanner.IStep;
  /** Actual requests and measured ownership resolution, in time order. */ steps: (IAutoMovieStepPlanner.IStep & {
    /** Absent while unresolved; written on the matching historical request at resolution. */
    resolved?: {
      /** Actual local simulation seconds when the request was resolved. */
      seconds: number;
      /** Measured landing, authored ownership cancellation, or landing timeout. */
      status: "landed" | "cancelled" | "failed";
    };
  })[];
  /** Completed landing offsets relative to authored support goals. */ offsets: Record<
    string,
    IAutoMovieVector3
  >;
  /** Actual horizontal body displacement adopted at the latest confirmed landing. */ rootOffset?: IAutoMovieVector3;
  /** Confirmed physical landings and adopted goal offsets, distinct from planned steps. */ landings?: {
    /** Endpoint bone whose loaded, sufficiently near and slow landing was accepted. */
    bone: string;
    /** Actual local simulation time of acceptance in seconds. */
    seconds: number;
    /** Copied measured support-point position in world metres. */
    position: IAutoMovieVector3;
    /** Adopted horizontal endpoint displacement from authored goal in metres; y is zero. */
    offset?: IAutoMovieVector3;
    /** Adopted horizontal root displacement from authored root pose in world metres. */
    rootOffset?: IAutoMovieVector3;
  }[];
  /** An authored limb swing or strike takes back an endpoint's accepted recovery placement. */ handoffs?: {
    /** Bone whose retained recovery offset was removed by authored ownership. */
    bone: string;
    /** Local simulation seconds when that offset was removed. */
    seconds: number;
  }[];
  /** A timed-out landing withdraws support rather than inventing a success. */ failedLanding?: boolean;
  /** Start of continuously unrecoverable support loss. */ lostSince?: number;
  /** Start of continuously out-of-support capture point, including initial contact settling. */ outsideSince?: number;
  /** Monotone support-plan revision, used only to invalidate transient motor goals. */ revision?: number;
}
