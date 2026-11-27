import type { IAutoMovieRigidTransform } from "../geometry/IAutoMovieRigidTransform";
import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";
import type { IAutoMovieFootfallPattern } from "./IAutoMovieFootfallPattern";
import type { IAutoMoviePerformanceMode } from "./IAutoMoviePerformanceMode";
import type { IAutoMoviePhysicalContactBinding } from "./IAutoMoviePhysicalContactBinding";
import type { IAutoMoviePhysicalPointBound } from "./IAutoMoviePhysicalPointBound";
import type { IAutoMoviePhysicalProfile } from "./IAutoMoviePhysicalProfile";
import type { IAutoMoviePhysicalRecoveryPolicy } from "./IAutoMoviePhysicalRecoveryPolicy";

/**
 * Sampled physical-scene inputs, bounded controller policy and requested-torque
 * diagnostics.
 */
export namespace IAutoMoviePhysicalSimulationInput {
  /**
   * Authored world poses and causal ownership/control policy for one cache
   * sample.
   *
   * Sample k supplies continuous poses at k/rate seconds but its discrete
   * policy owns the preceding interval [(k-1)/rate,k/rate); sample zero
   * initializes ownership. AutoMoviePhysicalSimulation clones targets before
   * admission and identity hashing; physical target fitting may derive
   * different motor goals without rewriting these authored samples.
   * admitPhysicalTargets requires complete segment coverage, finite positions,
   * unit quaternions and strengths in [0,1]. dynamicSegments must explicitly
   * include descendants of every selected parent.
   */
  export interface ITarget {
    /**
     * Complete authored world bone-origin poses: positions in metres and unit
     * rotations. Admission requires exactly every profile segment.
     */
    segments: Record<string, IAutoMovieRigidTransform>;

    /**
     * Explicit descendant-closed set of dynamic bones in simulated modes;
     * omitted selects all, [] selects authored motion. Include every descendant
     * of a selected parent. Kinematic mode remains authored regardless.
     */
    dynamicSegments?: string[];

    /** Tracking strength in [0,1]. */
    strength: number;

    /**
     * Optional joint-id tracking fractions in [0,1]; omitted entries fall back
     * to the target's overall strength.
     */
    jointStrength?: Record<string, number>;

    /**
     * Optional joint-id fractions in [0,1] used after the declared
     * contact-triggered withdrawal; requires releaseOnContact. Omission
     * preserves jointStrength overrides; missing entries in an explicit
     * replacement map fall back to the withdrawn strength of zero.
     */
    releasedJointStrength?: Record<string, number>;

    /**
     * Per-support endpoint tracking fraction in [0,1]; omission withdraws that
     * endpoint motor.
     */
    supportStrength?: Record<string, number>;

    /**
     * Distinct balance-pattern endpoint ids reserved by authored motion;
     * omitted or empty reserves none, independently of whether an endpoint
     * tracking motor remains active.
     */
    unavailableSupports?: string[];

    /**
     * Exact id of a mutually bound group for this output interval. Active
     * targets with the same id at step k share one target fit against the
     * simultaneous scene snapshot. Frame zero seeds the simulation. Omission
     * keeps ordinary individual tracking. Admission refuses a member with
     * releaseOnContact, and a member whose native root also takes balance or
     * supportTracking goals at that step.
     */
    coupledGroup?: string;

    /**
     * Optional collider-relative motor goals against actual scene states;
     * omission or [] adds none. Shares maximumBindings and the combined 1024
     * residual-row budget with pointBounds.
     */
    bindings?: IAutoMoviePhysicalContactBinding[];

    /**
     * Optional bone-relative projection intervals; omission or [] adds none.
     * Shares relationship, coordinate and residual budgets with bindings.
     */
    pointBounds?: IAutoMoviePhysicalPointBound[];
  }

  /**
   * One scene body's physical profile, authored samples and bounded controller
   * policy.
   *
   * Targets includes zero and all duration times rate endpoints; translational
   * gains use N/m and N s/m, angular gains N m/rad and N m s/rad. Simulation
   * compute clones this descriptor, supplies documented defaults and admits it
   * before allocating native objects; optional controllers add only the
   * declared physical policy. admitPhysicalBody, admitPhysicalReleasePolicy and
   * admitPhysicalTargets own cross-field validation. Internal actuation
   * requires supportTracking or balance; omitted optional controllers are
   * inactive.
   */
  export interface IBody {
    /** Unique nonblank scene body id, excluding '/' and the reserved id 'floor'. */
    id: string;

    /** Admitted SI profile. */
    profile: IAutoMoviePhysicalProfile;

    /** Physical policy, applied at the scene's body boundary. */
    mode: IAutoMoviePerformanceMode;

