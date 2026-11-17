/**
 * Valid camera population exceeds an explicitly admitted fit resource ceiling.
 * Only camera work admission constructs this error after safe bounds and gauge
 * validation. Scene orchestration catches its concrete class to roll back the
 * entire proposed transaction; unrelated numerical and callback errors escape.
 *
 * @evidence contracts/development/design.md#principled-representation An Error subclass supplies a closed capacity discriminant without parsing arbitrary numerical error messages.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Camera work admission owns construction and scene transaction handling owns rollback; the generic solver keeps its existing error contract.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Malformed inputs, gauge, arithmetic, charge and late metric-action failures are not instances of this class.
 * @evidence contracts/development/common.md#meaningful-documentation Defines the producer, exact capacity meanings and whole-transaction consumer boundary.
 */
export class RecoveryFeasibleCapacityError extends Error {
  /** Create a fixed resource refusal after the camera owner's core admission. */
  public constructor(
    /** The valid bound exceeded by the current complete population. */
    public readonly reason: "resident" | "direction-entries" | "direction-work",
  ) {
    super(`camera-feasible-capacity: ${reason}`);
    this.name = "RecoveryFeasibleCapacityError";
  }
}
