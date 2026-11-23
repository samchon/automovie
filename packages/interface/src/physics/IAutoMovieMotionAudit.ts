import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";
import type { IAutoMovieMeasurePhysicalMotionConstraint } from "./IAutoMovieMeasurePhysicalMotionConstraint";
import type { IAutoMovieMotionGeometry } from "./IAutoMovieMotionGeometry";
import type { IAutoMoviePhysicalFrame } from "./IAutoMoviePhysicalFrame";
import type { IAutoMoviePhysicalProfile } from "./IAutoMoviePhysicalProfile";

/**
 * Observed body descriptions, independent acceptance policies, callbacks and
 * sampled motion failures.
 */
export namespace IAutoMovieMotionAudit {
  /**
   * One body acceptance policy paired with exactly one collision and joint
   * description.
   *
   * The union requires either a physical profile or geometry-only description
   * and excludes supplying both. AutoMovieMotionAudit reads the selected
   * description through motionAuditGeometry; frame body identity comes from the
   * inherited policy id. admitPhysicalMotionAudit validates the selected
   * representation before sampling; neither branch makes the audited poses a
   * simulation result.
   */
  export type IBody = IAutoMovieMotionAudit.IPolicy &
    (
      | {
          /**
           * Physical profile supplying collision shapes, materials and joint
           * limits; excluded when geometry is supplied.
           */
          profile: IAutoMoviePhysicalProfile;

          /**
           * Geometry-only collision and joint description; excluded when
           * profile is supplied.
           */
          geometry?: never;
        }
      | {
          /**
           * Geometry-only collision and joint description; excluded when
           * profile is supplied.
           */
          geometry: IAutoMovieMotionGeometry;

          /**
           * Physical profile supplying collision shapes, materials and joint
           * limits; excluded when geometry is supplied.
           */
          profile?: never;
        }
    );

  /**
   * Independent speed, support, penetration and joint acceptance limits for one
   * observed body.
   *
   * Speed limits are m/s, angular limits radians and geometric tolerances
   * metres; support windows use inclusive film seconds and world bone-origin
   * points. AutoMovieMotionAudit reads these limits independently of the
   * observed frame; absent speed entries are unbounded and absent constraints
   * add no extra checks. Admission requires finite nonnegative tolerances and
   * valid body-local references. Compression allowance is opt-in; inter-body
   * overlap uses the smaller of the two policies' tolerances.
   */
  export interface IPolicy {
    /** Scene id resolving in every sampled frame. */
    id: string;

    /** Per-segment maximum world speed, m/s. Missing entries mean unbounded. */
    speeds: Record<string, number>;

    /** Per-segment maximum drift while contact is promised, metres. */
    supports: {
      /**
       * Declared carrier bone whose world origin is checked, rather than an
       * inferred sole or surface point.
       */
      bone: string;

      /** Inclusive finite first film second for this fixed-point promise. */
      start: number;

      /** Inclusive finite last film second, at or after start. */
      end: number;

      /** Independent fixed world bone-origin location in metres. */
      point: IAutoMovieVector3;

      /** Finite nonnegative permitted Euclidean origin drift in metres. */
      tolerance: number;
    }[];

    /** Allowed floor penetration, metres, independently declared. */
    floorTolerance: number;

    /**
     * Opt this owner's compliant materials into floor and inter-body
     * compression allowance; pair allowances sum only opted-in sides. Defaults
     * to auditing the undeformed outer surface.
     */
    accountForCompression?: boolean;

    /** Allowed inter-body overlap, metres. */
    overlapTolerance: number;

    /** Maximum free/locked angular constraint error, radians. */
    jointTolerance: number;

    /**
     * Endpoint goals, support spread and bend limits from the same displayed
     * frames.
     */
    constraints?: IAutoMovieMeasurePhysicalMotionConstraint.IConstraint[];
  }

  /**
   * A sampled measurement outside its independently supplied motion acceptance
   * bound.
   *
   * Kind selects actual and limit units: m/s for speed, radians for angle or
   * joint, metres for all other kinds. AutoMovieMotionAudit allocates findings
   * in sample traversal order and labels the responsible segment, joint,
   * constraint or inter-body pair. Every violation is retained; the record
   * contains a measured value and the failed bound rather than a corrected pose
   * or a continuous-time guarantee.
   */
  export interface IFinding {
    /** Film second. */
    seconds: number;

    /** Owning scene body. */
    body: string;

    /** Owning segment or pair. */
    label: string;

    /** Measurement family. */
    kind:
      | "speed"
      | "support"
      | "floor"
      | "overlap"
      | "goal"
      | "distance"
      | "angle"
      | "joint";

    /**
     * Measured m/s for speed, radians for angle or joint, and metres for all
     * other kinds.
     */
    actual: number;

    /** Independently supplied acceptance bound in matching units. */
    limit: number;
  }

  /**
   * A finite-time motion audit driven by the same pose sampler used by its
   * consumer.
   *
   * Start and end are finite film seconds with end >= start; rate is positive
   * finite samples/s and floor is finite world Y in metres.
   * AutoMovieMotionAudit retains the preceding frame for speed differences
   * during the run. sample and allowed are synchronous callbacks whose
   * exceptions reject the promise. Admission validates policies and sampled
   * frame completeness; callers keep returned frames stable through the next
   * sample. Empty bodies are permitted and do not establish scene coverage.
   */
  export interface IInput {
    /** Audited scene bodies. */
    bodies: IAutoMovieMotionAudit.IBody[];

    /** Inclusive first film second. */
    start: number;

    /** Inclusive last film second. */
    end: number;

    /** Positive finite samples per second. */
    rate: number;

    /** World floor height in metres. */
    floor: number;

    /**
     * Return the displayed world frame at this film second. Supply a complete,
     * finite frame and keep it unchanged until the next callback finishes; the
     * audit retains the preceding frame for finite-difference speed. Exceptions
     * reject the run.
     */
    sample: (seconds: number) => IAutoMoviePhysicalFrame;

    /**
     * Return true to exempt an inter-body bone pair from overlap checking at
     * this film second. Body ids and bone ids identify shape owners; same-body
     * pairs are skipped without this callback. Exceptions reject the run.
     */
    allowed: (
      a: string,
      boneA: string,
      b: string,
      boneB: string,
      seconds: number,
    ) => boolean;
  }
}
