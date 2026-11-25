import { createAutoMovieRandom, deriveAutoMovieSeed } from "@automovie/engine";

import { ArchetypeDraw } from "./ArchetypeDraw";
import type { AutoMovieArchetypeBandUnit } from "./AutoMovieArchetypeBandUnit";
import { AutoMovieArchetypeRefusal } from "./AutoMovieArchetypeRefusal";
import type { IAutoMovieArchetypeBand } from "./IAutoMovieArchetypeBand";

/**
 * One producer's draws for one archetype: the dimensions it draws from its
 * bands and the read models it picks, with where each value came from.
 *
 * A producer opens one session with its name, the unit of each of its
 * dimensions, the seed and the dimensions the author fixed, and makes every
 * draw through it; the builder takes the session and the archetype keeps its
 * record. The values and their provenance are written by the same call, so the
 * band a dimension was drawn in and the model a figure came from can never
 * disagree with the value the archetype carries.
 *
 * Each dimension is drawn on its own counter-based stream, keyed by the seed,
 * the producer's name and the dimension's name (the engine's Philox streams,
 * `createAutoMovieRandom`), so the same parameters and seed give the same
 * values bit for bit, a dimension's value does not depend on which others exist
 * or in what order they are read, and two producers given one seed do not move
 * together. A model is picked on its axis's stream, keyed the same way by the
 * axis's name, so adding an axis never moves another's draws. A number seed and
 * the text of that number are the same seed.
 *
 * @template Dimension The producer's dimensions, a closed union it declares.
 */
export class AutoMovieArchetypeDrawSession<Dimension extends string> {
  /** The producer's name, which keys the streams and names refusals. */
  public readonly archetype: string;

  /**
   * Each dimension's unit, which a drawn band and a picked model's figure
   * share.
   */
  readonly #units: Readonly<
    Record<Dimension, AutoMovieArchetypeDrawSession.Unit>
  >;

  /** The seed's root for this producer; null without a seed. */
  readonly #root: string | null;

  /** The dimensions the author fixed. */
  readonly #fixed: Readonly<Partial<Record<Dimension, number | undefined>>>;

  /** Every value drawn or picked so far, by dimension. */
  readonly #values: Partial<Record<Dimension, number>> = {};

  /** The band each drawn value was drawn in, by dimension. */
  readonly #bands: Partial<Record<Dimension, IAutoMovieArchetypeBand>> = {};

  /** The model picked on each axis, by axis. */
  readonly #models: Record<string, string> = {};

  /** The axis whose model gave each figure, by dimension. */
  readonly #figures: Partial<Record<Dimension, string>> = {};

  /** The unit of each value given so far, by dimension. */
  readonly #given: Partial<
    Record<Dimension, AutoMovieArchetypeDrawSession.Unit>
  > = {};

  /**
   * A session with nothing drawn yet.
   *
   * @param archetype The producer's name, which keys the streams and names
   *   refusals.
   * @param units Each dimension's unit, declared once by the producer: the unit
   *   of the dimension, whether a band draws it or a model gives it.
   * @param seed The seed; absent, every dimension takes the middle of its band
   *   and every axis its first model.
   * @param fixed Dimensions the author fixed, each in its band's unit; an
   *   absent or undefined entry is drawn. Members that are not dimensions, such
   *   as a model's name or the id, are not looked at.
   */
  public constructor(
    archetype: string,
    units: Readonly<Record<Dimension, AutoMovieArchetypeDrawSession.Unit>>,
    seed: number | undefined,
    fixed: NoInfer<Partial<Record<Dimension, number | undefined>>> = {},
  ) {
    this.archetype = archetype;
    this.#units = units;
    this.#root =
      seed === undefined
        ? null
        : deriveAutoMovieSeed(String(seed), "archetype", archetype);
    this.#fixed = fixed;
  }

