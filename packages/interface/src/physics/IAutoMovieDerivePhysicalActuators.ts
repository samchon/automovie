/**
 * Control assumptions for deriving joint gains and caps from neutral downstream
 * mass and inertia.
 */
export namespace IAutoMovieDerivePhysicalActuators {
  /**
   * Declared control assumptions used to size neutral downstream-load joint
   * actuators.
   *
   * Frequency is angular frequency in rad/s, dampingRatio is dimensionless,
   * torquePerKg is N m/kg and passiveRate is inverse seconds.
   * derivePhysicalActuators computes stiffness as reference inertia times
   * frequency squared, damping as twice dampingRatio times inertia times
   * frequency, and caps as downstream mass times torquePerKg. The producer
   * rejects nonfinite values, nonpositive frequency or torquePerKg, and
   * negative dampingRatio or passiveRate; omitted passiveRate is zero. These
   * are policy assumptions rather than measured muscle strengths.
   */
  export type IOptions = {
    /**
     * Positive finite natural angular frequency, rad/s; used directly in I
     * times frequency squared without a 2 pi conversion.
     */
    frequency: number;

    /** Finite nonnegative dimensionless damping ratio in the active PD gain. */
    dampingRatio: number;

    /**
     * Positive finite joint torque cap per kilogram of the neutral downstream
     * subtree, N m/kg.
     */
    torquePerKg: number;

    /**
     * Finite nonnegative passive angular damping rate, 1/s; omitted means zero.
     * Multiplies directional inertia without choosing a rest angle.
     */
    passiveRate?: number;
  };
}
