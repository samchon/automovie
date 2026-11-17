/**
 * Legal travel endpoints derived from an articulation's authored kind and limits.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Legal travel endpoints derived from an articulation's authored kind and limits. Nested contracts define the relevant units, ownership and failure states.
 * @evidence contracts/development/design.md#principled-representation The result encodes unbounded ends as null and finite travel in the articulation's degrees or metres.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Engine admission and posing share the per-kind range calculation.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Caller admission remains necessary because deriving endpoints does not validate kind or numeric inputs.
 */
export namespace IAutoMovieAffordanceTravelRange {
  /**
   * Fresh mutable inclusive interval from affordanceTravelRange. Rotary hinge/knob/crank/wheel coordinates use degrees; slider/button/pedal/trigger coordinates use metres. The producer assumes an admitted articulation and performs no kind, finiteness or bound-order admission.
   *
   * A wheel with travel spans minus travel through travel. A crank without travel is unbounded at both ends. Hinge/knob/slider use minus reverse when supplied, otherwise zero, as the lower endpoint; all remaining finite upper endpoints are travel or zero when absent.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States per-kind units, absent-limit defaults, null semantics and the admission premise.
   * @evidence contracts/development/design.md#principled-representation Nullable endpoints distinguish an unbounded crank from a zero-travel articulation; coordinate units are inherited from the affordance kind.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Coupling admission and pose/input resolution reuse one range calculation instead of independently interpreting travel and reverse.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts This interval carries no reversibility permission and is not a validation verdict for arbitrary affordance records.
   */
  export type IResult = {
    /** Inclusive lower travel in the articulation's unit; null only for an unbounded crank. */
    minimum: number | null;

    /** Inclusive upper travel in the articulation's unit; absent travel becomes zero except for the unbounded crank. */
    maximum: number | null;
  };
}
