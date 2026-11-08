import { IAutoMovieFormationSlot } from "./IAutoMovieFormationSlot";
import { IAutoMovieInstanceSlot } from "./IAutoMovieInstanceSlot";

/**
 * Deterministic geometry and compact-member helpers exposed to a shot source builder over borrowed current records.
 *
 * @evidence contracts/development/design.md#principled-representation createAutoMovieSourceOracle delegates ground and member answers to the same terrain and compiled-slot regeneration laws used by engine consumers; Euclidean distance uses the norm of the point difference.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Four methods provide source-local measurements without exposing a second scene builder or expanding compact populations into dense nodes.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Missing compiled population ids, including inherited object keys, refuse; no surface means explicit zero ground height, and borrowed records are not deep-frozen or copied into a hidden stale cache.
 * @evidence contracts/development/common.md#meaningful-documentation Defines meter-based distance and ground answers, compiled record ownership, exact slot regeneration and missing-id or range failure.
 */
export interface IAutoMovieSourceOracle {
  /**
   * Binary64 Euclidean distance in meters between finite world-space points. Extreme finite coordinates can overflow a difference or the final norm to infinity.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Computes Math.hypot of binary64 coordinate differences, the Euclidean norm; finite inputs and representable differences and result are caller premises for a finite answer, with ordinary rounding remaining.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One scalar answer exposes no geometry representation beyond its two explicit operands.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No actor id, scene state or expected distance is inferred; the helper does not independently admit non-finite point coordinates.
   * @evidence contracts/development/common.md#meaningful-documentation Defines finite world-meter operands, binary64 meter output and extreme-input overflow without implying independent numeric admission.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Signature only: this declaration has no body, so it carries no method of its own and each implementation answers for its own algorithm, structure and resources; the cost an implementation may incur is not constrained by this signature.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Signature only: this declaration has no body, so it carries no method of its own and each implementation answers for its own algorithm, structure and resources; it coordinates no work itself.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Signature only: this declaration has no body, so it carries no method of its own and each implementation answers for its own algorithm, structure and resources; it owns no state, handle or task.
   */
  distance(
    left: { x: number; y: number; z: number },
    right: { x: number; y: number; z: number },
  ): number;

  /**
   * World-meter height of the first containing world surface at the supplied XZ point, or zero when none contains it.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Delegates to worldGroundHeight over the current borrowed world surfaces so source placement uses the same containment and terrain interpolation as engine placement.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Returns only height for this helper; richer surface identity and walkability belong to explicit Engine geometry measurement.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Zero is the declared no-surface answer, not fabricated walkable terrain or an inferred ground mesh.
   * @evidence contracts/development/common.md#meaningful-documentation Defines XZ world-meter sampling, first-containing precedence, height units and no-surface zero.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Signature only: this declaration has no body, so it carries no method of its own and each implementation answers for its own algorithm, structure and resources; the cost an implementation may incur is not constrained by this signature.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Signature only: this declaration has no body, so it carries no method of its own and each implementation answers for its own algorithm, structure and resources; it coordinates no work itself.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Signature only: this declaration has no body, so it carries no method of its own and each implementation answers for its own algorithm, structure and resources; it owns no state, handle or task.
   */
  groundHeight(point: { x: number; z: number }): number;

  /**
   * Regenerate one compiled formation slot without expanding its population; missing ids or out-of-range indices throw RangeError.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Own-property lookup selects the compiled formation and compiledFormationSlot regenerates the exact terrain-aware member from its stable slot index.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One addressed member projection lets source ask placement without serializing or owning the whole anonymous population.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Design-only ids and inherited property names cannot substitute for compiled records, and invalid indices refuse rather than wrap or clamp.
   * @evidence contracts/development/common.md#meaningful-documentation Defines compiled population identity, zero-based exact slot regeneration and both RangeError conditions.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Signature only: this declaration has no body, so it carries no method of its own and each implementation answers for its own algorithm, structure and resources; the cost an implementation may incur is not constrained by this signature.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Signature only: this declaration has no body, so it carries no method of its own and each implementation answers for its own algorithm, structure and resources; it coordinates no work itself.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Signature only: this declaration has no body, so it carries no method of its own and each implementation answers for its own algorithm, structure and resources; it owns no state, handle or task.
   */
  formationSlot(formation: string, slot: number): IAutoMovieFormationSlot;

  /**
   * Regenerate one compiled general-instance slot without expanding its population; missing ids or out-of-range indices throw RangeError.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Own-property lookup selects the compiled set and instanceSlot applies its admitted layout, resolved route, prototype choices and seed-derived variation for the requested slot.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Returns one exact member under the compact set's shared law rather than exposing a per-instance data table to source.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Selection reads the compiled prototype table that already counts the default once; missing records and invalid slots cannot fall back to an authored design or arbitrary model.
   * @evidence contracts/development/common.md#meaningful-documentation Defines compiled set identity, exact addressed member and the missing-id and range refusals.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Signature only: this declaration has no body, so it carries no method of its own and each implementation answers for its own algorithm, structure and resources; the cost an implementation may incur is not constrained by this signature.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Signature only: this declaration has no body, so it carries no method of its own and each implementation answers for its own algorithm, structure and resources; it coordinates no work itself.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Signature only: this declaration has no body, so it carries no method of its own and each implementation answers for its own algorithm, structure and resources; it owns no state, handle or task.
   */
  instanceSlot(instanceSet: string, slot: number): IAutoMovieInstanceSlot;
}