    /** Exactly duration*rate+1 frames, including zero. */
    targets: IAutoMoviePhysicalSimulationInput.ITarget[];

    /**
     * Positive seconds for a dynamic subtree to return through one
     * native/display trajectory with continuous relative pose and velocity;
     * defaults to 0.2.
     */
    handoffSeconds?: number;

    /**
     * Admitted native residuals at return entry. Defaults to contactTolerance
     * metres and 64 double-precision ulps of radians, the rounding
     * post-stabilization at return entry leaves. Return never increases the
     * declared envelope; inherited anchor error decays without a pose
     * discontinuity.
     */
    handoffLimits?: IBodyHandoffLimits;

    /**
     * Maximum collider and point relationships together per sampled target,
     * integer 1..256; defaults to 16. Admission also counts contact,
     * point-bound sides, self-contact, floor and endpoint residual rows.
     */
    maximumBindings?: number;

    /** Root positional stiffness, N/m; zero leaves balance/gravity in control. */
    rootStiffness: number;

    /** Root damping, N s/m. */
    rootDamping: number;

    /** Root force cap in N, including gravity compensation. */
    maximumRootForce: number;

    /** Post-contact softening duration, seconds. */
    complianceSeconds: number;

    /** Tracking fraction while the region is compliant, in [0,1]. */
    complianceStrength: number;

    /**
     * Optional generic support feedback; omission leaves balance to authored
     * tracking.
     */
    balance?: IAutoMoviePhysicalRecoveryPolicy;

    /**
     * Optional bounded world-orientation motor for the root; omission leaves
     * root orientation without this motor.
     */
    rootTorque?: IBodyRootTorque;

    /**
     * When true, counter weight and downstream gravity moments through existing
     * root-force and joint-torque caps; omitted or false adds no compensation.
     */
    compensateGravity?: boolean;

    /**
     * World actuators apply external wrenches (default). Internal Cartesian
     * demands map through support/endpoint Jacobians into the existing bounded
     * joint motors, conserving free-body momentum.
     */
    actuation?: "world" | "internal";

    /**
     * Optional geometric target fitting for enabled profile self-contact pairs;
     * omission adds no self-avoidance fit. Admission caps free coordinates at
     * 64 and total shapes at 40.
     */
    selfAvoidance?: IBodySelfAvoidance;

    /**
     * Optional irreversible withdrawal triggered only by an actual positive
     * solver impulse between the selected shape sets in the inclusive window;
     * omission disables this trigger.
     */
    releaseOnContact?: IBodyReleaseOnContact;

    /** Optional bounded world-point motors for declared support endpoints. */
    supportTracking?: IBodySupportTracking;
  }

  /** The supportTracking object of {@link IBody}. */
  export type IBodySupportTracking = {
    /** Actual support owners and their bone-local endpoints. */
    pattern: IAutoMovieFootfallPattern;

    /** Endpoint positional stiffness, N/m. */
    stiffness: number;

    /** Endpoint damping, N s/m. */
    damping: number;

    /** Force norm cap at each endpoint, N. */
    maximumForce: number;

    /**
     * Per-cache-interval actual-root support IK iterations, 0..64; defaults
     * to 24. Zero selects force-only endpoint control.
     */
    iterations?: number;

    /** Metre IK early-out residual; defaults to 0.001. */
    tolerance?: number;
  };

  /** The releaseOnContact object of {@link IBody}. */
  export type IBodyReleaseOnContact = {
    /** Inclusive first local simulation second. */
    earliest: number;

    /** Inclusive last local simulation second. */
    latest: number;

    /** Receiving shape ids from this body's profile. */
    shapes: string[];

    /** Other scene body. */
    otherBody: string;

    /** Contacting shape ids from the other body's profile. */
    otherShapes: string[];
  };

  /** The selfAvoidance object of {@link IBody}. */
  export type IBodySelfAvoidance = {
    /** Total bounded geometric updates, 1..64. */
    iterations: number;

    /** Positive metre residual tolerance. */
    tolerance: number;
  };

  /** The rootTorque object of {@link IBody}. */
  export type IBodyRootTorque = {
    /** N m/rad. */
    stiffness: number;

    /** N m s/rad. */
    damping: number;

    /** N m per world axis. */
    maximumTorque: number;
  };

  /** The handoffLimits object of {@link IBody}. */
  export type IBodyHandoffLimits = {
    /**
     * Maximum inherited linear constraint error, metres, including fixed
     * pivots and contact penetration beyond admitted material compression.
     */
    maximumLinearError: number;

    /** Maximum inherited angular-limit violation, radians. */
    maximumJointViolation: number;
  };

