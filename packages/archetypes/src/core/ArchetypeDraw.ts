import { AutoMovieArchetypeRefusal } from "./AutoMovieArchetypeRefusal";

/**
 * The check a producer makes on a closed alternative it reads at run time, such
 * as its kind; every seeded draw goes through an
 * `AutoMovieArchetypeDrawSession`.
 */
export namespace ArchetypeDraw {
  /**
   * One of a producer's closed alternatives, refused with the alternatives when
   * it is not one of them.
   *
   * A parameter typed by a closed union is checked by the compiler; this is the
   * same check for a caller that passes text it read at run time.
   *
   * @param archetype The producer's name.
   * @param axis The parameter's name.
   * @param value The value given.
   * @param alternatives The accepted values.
   * @returns The value.
   * @throws {AutoMovieArchetypeRefusal} When the value is not one of the
   *   alternatives.
   */
  export function choice<Value extends string>(
    archetype: string,
    axis: string,
    value: Value,
    alternatives: readonly Value[],
  ): Value {
    if (alternatives.includes(value)) return value;
    throw new AutoMovieArchetypeRefusal({
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
