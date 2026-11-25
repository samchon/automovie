/** Whether a body's default tracking is withdrawn at one tick. */
export namespace IAutoMoviePhysicalTrackingWithdrawn {
  /**
   * Whether a body's default tracking is withdrawn at one tick.
   *
   * Tracking is withdrawn only when the effective body strength is zero and no
   * explicit per-joint protective strength stays positive; an explicit joint
   * keeps its own motor and therefore keeps the body under tracking.
   */
  export type ITarget = {
    /**
     * Effective body tracking fraction: authored strength times balance root
     * strength.
     */ strength: number;
    /** Explicit per-joint fractions declared by the target. */ jointStrength?: Readonly<
      Record<string, number>
    >;
  };
}
