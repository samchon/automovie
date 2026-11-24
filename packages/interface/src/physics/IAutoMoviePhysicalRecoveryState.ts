import type { IAutoMovieQuaternion } from "../geometry/IAutoMovieQuaternion";
import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";
import type { IAutoMoviePhysicalBalance } from "./IAutoMoviePhysicalBalance";
import type { IAutoMovieStepPlanner } from "./IAutoMovieStepPlanner";

/** Every field needed for a deterministic checkpoint continuation. */
export interface IAutoMoviePhysicalRecoveryState {
  /** Last physical assessment. */ last: IAutoMoviePhysicalBalance.IResult["state"];
  /** A two-support body's active support swing, if any. */ swing?: IAutoMovieStepPlanner.IStep;
  /**
   * A four-support body's swings under way, by endpoint bone: each lifted leg's
   * step, its interval the gait's and its target the adjusted goal, as IHMC's
   * quadruped gait swings up to two legs at once.
   */ swings?: Record<string, IAutoMovieStepPlanner.IStep>;
  /** Actual requests and measured ownership resolution, in time order. */ steps: (IAutoMovieStepPlanner.IStep & {
    /**
     * Absent while unresolved; written on the matching historical request at
     * resolution.
     */
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
  /**
   * Actual horizontal body displacement adopted at the latest confirmed
   * landing.
   */ rootOffset?: IAutoMovieVector3;
  /**
   * Confirmed physical landings and adopted goal offsets, distinct from planned
   * steps.
   */ landings?: {
    /**
     * Endpoint bone whose loaded, sufficiently near and slow landing was
     * accepted.
     */
    bone: string;
    /** Actual local simulation time of acceptance in seconds. */
    seconds: number;
    /** Copied measured support-point position in world metres. */
    position: IAutoMovieVector3;
    /**
     * Adopted horizontal endpoint displacement from authored goal in metres; y
     * is zero.
     */
    offset?: IAutoMovieVector3;
    /**
     * Adopted horizontal root displacement from authored root pose in world
     * metres.
     */
    rootOffset?: IAutoMovieVector3;
  }[];
  /**
   * An authored limb swing or strike takes back an endpoint's accepted recovery
   * placement.
   */ handoffs?: {
    /** Bone whose retained recovery offset was removed by authored ownership. */
    bone: string;
    /** Local simulation seconds when that offset was removed. */
    seconds: number;
  }[];
  /** A timed-out landing withdraws support rather than inventing a success. */ failedLanding?: boolean;
  /** Start of continuously unrecoverable support loss. */ lostSince?: number;
  /**
   * Start of continuously out-of-support capture point, including initial
   * contact settling.
   */ outsideSince?: number;
  /**
   * Monotone support-plan revision, used only to invalidate transient motor
   * goals.
   */ revision?: number;
  /**
   * Each stance foot's seating under edge-lift hysteresis: whether its sole is
   * flat on its plant, the second its present seating, or the pending change to
   * it, began, its bearing share in [0, 1], ramping toward whether the foot is
   * grounded, its flatness share in [0, 1], ramping toward whether the foot is
   * grounded and seated, its low-passed measured floor load in newtons, which
   * decides lift-off and touchdown only, its entry share in [0, 1], zero while
   * the foot is out of contact and unloaded and ramping in once it touches
   * again, the sole's own height spread latched when its stance began, metres,
   * and the foot's actual support point and rotation latched then or when it
   * last touched again, world frame.
   */ seating?: Record<
    string,
    {
      seated: boolean;
      since: number;
      bearing?: number;
      flat?: number;
      load?: number;
      entry?: number;
      relief?: number;
      anchor?: {
        point: IAutoMovieVector3;
        rotation: IAutoMovieQuaternion;
      };
    }
  >;
  /**
   * The body's planned capture point this substep and its rate, world x and z,
   * metres and metres per second, which its capture-point controller reads: the
   * authored motion's.
   */ desired?: {
    position: { x: number; z: number };
    velocity: { x: number; z: number };
  };
  /**
   * A body's response to a stated disturbance, prepared once at its first push
   * (`preparePhysicalDisturbanceSpan`): the branch point's inputs only, from
   * which the response is prepared again once on a resume. The push's time,
   * local seconds; the centre of mass and its velocity just after it, world
   * metres and metres per second; the pendulum's rate, per second; the mass,
   * kilograms, and gravity's magnitude; the planted feet, each its endpoint
   * bone, side, sole frame (world x and z) and outline in that frame (x
   * forward, y left); the authored capture point and rate; the later pushes,
   * each its time and velocity jump; the longest step and reaction time; and
   * the floor's height.
   */ span?: {
    seconds: number;
    center: IAutoMovieVector3;
    velocity: IAutoMovieVector3;
    omega: number;
    mass: number;
    gravity: number;
    feet: {
      bone: string;
      side: "left" | "right";
      frame: {
        origin: { x: number; z: number };
        forward: { x: number; z: number };
      };
      polygon: { x: number; y: number }[];
    }[];
    authored: {
      position: { x: number; z: number };
      velocity: { x: number; z: number };
    };
    pushes?: { seconds: number; velocity: IAutoMovieVector3 }[];
    maximumStep: number;
    reactionSeconds?: number;
    floor: number;
  };
  /**
   * The biped's capture-point feedback controller (IHMC `ICPController`): its
   * last centre-of-pressure feedback and pivot offset, world x and z metres as
   * x and y, its smart integrator's stuck flag and integral, whether it was
   * just initialized, how many updates its program has failed, and the walking
   * state it last ran in, the swinging limbs joined by "+" and empty in double
   * support, whose change initializes it.
   */ icp?: {
    copDelta: { x: number; y: number };
    cmpDelta: { x: number; y: number };
    integrator: { stuck: boolean; integral: { x: number; y: number } };
    ignoreRateLimit: boolean;
    failures: number;
    key: string;
  };
  /**
   * The body's pendulum rate, per second (IHMC's omega0): sqrt(g /
   * z0) at the authored centre of mass's height over the floor when its
   * controller first ran, then held for the run, as IHMC sets it once per robot
   * from its nominal height.
   */ omega?: number;
  /**
   * The centre-of-pressure integral: its bias, world metres, the low-passed
   * horizontal centre-of-mass acceleration and the last velocity it was read
   * from, the limb swinging when last advanced, and the last commanded centre
   * of pressure, world metres.
   */ pressure?: {
    bias: { x: number; z: number };
    acceleration: { x: number; z: number };
    velocity?: { x: number; z: number };
    swing?: string;
    command?: { x: number; z: number };
  };
}
