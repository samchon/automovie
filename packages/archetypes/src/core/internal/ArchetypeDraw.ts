import { AutoMovieArchetypeRefusal } from "../AutoMovieArchetypeRefusal";

/**
 * The check a producer makes on a closed alternative it reads at run time, such
 * as its kind; every seeded draw goes through an
 * `AutoMovieArchetypeDrawSession`.
 */
export namespace ArchetypeDraw {
  /**
   * A saved value narrowed to the alternatives one variant makes.
   *
   * A saved record spans every variant of a producer family, so a value such as
   * a model is typed by the union of every variant's. The variant that is
   * selected declares its own alternatives; this returns the alternative the
   * value names, typed by them.
   *
   * @param archetype The producer's name.
   * @param axis The parameter's name.
   * @param value The saved value, or undefined when none was given.
   * @param alternatives The variant's own alternatives; none for a variant that
   *   has none.
   * @returns The matching alternative, or undefined when no value was given.
   * @throws {AutoMovieArchetypeRefusal} When a value is given that is not one of
   *   the alternatives.
   */
  export function admit<Value extends string, Narrow extends Value>(
    archetype: string,
    axis: string,
    value: Value | undefined,
    alternatives: readonly Narrow[],
  ): Narrow | undefined {
    if (value === undefined) return undefined;
    const found: Narrow | undefined = alternatives.find(
      (alternative: Narrow): boolean => alternative === value,
    );
    if (found !== undefined) return found;
    throw new AutoMovieArchetypeRefusal({
      kind: "parameter",
      archetype,
      axis,
      value,
      feasible: { kind: "alternatives", values: alternatives },
      reason: `${axis} "${value}" is not one this variant makes`,
      fix: `set ${axis} to one of the listed values`,
    });
  }

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
