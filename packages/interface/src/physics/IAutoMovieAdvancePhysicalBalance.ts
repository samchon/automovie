import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";
import type { IAutoMovieFootfallPattern } from "./IAutoMovieFootfallPattern";
import type { IAutoMoviePhysicalBalance } from "./IAutoMoviePhysicalBalance";
import type { IAutoMovieStepPlanner } from "./IAutoMovieStepPlanner";

/**
 * Recovery policy, checkpoint state and one tick's plain controller result.
 * The controller mutates its caller-owned state; results share that same state.
 *
 * @evidence contracts/development/design.md#principled-representation Distinguish proposed swings, measured landing acceptance and authored ownership handoffs so checkpoint continuation does not treat a requested step as completed contact.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Native bodies and world handles stay in engine; policy, history, adopted offsets and requested goals are plain controller facts.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Landing requires loaded support, position and speed checks; timeout records failure, and bracing requests bounded target changes rather than fabricated support.
 * @evidence contracts/development/common.md#meaningful-documentation Members specify local seconds, world metres, force units, defaults and shared mutable state ownership.
 */
export namespace IAutoMovieAdvancePhysicalBalance {
  /** Same support pattern used by the authored step planner. */
  export interface IPolicy {
    /** Arbitrary endpoint bones and their timing. */ pattern: IAutoMovieFootfallPattern;
    /** Maximum recovery-step distance, metres. */ maximumStep: number;
    /** Support margin in metres. */ margin: number;
    /** Recovery swing duration, seconds. */ duration: number;
    /** Peak recovery clearance, metres. */ height: number;
    /** Endpoint motor stiffness, N/m. */ stiffness: number;
    /** Endpoint motor damping, N s/m. */ damping: number;
    /** Per-endpoint force cap, N. */ maximumForce: number;
    /** Tracking strength of recovery IK goals, [0,1]; defaults to full bounded tracking. */ jointStrength?: number;
    /** Recovery coordinate-descent budget, 1..64; defaults to 24. */ iterations?: number;
    /** Recovery target residual early-out, metres; defaults to 0.001. */ targetTolerance?: number;
    /** Maximum reach-derived root lowering, metres; defaults to 0.15. */ maximumRootDrop?: number;
    /** Maximum horizontal landing error, metres; defaults to 0.025. */ landingTolerance?: number;
    /** Maximum endpoint speed at accepted landing, m/s; defaults to 1. */ landingSpeed?: number;
    /** Seconds to await actual contact after swing, defaulting to duration. */ landingTimeout?: number;
    /** Sustained support loss before a recovery request, seconds; defaults to 0.1. */ reactionSeconds?: number;
    /** Retain bounded muscular effort after a missed step until measured recovery geometry is lost. */ bracing?: {
      /** Minimum actual COM height above the floor, metres; the provider declares its standing-recovery envelope. */ minimumCenterHeight: number;
      /** Maximum horizontal capture-point correction of the root motor target, metres. */ maximumRootShift: number;
    };
  }

  /** Every field needed for a deterministic checkpoint continuation. */
  export interface IState {
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

  /**
   * Advance one body's generic recovery controller from actual floor manifolds.
   * Root tracking is withdrawn on unrecoverable support loss. Recovery requests
   * use the shared support-swing interpolator and bounded endpoint motors; their
   * completed placements remain offsets on subsequent authored goals, so the
   * planner and physical support do not snap apart at landing.
   */
  export type IResult = {
    /** Root-tracking multiplier, currently zero or one according to exhaustion/bracing policy. */
    rootStrength: number;
    /** World horizontal root-target correction in metres, present only with bracing policy. */
    rootShift?: IAutoMovieVector3;
    /** Same mutable input state after this tick's swing/landing/ownership updates. */
    state: IAutoMovieAdvancePhysicalBalance.IState;
    /** New map of world support-point goals in metres for active or retained recovery owners. */
    goals: Record<string, IAutoMovieVector3>;
  };
}
