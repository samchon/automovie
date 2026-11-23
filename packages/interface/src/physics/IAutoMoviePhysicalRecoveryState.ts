import type { IAutoMovieQuaternion } from "../geometry/IAutoMovieQuaternion";
import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";
import type { IAutoMoviePhysicalBalance } from "./IAutoMoviePhysicalBalance";
import type { IAutoMovieStepPlanner } from "./IAutoMovieStepPlanner";

/**
 * Every field needed for a deterministic checkpoint continuation.
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
  /** Each stance foot's seating under edge-lift hysteresis: whether its sole is flat on its plant, the second its present seating, or the pending change to it, began, its bearing share in [0, 1], following its measured load, its flatness share in [0, 1], ramping toward whether the foot is grounded and seated, its low-passed measured floor load in newtons, whether that load holds it bearing under hysteresis, the sole's own height spread latched when its stance began, metres, and the foot's actual support point and rotation latched then, world frame. */ seating?: Record<
    string,
    {
      seated: boolean;
      since: number;
      bearing?: number;
      flat?: number;
      load?: number;
      touching?: boolean;
      relief?: number;
      anchor?: {
        point: IAutoMovieVector3;
        rotation: IAutoMovieQuaternion;
        joints?: Record<string, IAutoMovieQuaternion>;
      };
    }
  >;
  /** The centre-of-pressure integral: its bias, world metres, the low-passed horizontal centre-of-mass acceleration and the last velocity it was read from, and the limb swinging when last advanced. */ pressure?: {
    bias: { x: number; z: number };
    acceleration: { x: number; z: number };
    velocity?: { x: number; z: number };
    swing?: string;
  };
}
