import { ArchetypeRefusal } from "./ArchetypeRefusal";

/**
 * The check a producer makes on a closed alternative it reads at run time, such as its kind; every seeded draw goes through an `ArchetypeDrawSession`.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what it checks and where the draws went.
 * @evidence contracts/development/design.md#principled-representation Membership in a closed list, refused with the list.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One function, `choice`, which producers call for a kind and the session calls for a model's name.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts An unknown value is refused, never replaced by a default.
 */
export namespace ArchetypeDraw {
  /**
   * One of a producer's closed alternatives, refused with the alternatives when it is not one of them.
   *
   * A parameter typed by a closed union is checked by the compiler; this is the same check for a caller that passes text it read at run time.
   *
   * @param archetype The producer's name.
   * @param axis The parameter's name.
   * @param value The value given.
   * @param alternatives The accepted values.
   * @returns The value.
   * @throws {ArchetypeRefusal} When the value is not one of the alternatives.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States why a typed parameter is still checked.
   * @evidence contracts/development/implementation.md#principled-implementation Membership in the closed list.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One test, one refusal.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts An unknown value never falls back to a default variant.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms A scan of a few literals.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function choice<Value extends string>(
    archetype: string,
    axis: string,
    value: Value,
    alternatives: readonly Value[],
  ): Value {
    if (alternatives.includes(value)) return value;
    throw new ArchetypeRefusal({
      kind: "parameter",
      archetype,
      axis,
      value,
      feasible: { kind: "alternatives", values: alternatives },
      reason: `${axis} "${String(value)}" is not one this producer makes`,
      fix: `set ${axis} to one of the listed values`,
    });
  }
}
