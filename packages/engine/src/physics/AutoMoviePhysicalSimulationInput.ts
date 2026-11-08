import type {
  AutoMoviePerformanceMode,
  IAutoMovieFootfallPattern,
  IAutoMoviePhysicalContactBinding,
  IAutoMoviePhysicalPointBound,
  IAutoMovieVector3,
  IAutoMoviePhysicalProfile as P,
} from "@automovie/interface";

import type { advancePhysicalBalance as AdvanceBalance } from "./advancePhysicalBalance";

/** Explicit fixed-step inputs can be serialized or transferred to a Worker. */
export namespace AutoMoviePhysicalSimulationInput {
  /** Continuous pose sample at step/rate. Discrete ownership, relationship and strength fields at step k own the preceding interval [(k-1)/rate,k/rate); sample zero initializes native ownership. Tracking withdrawal is strength zero. */
  export interface ITarget {
    /** Desired world bone origins and rotations. */ segments: Record<
      string,
      P.ITransform
    >;
    /** Dynamic bone subtrees in simulated modes; omitted means all segments, [] selects authored motion. Each selected parent includes all descendants. Kinematic body mode always remains authored. */
    dynamicSegments?: string[];
    /** Tracking strength in [0,1]. */ strength: number;
    /** Explicit per-joint overrides for protective reflexes or partial withdrawal. */
    jointStrength?: Record<string, number>;
    /** Protective joint effort selected only after this body's declared contact-triggered withdrawal actually occurs. */
    releasedJointStrength?: Record<string, number>;
    /** Per-support endpoint tracking fraction in [0,1]; omission withdraws that endpoint motor. */
    supportStrength?: Record<string, number>;
    /** Support endpoints reserved by authored motion, unavailable for a recovery step even when their tracking motor remains active. */
    unavailableSupports?: string[];
    /** Collider-relative motor goals evaluated against actual scene states, within maximumBindings and the combined 1024-row solve budget. */
    bindings?: IAutoMoviePhysicalContactBinding[];
    /** Bone-relative projection intervals sharing relationship, coordinate and residual budgets with collider bindings. */
    pointBounds?: IAutoMoviePhysicalPointBound[];
  }
  /** One generic provider's body and sampled authored performance. */
  export interface IBody {
    /** Unique scene id. */ id: string;
    /** Admitted SI profile. */ profile: P;
    /** Physical policy, applied at the scene's body boundary. */ mode: AutoMoviePerformanceMode;
    /** Exactly duration*rate+1 frames, including zero. */ targets: ITarget[];
    /** Positive seconds for a dynamic subtree to return through one native/display trajectory with continuous relative pose and velocity; defaults to 0.2. */
    handoffSeconds?: number;
    /** Admitted native residuals at return entry. Defaults to contactTolerance metres and 64 native-f32 eps radians. Return never increases the declared envelope; inherited anchor error decays without a pose discontinuity. */
    handoffLimits?: {
      /** Maximum inherited linear constraint error, metres, including fixed pivots and contact penetration beyond admitted material compression. */ maximumLinearError: number;
      /** Maximum inherited angular-limit violation, radians. */ maximumJointViolation: number;
    };
    /** Maximum collider and point relationships together per sampled target, integer 1..256; defaults to 16. Admission also counts contact, point-bound sides, self-contact, floor and endpoint residual rows. */
    maximumBindings?: number;
    /** Root positional stiffness, N/m; zero leaves balance/gravity in control. */ rootStiffness: number;
    /** Root damping, N s/m. */ rootDamping: number;
    /** Root force cap in N, including gravity compensation. */ maximumRootForce: number;
    /** Post-contact softening duration, seconds. */ complianceSeconds: number;
    /** Tracking fraction while the region is compliant, in [0,1]. */ complianceStrength: number;
    /** Optional generic support feedback; omission leaves balance to authored tracking. */
    balance?: AdvanceBalance.IPolicy;
    /** Optional bounded world-orientation motor for the root. */
    rootTorque?: {
      /** N m/rad. */ stiffness: number;
      /** N m s/rad. */ damping: number;
      /** N m per world axis. */ maximumTorque: number;
    };
    /** Counter weight and downstream gravity moments through declared root-force and joint-torque budgets. */
    compensateGravity?: boolean;
    /** World actuators apply external wrenches (default). Internal Cartesian demands map through support/endpoint Jacobians into the existing bounded joint motors, conserving free-body momentum. */
    actuation?: "world" | "internal";
    /** Fit all enabled self-contact pairs from the profile's actual geometry, without a catalogue of body parts. */
    selfAvoidance?: {
      /** Total bounded geometric updates, 1..64. */ iterations: number;
      /** Positive metre residual tolerance. */ tolerance: number;
    };
    /** Irreversible tracking withdrawal after an actual positive solver impulse between explicitly selected shapes. A missed or out-of-window contact never triggers it. */
    releaseOnContact?: {
      /** Inclusive first local simulation second. */ earliest: number;
      /** Inclusive last local simulation second. */ latest: number;
      /** Receiving shape ids from this body's profile. */ shapes: string[];
      /** Other scene body. */ otherBody: string;
      /** Contacting shape ids from the other body's profile. */ otherShapes: string[];
    };
    /** Optional minimum native island quality after complete tracking withdrawal; active bodies use the scene settings. Contacts/joints share the island's largest request. */
    releasedQuality?: {
      /** Minimum native solver iterations, 1..128. */ iterations: number;
      /** Minimum internal constraint sweeps, 1..128. */ internalIterations: number;
      /** Retain this quality while effective root tracking is zero, including balance withdrawal with protective joint effort; defaults to fully released bodies only. */ duringReflex?: boolean;
    };
    /** Optional bounded world-point motors for declared support endpoints. */
    supportTracking?: {
      /** Actual support owners and their bone-local endpoints. */ pattern: IAutoMovieFootfallPattern;
      /** Endpoint positional stiffness, N/m. */ stiffness: number;
      /** Endpoint damping, N s/m. */ damping: number;
      /** Force norm cap at each endpoint, N. */ maximumForce: number;
      /** Per-cache-interval actual-root support IK iterations, 0..64; defaults to 24. Zero selects force-only endpoint control. */ iterations?: number;
      /** Metre IK early-out residual; defaults to 0.001. */ tolerance?: number;
    };
  }
  /** All bounded work settings are part of content identity. */
  export interface IInput {
    /** Exact film duration in seconds. */ duration: number;
    /** Fixed integration steps per second. */ rate: number;
    /** Uniform native steps per cached interval, 1..128; defaults to 16. */ substeps?: number;
    /** Native allowed linear contact error, metres; defaults to 0.0001. */ contactTolerance?: number;
    /** Native contact spring frequency, Hz; defaults to 240. */ contactFrequency?: number;
    /** World gravitational acceleration, m/s². */ gravity: IAutoMovieVector3;
    /** Flat floor top height, metres. */ floor: number;
    /** Explicit finite floor domain; escaping shapes refuse rather than silently losing support. */ floorBounds: {
      /** Lower horizontal coordinates, metres. */ min: {
        x: number;
        z: number;
      };
      /** Upper horizontal coordinates, metres. */ max: {
        x: number;
        z: number;
      };
      /** Positive solid floor depth below its top, metres. */ thickness: number;
    };
    /** Scene bodies, in deterministic construction order. */ bodies: IBody[];
    /** Explicit impulses, including declared mixed-mode boundary events. */ impulses: {
      step: number;
      body: string;
      bone: string;
      impulse: IAutoMovieVector3;
      point: IAutoMovieVector3;
    }[];
    /** Steps between complete solver snapshots. */ checkpointEvery: number;
    /** Steps between host event-loop yields. */ yieldEvery: number;
    /** Native velocity/position solver iteration budget. */ iterations: number;
    /** Native constraint sweeps at each solver iteration, 1..128; defaults to 1. */ internalIterations?: number;
    /** Refuse an unbounded film allocation before creating WASM objects. */ maximumSteps: number;
    /** Maximum total profile segments. */ maximumSegments: number;
  }
  /** Only saturated or materially nonzero tracking errors allocate a row. */
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
