import { createAutoMovieRandom, deriveAutoMovieSeed } from "@automovie/engine";

import { ArchetypeRefusal } from "./ArchetypeRefusal";
import type { IArchetypeBand } from "./IArchetypeBand";

/**
 * How a producer turns its bands, its seed and the dimensions an author fixed into the value of every free dimension.
 *
 * Each dimension is drawn on its own counter-based stream, keyed by the seed, the producer's name and the dimension's name (the engine's Philox streams, `createAutoMovieRandom`), so the same parameters and seed give the same values bit for bit, a dimension's value does not depend on which others exist or in what order they are read, and two producers given one seed do not move together. A number seed and the text of that number are the same seed.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the stream's key, what it guarantees and how a number seed is read.
 * @evidence contracts/development/design.md#principled-representation Keyed draws by stable names, never by ordinals, the film's own seeding model (`deriveAutoMovieSeed`).
 * @evidence contracts/development/design.md#minimal-and-owned-surface Two functions: `dimensions`, which every producer calls once, and `choice`, for a kind read at run time.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts A fixed value outside its band is refused, never clamped, so the band is the only variation there is.
 */
export namespace ArchetypeDraw {
  /**
   * The value of every free dimension of one archetype.
   *
   * @param archetype The producer's name, which keys the streams and names refusals.
   * @param bands The band of each free dimension this variant has.
   * @param seed The seed; absent, every dimension takes the middle of its band.
   * @param fixed Dimensions the author fixed, each in its band's unit; an absent or undefined entry is drawn.
   * @param family The producer's bands for every variant, when it has several; a dimension fixed here that only another variant has is refused. Absent, such an entry is not looked at.
   * @returns One value per dimension that has a band, inside it; a total record when every dimension has one.
   * @throws {ArchetypeRefusal} When a fixed value is not finite or lies outside its band, giving the band, or fixes a dimension only another variant has, giving this variant's dimensions.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the seedless value, the fixed values and the refusal.
   * @evidence contracts/development/implementation.md#principled-implementation A uniform draw over the closed band from one 53-bit float per dimension; uniform because a cited band states limits, not a distribution, and it covers the band evenly over many seeds.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One loop over the bands: fixed, seedless or drawn.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No value is clamped or redrawn.
   * @evidence contracts/development/implementation.md#efficient-algorithms One hash and one Philox block per dimension.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Called once per produced archetype.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function dimensions<Dimension extends string>(
    archetype: string,
    bands: Readonly<Record<Dimension, IArchetypeBand>>,
    seed: number | string | undefined,
    fixed?: NoInfer<Partial<Record<Dimension, number | undefined>>>,
    family?: Readonly<
      Record<string, Readonly<Partial<Record<string, IArchetypeBand>>>>
    >,
  ): Record<Dimension, number>;
  export function dimensions<Dimension extends string>(
    archetype: string,
    bands: Readonly<Partial<Record<Dimension, IArchetypeBand>>>,
    seed: number | string | undefined,
    fixed?: NoInfer<Partial<Record<Dimension, number | undefined>>>,
    family?: Readonly<
      Record<string, Readonly<Partial<Record<string, IArchetypeBand>>>>
    >,
  ): Partial<Record<Dimension, number>>;
  export function dimensions<Dimension extends string>(
    archetype: string,
    bands: Readonly<Partial<Record<Dimension, IArchetypeBand>>>,
    seed: number | string | undefined,
    fixed: Partial<Record<Dimension, number | undefined>> = {},
    family: Readonly<
      Record<string, Readonly<Partial<Record<string, IArchetypeBand>>>>
    > = {},
  ): Partial<Record<Dimension, number>> {
    // A dimension another variant of the producer has, fixed on a variant that lacks it, is a request this variant cannot honour.
    const given: Readonly<Record<string, unknown>> = fixed;
    for (const variant of Object.values(family))
      for (const name of Object.keys(variant))
        if (given[name] !== undefined && !Object.hasOwn(bands, name))
          throw new ArchetypeRefusal({
            kind: "parameter",
            archetype,
            axis: name,
            value: given[name],
            feasible: { kind: "alternatives", values: Object.keys(bands) },
            reason: `${name} is not a dimension of this variant`,
            fix: `leave ${name} out, or choose the variant that has it`,
          });

    const root: string | null =
      seed === undefined
        ? null
        : deriveAutoMovieSeed(String(seed), "archetype", archetype);
    const values: Partial<Record<Dimension, number>> = {};
    for (const name of Object.keys(bands) as Dimension[]) {
      const band: IArchetypeBand | undefined = bands[name];
      if (band === undefined) continue;
      const given: number | undefined = fixed[name];
      if (given !== undefined) {
        if (
          !(
            Number.isFinite(given) &&
            given >= band.minimum &&
            given <= band.maximum
          )
        )
          throw new ArchetypeRefusal({
            kind: "parameter",
            archetype,
            axis: name,
            value: given,
            feasible: {
              kind: "range",
              minimum: band.minimum,
              maximum: band.maximum,
              unit: band.unit,
            },
            reason: `${name} of ${given} lies outside the band of ${band.source}`,
            fix: `set ${name} inside its band, or leave it out to draw it from the seed`,
          });
        values[name] = given;
      } else if (root === null)
        values[name] = (band.minimum + band.maximum) / 2;
      else
        values[name] =
          band.minimum +
          (band.maximum - band.minimum) *
            createAutoMovieRandom(deriveAutoMovieSeed(root, name)).float(0);
    }
    return values;
  }

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