  /**
   * Every value drawn or picked so far, by dimension: what the archetype
   * records as its dimensions.
   */
  public get values(): Readonly<Partial<Record<Dimension, number>>> {
    return { ...this.#values };
  }

  /**
   * Where each value came from: the band of each drawn dimension, the model
   * picked on each axis, and the axis whose model gave each figure.
   */
  public get provenance(): AutoMovieArchetypeDrawSession.IProvenance<Dimension> {
    return {
      bands: { ...this.#bands },
      models: { ...this.#models },
      figures: { ...this.#figures },
      units: { ...this.#given },
    };
  }

  /**
   * The value of every free dimension a variant has, when every dimension it
   * draws has a band: a total record, as the implementation below documents.
   */
  public dimensions<Drawn extends Dimension>(
    bands: Readonly<Record<Drawn, IAutoMovieArchetypeBand>>,
    family?: Readonly<
      Record<string, Readonly<Partial<Record<string, IAutoMovieArchetypeBand>>>>
    >,
  ): Record<Drawn, number>;

  /**
   * The value of every free dimension a variant has, when some dimension may
   * lack a band: a partial record, as the implementation below documents.
   */
  public dimensions<Drawn extends Dimension>(
    bands: Readonly<Partial<Record<Drawn, IAutoMovieArchetypeBand>>>,
    family?: Readonly<
      Record<string, Readonly<Partial<Record<string, IAutoMovieArchetypeBand>>>>
    >,
  ): Partial<Record<Drawn, number>>;

  /**
   * The value of every free dimension a variant has, each recorded with its
   * band.
   *
   * @param bands The band of each free dimension this variant has.
   * @param family The producer's bands for every variant, when it has several;
   *   a dimension fixed here that only another variant has is refused. Absent,
   *   such an entry is not looked at.
   * @returns One value per dimension that has a band, inside it; a total record
   *   when every dimension has one. A dimension a picked model already gave
   *   keeps the model's figure in the record, as the producer lays the figures
   *   over its draws.
   * @throws {AutoMovieArchetypeRefusal} When a fixed value is not finite or
   *   lies outside its band, giving the band, or fixes a dimension only another
   *   variant has, giving this variant's dimensions.
   * @throws {Error} When a band's unit is not its dimension's declared unit, a
   *   producer's defect.
   */
  public dimensions<Drawn extends Dimension>(
    bands: Readonly<Partial<Record<Drawn, IAutoMovieArchetypeBand>>>,
    family: Readonly<
      Record<string, Readonly<Partial<Record<string, IAutoMovieArchetypeBand>>>>
    > = {},
  ): Partial<Record<Drawn, number>> {
    // A dimension another variant of the producer has, fixed on a variant that lacks it, is a request this variant cannot honour.
    const given: Readonly<Record<string, unknown>> = this.#fixed;
    for (const variant of Object.values(family))
      for (const name of Object.keys(variant))
        if (given[name] !== undefined && !Object.hasOwn(bands, name))
          throw new AutoMovieArchetypeRefusal({
            kind: "parameter",
            archetype: this.archetype,
            axis: name,
            value: given[name],
            feasible: { kind: "alternatives", values: Object.keys(bands) },
            reason: `${name} is not a dimension of this variant`,
            fix: `leave ${name} out, or choose the variant that has it`,
          });

    const values: Partial<Record<Drawn, number>> = {};
    for (const name in bands) {
      const band: IAutoMovieArchetypeBand | undefined = bands[name];
      if (band === undefined) continue;
      if (band.unit !== this.#units[name])
        throw new Error(
          `Archetype ${this.archetype} draws ${name} in "${band.unit}", but declares it in "${this.#units[name]}"`,
        );
      const fixed: number | undefined = this.#fixed[name];
      if (fixed !== undefined) {
        if (!(fixed >= band.minimum && fixed <= band.maximum))
          throw new AutoMovieArchetypeRefusal({
            kind: "parameter",
            archetype: this.archetype,
            axis: name,
            value: fixed,
            feasible: {
              kind: "range",
              minimum: band.minimum,
              maximum: band.maximum,
              unit: band.unit,
            },
            reason: `${name} of ${fixed} lies outside the band of ${band.source}`,
            fix: `set ${name} inside its band, or leave it out to draw it from the seed`,
          });
        values[name] = fixed;
      } else if (this.#root === null)
        values[name] = (band.minimum + band.maximum) / 2;
      else
        values[name] =
          band.minimum +
          (band.maximum - band.minimum) *
            createAutoMovieRandom(deriveAutoMovieSeed(this.#root, name)).float(
              0,
            );
      // A model's figure is the producer's word over a band's draw, whichever came first.
      if (Object.hasOwn(this.#figures, name)) continue;
      this.#values[name] = values[name];
      this.#bands[name] = band;
      this.#given[name] = band.unit;
    }
    return values;
  }

  /**
   * A value that follows from the others by the producer's own rule, such as a
   * heart girth from a height, recorded with its dimension's unit and with no
   * band and no model, since it was neither drawn nor picked.
   *
   * @param dimension The dimension.
   * @param value Its value, in the dimension's unit.
   * @returns The value.
   */
  public derive(dimension: Dimension, value: number): number {
    const unit: AutoMovieArchetypeDrawSession.Unit = this.#units[dimension];
    this.#values[dimension] = value;
    this.#given[dimension] = unit;
    return value;
  }
  /**
   * One read model on a named axis, given or picked whole, with its read
   * figures, the figures and the model's name recorded.
   *
   * A given model is checked against the models' names. Absent, one is drawn
   * uniformly from them on the axis's own stream; with no seed either, it is
   * the first, the producer's stated default. The figures are the picked
   * model's, by dimension, for the producer to lay over its drawn dimensions. A
   * variant with no models on the axis has none: the name is undefined, the
   * figures empty, and a model given is refused. A dependent axis, such as a
   * door that must stay below the car it serves, passes only the models an
   * earlier pick admits. A figure is the model's own, so an author who fixed
   * that dimension is refused, never overridden in silence: the author names
   * the model instead. A dimension the model lacks stays the producer's to draw
   * from its band.
   *
   * @param axis The axis's name, which keys the stream, names refusals and keys
   *   the record: `model` for a producer with one axis.
   * @param value The model given, or undefined to pick one.
   * @param models The variant's models on the axis by name, each with its read
   *   figures, the default first; absent or empty when it has none.
   * @returns The model's name, undefined when the variant has none on the axis,
   *   and its figures.
   * @throws {AutoMovieArchetypeRefusal} When a given model is not one of the
   *   variant's, or the variant has none, or a fixed dimension is one of the
   *   model's figures.
   */
  public model<Name extends string>(
    axis: string,
    value: Name | undefined,
    models:
      | Readonly<
          Partial<Record<Name, Readonly<Partial<Record<Dimension, number>>>>>
        >
      | undefined,
  ): AutoMovieArchetypeDrawSession.IModel<Name, Dimension> {
    const names: Name[] = [];
    if (models !== undefined) for (const named in models) names.push(named);
    if (names.length === 0) {
      if (value !== undefined)
        ArchetypeDraw.choice(this.archetype, axis, value, names);
      // No figures: an empty record, which a generic Dimension cannot type-check as empty without being told.
      const none: Partial<Record<Dimension, number>> = {};
      return { name: undefined, figures: none };
    }
    const name: Name =
      value !== undefined
        ? ArchetypeDraw.choice(this.archetype, axis, value, names)
        : this.#root === null
          ? names[0]!
          : names[
              Math.min(
                Math.floor(
                  names.length *
                    createAutoMovieRandom(
                      deriveAutoMovieSeed(this.#root, axis),
                    ).float(0),
                ),
                names.length - 1,
              )
            ]!;
    const figures: Readonly<Partial<Record<Dimension, number>>> =
      models![name]!;
    for (const dimension in figures)
      if (this.#fixed[dimension] !== undefined)
        throw new AutoMovieArchetypeRefusal({
          kind: "parameter",
          archetype: this.archetype,
          axis: dimension,
          value: this.#fixed[dimension],
          feasible: { kind: "alternatives", values: names },
          reason: `${dimension} is the ${axis} ${name}'s own figure, ${figures[dimension]}`,
          fix: `leave ${dimension} out, and give the ${axis} whose ${dimension} you want`,
        });
    for (const dimension in figures) {
      const unit: AutoMovieArchetypeDrawSession.Unit = this.#units[dimension];
      this.#values[dimension] = figures[dimension];
      this.#figures[dimension] = axis;
      this.#given[dimension] = unit;
      // A band drawn before the pick no longer stands behind this value, so the record names no band for it.
      delete this.#bands[dimension];
    }
    this.#models[axis] = name;
    return { name, figures };
  }
}

/** Companion types of {@link AutoMovieArchetypeDrawSession}. */
export namespace AutoMovieArchetypeDrawSession {
  /** A dimension's unit, the band's unit type (`AutoMovieArchetypeBandUnit`). */
  export type Unit = AutoMovieArchetypeBandUnit;

  /**
   * Where an archetype's values came from: the band of each drawn dimension,
   * the model picked on each axis, the axis whose model gave each figure, and
   * every value's unit; a figure has no band.
   */
  export interface IProvenance<Dimension extends string> {
    /** The band each drawn dimension was drawn in, by dimension. */
    bands: Readonly<Partial<Record<Dimension, IAutoMovieArchetypeBand>>>;

    /** The model picked on each axis, by axis, such as `{ size: "175cm" }`. */
    models: Readonly<Record<string, string>>;

    /**
     * The axis whose picked model gave each figure, by dimension, such as `{
     * length: "size" }`.
     */
    figures: Readonly<Partial<Record<Dimension, string>>>;

    /** The unit of each value, drawn or given, by dimension. */
    units: Readonly<Partial<Record<Dimension, Unit>>>;
  }

  /**
   * One axis's pick: the model's name, undefined when the variant has none on
   * the axis, and its read figures.
   */
  export interface IModel<Name extends string, Dimension extends string> {
    /** The model's name; undefined when the variant has no models on the axis. */
    name: Name | undefined;

    /** The model's read figures, by dimension; empty when it has none. */
    figures: Readonly<Partial<Record<Dimension, number>>>;
  }
}
