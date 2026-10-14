import type { IAutoMovieHumanConstructionClearanceReading } from "../structures/IAutoMovieHumanConstructionClearanceReading";
import type { IAutoMovieHumanConstructionPartReading } from "../structures/IAutoMovieHumanConstructionPartReading";

/** One unchanged admission condition deferred until its geometry is assembled.
 *
 *
 * @evidence contracts/common.md#principled-implementation Names one captured construction owner and its original assertion, optional relation readings and part census; admitHumanConstruction invokes those callbacks in order.
 * @evidence contracts/common.md#clear-and-simple-design Ordinary publication can use assertions alone while inspection receives actual readings from the same geometry owner.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A supplied reader must report the relations refused by the original assertion rather than replace it with an inspection-only condition.
 * @evidence contracts/common.md#meaningful-documentation Documents captured-geometry identity and how optional readings, census and refusal-owner labels differ.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Callback signatures choose no measuring algorithm; each captured construction owner implements its check.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The interface coordinates no execution cache; admitHumanConstruction invokes current callbacks.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Captured geometry belongs to the closure creator; this callback declaration owns no lifetime manager.
 *
 *
 * @author Samchon
 */
export interface IHumanConstructionCheck {
  /** Responsibility named in a construction's refusal report. */
  owner: string;

  /**
   * Execute the original condition on the captured construction; refusal throws.
   *
   * @evidence contracts/common.md#principled-implementation The callback asserts its owner's actual captured geometry; admitHumanConstruction records a thrown cause rather than changing the condition.
   * @evidence contracts/common.md#clear-and-simple-design Assertion is separate from optional report extraction so ordinary publication needs no census allocation.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Inspection and ordinary building must call this same original assertion rather than a permissive inspection substitute.
   * @evidence contracts/common.md#meaningful-documentation States captured-geometry ownership and throwing refusal semantics.
   * @evidenceExclude contracts/performance.md#efficient-algorithms The signature chooses no algorithm; the captured geometry owner implements and bounds its assertion.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work This declaration coordinates no requests; admission executes the supplied callback for the current construction.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The signature acquires no state; its creator owns the captured geometry's lifetime.
   */
  assert: () => void;

  /**
   * Return all measured relations, including refused ones, from the same geometry.
   * The original assertion refuses exactly the relations this reader reports.
   *
   * @evidence contracts/common.md#principled-implementation Supplies actual clearance readings from the assertion's captured construction; a throwing reader becomes an explicit owner refusal.
   * @evidence contracts/common.md#clear-and-simple-design Optional extraction supports inspection without changing the assertion or making ordinary publication allocate measurement reports.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Refused relations remain visible; the callback cannot replace their original assertion with a report-only pass.
   * @evidence contracts/common.md#meaningful-documentation Explains omission, all-relation scope and agreement with asserted refusal.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This reader signature chooses no measuring algorithm; the actual owner implements its traversal.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work The signature defines no cache or execution sharing across changed constructions.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Report arrays and captured geometry are owned by the callback producer and admission caller, not this declaration.
   */
  read?: () => IAutoMovieHumanConstructionClearanceReading[];

  /**
   * Return the actual constructed parts this condition owner answers for.
   * Omission contributes no part census; it does not invent an empty geometry.
   *
   * @evidence contracts/common.md#principled-implementation Names actual constructed-part readings under this check owner; admission appends them after assertion and relation reading.
   * @evidence contracts/common.md#clear-and-simple-design Optional census extraction keeps part responsibility separate from clearance measurements and verdict collection.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts A missing callback contributes no fabricated parts, and a census failure is retained as an actual owner refusal.
   * @evidence contracts/common.md#meaningful-documentation Defines actual-part ownership and the meaning of callback absence.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This census signature implements no enumeration algorithm; its construction owner supplies the actual readings.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work No cached census or request coordination is specified by this callback declaration.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The declaration opens no resource; the callback creator and returned-report caller own their populations.
   */
  census?: () => IAutoMovieHumanConstructionPartReading[];
}