  /**
   * Complete sampled scene and explicit work budgets for deterministic
   * fixed-step simulation.
   *
   * Rate is cached intervals/s; substeps multiplies it into native ticks/s.
   * Positive duration times rate is an exact safe integer bounded by
   * maximumSteps. AutoMoviePhysicalSimulation owns a clone with defaults
   * applied; settings, profiles, targets and impulses participate in content
   * identity and checkpoint compatibility. admitPhysicalSimulation checks
   * finite scalars, floor dimensions, population and clock budgets before world
   * allocation. Empty arrays are valid where no body or impulse is needed;
   * invalid references or budgets throw.
   */
  export interface IInput {
    /**
     * Positive finite local film duration in seconds; duration times rate must
     * be a safe integer.
     */
    duration: number;

    /**
     * Positive safe-integer cached intervals per second; native steps occur at
     * rate times substeps.
     */
    rate: number;

    /**
     * Uniform solver substeps per cached interval, 1..128; defaults to 16. Each
     * substep runs one position pass and one velocity pass, so accuracy comes
     * from substeps (Macklin et al. 2019).
     */
    substeps?: number;

    /** Allowed linear contact error, metres; defaults to 0.0001. */
    contactTolerance?: number;

    /** Contact spring frequency, Hz; defaults to 240. */
    contactFrequency?: number;

    /** World gravitational acceleration, m/s². */
    gravity: IAutoMovieVector3;

    /** Flat floor top height, metres. */
    floor: number;

    /**
     * Explicit finite floor domain; escaping shapes refuse rather than silently
     * losing support.
     */
    floorBounds: IInputFloorBounds;

    /** Scene bodies, in deterministic construction order. */
    bodies: IAutoMoviePhysicalSimulationInput.IBody[];

    /** Explicit impulses, including declared mixed-mode boundary events. */
    impulses: {
      /**
       * Cached interval index in 1..duration*rate. Applied once before that
       * interval's first native integration step, at its starting boundary.
       */
      step: number;

      /** Admitted scene body receiving the impulse. */
      body: string;

      /** Segment id within that body's physical profile. */
      bone: string;

      /**
       * Finite world linear impulse in N s before the body's exaggerated-mode
       * impulse factor.
       */
      impulse: IAutoMovieVector3;

      /**
       * Finite world application point in metres; its offset from COM also
       * generates angular impulse.
       */
      point: IAutoMovieVector3;
    }[];

    /**
     * Positive safe-integer number of cached intervals between complete
     * native/controller/balance snapshots; frame zero also has a checkpoint.
     */
    checkpointEvery: number;

    /**
     * Positive safe-integer number of cached intervals between host yields and
     * progress reports; completion also reports progress.
     */
    yieldEvery: number;

    /**
     * Positive safe-integer cap on duration times rate, checked before native
     * allocation; does not include frame zero.
     */
    maximumSteps: number;

    /**
     * Positive safe-integer cap on the sum of physical profile segment counts
     * across bodies.
     */
    maximumSegments: number;
  }

  /** The floorBounds object of {@link IInput}. */
  export type IInputFloorBounds = {
    /** Lower horizontal coordinates, metres. */
    min: {
      /**
       * Finite lower world X extent of the floor, metres; strictly below
       * max.x.
       */
      x: number;

      /**
       * Finite lower world Z extent of the floor, metres; strictly below
       * max.z.
       */
      z: number;
    };

    /** Upper horizontal coordinates, metres. */
    max: {
      /**
       * Finite upper world X extent of the floor, metres; strictly above
       * min.x.
       */
      x: number;

      /**
       * Finite upper world Z extent of the floor, metres; strictly above
       * min.z.
       */
      z: number;
    };

    /** Positive solid floor depth below its top, metres. */
    thickness: number;
  };

  /**
   * A joint tracking error and requested-torque saturation diagnostic at one
   * output instant.
   *
   * Seconds uses local film time and error is a shortest-arc norm in radians;
   * saturated names joint-frame coordinates. trackPhysicalWorld records
   * material pre-solve demands, while trackingAt allocates diagnostics against
   * the original authored target and borrows saturation history by completed
   * step. No diagnostic claims achieved torque or contact load; recovery-fitted
   * targets can differ from authored targets. Stored rows omit unsaturated
   * negligible errors.
   */
  export interface IDiagnostic {
    /** Film second. */
    seconds: number;

    /** Scene body. */
    body: string;

    /** Profile joint. */
    joint: string;

    /** Error norm, radians. */
    error: number;

    /** Coordinates whose pre-solve PD demand exceeds the enforced torque cap. */
    saturated: ("x" | "y" | "z")[];
  }
}
