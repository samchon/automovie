import type { IAutoMovieQuaternion } from "../geometry/IAutoMovieQuaternion";
import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";
import type { IAutoMoviePhysicalBalance } from "./IAutoMoviePhysicalBalance";
import type { IAutoMovieStepPlanner } from "./IAutoMovieStepPlanner";

/** Every field needed for a deterministic checkpoint continuation. */
export interface IAutoMoviePhysicalRecoveryState {
  /** Last physical assessment. */ last: IAutoMoviePhysicalBalance.IResult["state"];
  /** Active support swing, if any. */ swing?: IAutoMovieStepPlanner.IStep;
  /**
   * The diagonal partner of a four-support body's pair swing, if any: its step,
   * which shares the swing's start and end and lifts with it, and its own
   * `cleared` and `touchdown`, as the state's are the swing's. Each foot of the
   * pair lands by its own contact; the first to land leaves the other the swing
   * (Chen et al. 2022, Section 2.1, Example 1).
   */ pair?: {
    step: IAutoMovieStepPlanner.IStep;
    cleared?: boolean;
    touchdown?: number;
  };
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
   * Start of a lifted swing foot's continuous measured floor load before its
   * swing's minimum phase, local seconds.
   */ touchdown?: number;
  /**
   * Whether the lifted swing foot has risen clear of the floor since its
   * lift-off: until it has, its contact is the floor it never left, not an
   * early touchdown.
   */ cleared?: boolean;
  /**
   * The capture point's distance past the support at the previous controller
   * step, metres, so whether it is shrinking is measured, not modelled.
   */ excess?: number;
  /**
   * The open window over which a capture point past the shrunken support is
   * watched for shrinking: when it began, local seconds, and the excursion it
   * began at, metres.
   */ band?: { since: number; excess: number };
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
   * The biped push recovery's flags (IHMC 201903 `PushRecoveryControlModule`):
   * whether a footstep has been projected into the capture region this swing,
   * whether the swing recovers from a fall out of double support, whether the
   * capture point has been back near its plan for the safe window (a filtered
   * value and its count of controller updates), and whether its error from the
   * plan exceeds the threshold.
   */ push?: {
    recovering: boolean;
    fall: boolean;
    safe: { value: boolean; count: number };
    large: boolean;
  };
  /**
   * Each support limb's foot switch (IHMC `WrenchBasedFootSwitch`), by endpoint
   * bone: its low-force, centre-of-pressure and touchdown filters, each a
   * filtered value and its count of controller updates.
   */ switches?: Record<
    string,
    {
      low: { value: boolean; count: number };
      cop: { value: boolean; count: number };
      hit: { value: boolean; count: number };
    }
  >;
  /**
   * The biped's planned capture point this substep and its rate, world x and z,
   * metres and metres per second, which its push recovery and its capture-point
   * controller read: the recovery plan's while one runs, else the authored
   * motion's.
   */ desired?: {
    position: { x: number; z: number };
    velocity: { x: number; z: number };
  };
  /**
   * The biped's recovery plan (IHMC 201903 `ContinuousCMPBasedICPPlanner`),
   * kept as the inputs it is built from: its phase, single support from a
   * recovery trigger, the transfer to standing from a landing, or the standing
   * re-plan; when it was made, local seconds; its feet, each its endpoint bone,
   * its side, its sole frame as the plan was made (origin and forward unit
   * direction, world x and z) and its contact outline in that frame (x forward,
   * y left), the support then the footstep in single support, both feet
   * otherwise; and the pendulum's rate per second, the step's support side,
   * the last planned capture point of single support and the centre of mass
   * at the landing, or the capture point and rate the re-plan starts from and
   * ends at, each world x and z, as the phase needs.
   */ plan?: {
    phase: "single" | "toStanding" | "standing";
    since: number;
    feet: {
      bone: string;
      side: "left" | "right";
      frame: {
        origin: { x: number; z: number };
        forward: { x: number; z: number };
      };
      polygon: { x: number; y: number }[];
    }[];
    omega?: number;
    support?: "left" | "right";
    desired?: { x: number; z: number };
    center?: { x: number; z: number };
    from?: {
      position: { x: number; z: number };
      velocity: { x: number; z: number };
    };
    to?: {
      position: { x: number; z: number };
      velocity: { x: number; z: number };
    };
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
