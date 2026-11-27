import type {
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

/**
 * A trajectory reached its existing time-resolution guard, with its last
 * rejection. The airborne wrapper consumes this numeric context to explain its
 * physical history and target at the failed probe. Foreign model errors keep
 * their own identity and are never converted to this type.
 */
export class MotionTrajectoryFailure extends Error {
  /**
   * Keep the resolution refusal and numeric record; a supplied scope must be a
   * symbol.
   */
  public constructor(
    /**
     * Start of the interval rejected by the existing time-resolution guard,
     * seconds.
     */
    public readonly time: number,
    /**
     * Next attempted step caught by that guard, including its roundoff margin,
     * seconds.
     */
    public readonly step: number,
    /**
     * Last rejection since the preceding accepted step; absent before any
     * rejection.
     */
    public readonly rejection?: {
      /**
       * The rejected trial's duration before the controller reduced it,
       * seconds.
       */
      step: number;
      /** RMS or explicit-block estimate before dense physical admission. */
      rms: number;
      /** Sampled normalized physical defect, absent when not evaluated. */
      physical?: number;
      /** Which admission condition rejected this trial. */
      kind: "rms" | "numeric-dense" | "physical";
      /** Actual first-stage angular RHS reading, absent without orientation. */
      start?: IEndpoint;
      /** Actual final-stage angular RHS reading, absent without orientation. */
      end?: IEndpoint;
      /** The first failed physical probe, copied only on rejection. */
      probe?: {
        /** Actual film second passed to the physical callback. */
        time: number;
        /** Owned dense orientation at that second. */
        q: IAutoMovieQuaternion;
        /** Owned dense body angular velocity, rad/s. */
        w: IAutoMovieVector3;
        /** The callback's unchanged normalized defect. */
        error: number;
      };
    },
    /**
     * Optional operation token; only that caller may enrich this numeric
     * failure.
     */
    public readonly scope?: symbol,
  ) {
    super(
      `integrateMotionTrajectory: the step shrank below the resolution of ${time} s` +
        (rejection === undefined
          ? ""
          : `; last rejection ${rejection.kind}, h ${rejection.step} s, RMS ${rejection.rms}, physical ${rejection.physical}, probe ${rejection.probe?.time} s`),
    );
    this.name = "MotionTrajectoryFailure";
  }
}

/** An actual angular RHS reading at a rejected trial's endpoint. */
interface IEndpoint {
  /** Owned quaternion supplied to the RHS, before any later knot normalization. */
  q: IAutoMovieQuaternion;
  /** Owned body angular rate returned for that quaternion, rad/s. */
  w: IAutoMovieVector3;
}
