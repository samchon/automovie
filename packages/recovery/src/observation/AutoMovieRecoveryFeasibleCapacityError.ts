/**
 * Valid camera population exceeds an explicitly admitted fit resource ceiling.
 * Only camera work admission constructs this error after safe bounds and gauge
 * validation. Scene orchestration catches its concrete class to roll back the
 * entire proposed transaction; unrelated numerical and callback errors escape.
 */
export class AutoMovieRecoveryFeasibleCapacityError extends Error {
  /** Create a fixed resource refusal after the camera owner's core admission. */
  public constructor(
    /** The valid bound exceeded by the current complete population. */
    public readonly reason: "resident" | "direction-entries" | "direction-work",
  ) {
    super(`camera-feasible-capacity: ${reason}`);
    this.name = "RecoveryFeasibleCapacityError";
  }
}
