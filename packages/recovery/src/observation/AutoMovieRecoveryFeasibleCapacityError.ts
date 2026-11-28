/**
 * Identifies a bounded camera fit whose valid population exceeds its admitted
 * resident entries, direction entries or direction work. Scene orchestration
 * uses this receipt to preserve the previously qualified camera component.
 */
export class AutoMovieRecoveryFeasibleCapacityError extends Error {
  /** Create a capacity refusal for the already admitted working population. */
  public constructor(
    /** The resident or direction resource whose capacity was exceeded. */
    public readonly reason: "resident" | "direction-entries" | "direction-work",
  ) {
    super(`camera-feasible-capacity: ${reason}`);
    this.name = "RecoveryFeasibleCapacityError";
  }
}
