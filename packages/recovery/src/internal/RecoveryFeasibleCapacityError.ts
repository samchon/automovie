/**
 * Valid camera population exceeds an explicitly admitted fit resource ceiling.
 * Only camera work admission constructs this error after safe bounds and gauge
 * validation. Scene orchestration catches its concrete class to roll back the
 * entire proposed transaction; unrelated numerical and callback errors escape.
 *
 * @evidence contracts/common.md#principled-implementation An Error subclass supplies a closed capacity discriminant without parsing arbitrary numerical error messages.
 * @evidence contracts/common.md#clear-and-simple-design Camera work admission owns construction and scene transaction handling owns rollback; the generic solver keeps its existing error contract.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Malformed inputs, gauge, arithmetic, charge and late metric-action failures are not instances of this class.
 * @evidence contracts/common.md#meaningful-documentation Defines the producer, exact capacity meanings and whole-transaction consumer boundary.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Construction performs fixed scalar assignments only.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Distinct errors retain their own stack and are never cached.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only fixed reason/message/stack fields survive until the catch drops the error; no geometry, factor or option is retained.
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
