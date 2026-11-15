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
 * @evidence contracts/development/design.md#minimal-and-owned-surface Four functions: `dimensions`, which every producer calls once; `choice`, for a kind read at run time; `pick`, for one of the catalogue models a producer read, given or drawn whole; and `model`, which picks one read model on a named axis and gives its figures, once per independent axis.
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
    return admit(archetype, axis, value, alternatives);
  }

  /**
   * One of a producer's closed alternatives, given or drawn from the seed: the read model a producer builds whole, among the catalogue models it read.
   *
   * A given value is checked as {@link choice} checks it. Absent, it is drawn uniformly from the alternatives on the axis's own counter-based stream, keyed by the seed, the producer's name and the axis as {@link dimensions} keys a dimension, so the draw is deterministic and independent of the producer's other draws; with no seed either, it is the first alternative, the producer's stated default.
   *
   * @param archetype The producer's name, which keys the stream and names refusals.
   * @param axis The parameter's name, which keys the stream.
   * @param value The value given, or undefined to draw one.
   * @param alternatives The accepted values, at least one, the default first.
   * @param seed The seed; absent, the first alternative.
   * @returns The value.
   * @throws {ArchetypeRefusal} When a given value is not one of the alternatives.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the given, drawn and seedless cases and the stream's key.
   * @evidence contracts/development/implementation.md#principled-implementation A uniform draw over a closed list from one 53-bit float on the stream `dimensions` would use for a dimension of the axis's name: uniform because a catalogue states which models exist, not how often each is met.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Given, seedless or drawn, in that order.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Nothing between two alternatives is ever produced; a value not listed is refused, never replaced by a default.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms One hash and one Philox block.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Called once per produced archetype.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function pick<Value extends string>(
    archetype: string,
    axis: string,
    value: Value | undefined,
    alternatives: readonly Value[],
    seed: number | string | undefined,
  ): Value {
    if (value !== undefined) return admit(archetype, axis, value, alternatives);
    if (seed === undefined) return alternatives[0]!;
    const root: string = deriveAutoMovieSeed(
      String(seed),
      "archetype",
      archetype,
    );
    const index: number = Math.floor(
      alternatives.length *
        createAutoMovieRandom(deriveAutoMovieSeed(root, axis)).float(0),
    );
    return alternatives[Math.min(index, alternatives.length - 1)]!;
  }

  /**
   * One read model on a named axis, given or picked whole, with its read figures: the step every producer that holds whole catalogue models takes, once per independent axis.
   *
   * The model is one of `models`' names, checked or picked as {@link pick} checks and picks them, on the axis's own keyed stream, so a producer that picks on several axes (a door's size and its lever, a rope's cable and its handles) never moves one axis's draws by adding another. The figures are the picked model's, by dimension, for the producer to lay over its drawn dimensions; the typing lets a model fill only the producer's own dimensions. A variant with no models on the axis has none: the name is undefined, the figures empty, and a model given is refused. A dependent axis, such as a door that must stay below the car it serves, passes only the models an earlier pick admits.
   *
   * @param archetype The producer's name, which keys the stream and names refusals.
   * @param axis The axis's name, which keys the stream and names refusals: `model` for a producer with one axis.
   * @param value The model given, or undefined to pick one.
   * @param models The variant's models on the axis by name, each with its read figures, the default first; absent or empty when it has none.
   * @param seed The seed; absent, the first model.
   * @returns The model's name, undefined when the variant has none on the axis, and its figures.
   * @throws {ArchetypeRefusal} When a given model is not one of the variant's, or the variant has none.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the axis's stream, what the figures are for, the variant without models and the dependent axis.
   * @evidence contracts/development/implementation.md#principled-implementation `pick` over the models' names, in their stated order, and the shared `admit` for a variant without models; no second validator.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure No models, then picked, then its figures.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Nothing between two models is produced; a model not listed is refused, never replaced by a default.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms One pick and one lookup.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The step every model-holding producer shares, written once.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function model<Name extends string, Dimension extends string>(
    archetype: string,
    axis: string,
    value: Name | undefined,
    models:
      | Readonly<Partial<Record<Name, Readonly<Partial<Record<Dimension, number>>>>>>
      | undefined,
    seed: number | string | undefined,
  ): { name: Name | undefined; figures: Readonly<Partial<Record<Dimension, number>>> } {
    const names: Name[] = models === undefined ? [] : (Object.keys(models) as Name[]);
    if (names.length === 0) {
      if (value !== undefined) admit(archetype, axis, value, names);
      // No figures: an empty record, which a generic Dimension cannot type-check as empty without being told.
      return { name: undefined, figures: {} as Readonly<Partial<Record<Dimension, number>>> };
    }
    const name: Name = pick(archetype, axis, value, names, seed);
    return { name, figures: models![name]! };
  }

  /**
   * A value checked against a closed list: the one validation `choice`, `pick` and `model` share.
   *
   * @param archetype The producer's name.
   * @param axis The parameter's name.
   * @param value The value given.
   * @param alternatives The accepted values.
   * @returns The value.
   * @throws {ArchetypeRefusal} When the value is not one of the alternatives.
   */
  function admit<Value extends string>(
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