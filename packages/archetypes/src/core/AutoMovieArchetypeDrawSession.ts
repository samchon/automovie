import { AutoMovieEngineRandom } from "@automovie/engine";


import { ArchetypeDraw } from "./internal/ArchetypeDraw";
import type { AutoMovieArchetypeBandUnit } from "./AutoMovieArchetypeBandUnit";
import { AutoMovieArchetypeRefusal } from "./AutoMovieArchetypeRefusal";
import type { IAutoMovieArchetypeBand } from "./IAutoMovieArchetypeBand";
import { ownArchetypeRecordKeys } from "./internal/ownArchetypeRecordKeys";

/**
 * Collects a producer's band values, selected catalogue entries and derived dimensions.
 *
 * The seed text and producer name identify each session stream. A dimension
 * or catalogue axis has its own stream, so drawing a different dimension
 * does not advance it. An unseeded session uses each band's midpoint and
 * each catalogue's first available entry.
 *
 * @template Dimension The producer's dimension names.
 */
export class AutoMovieArchetypeDrawSession<Dimension extends string> {
  /** Producer name used to key seeded draws and report structured refusals. */
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
   * Open a draw session with an empty value and provenance record.
   *
   * @param archetype Producer name for random streams and refusals.
   * @param units Unit of every available dimension, shared by bands and
   *   catalogue figures.
   * @param seed Numeric seed for independent draws. Pass `undefined` for
   *   band midpoints and the first catalogue entries.
   * @param fixed Optional finite author values in the producer's units.
   *   An absent or undefined value is drawn from the selected band.
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
        : AutoMovieEngineRandom.deriveSeed(String(seed), "archetype", archetype);
    this.#fixed = fixed;
  }

  /**
   * Snapshot of recorded scalar dimensions, in the units declared by the producer.
   */
  public get values(): Readonly<Partial<Record<Dimension, number>>> {
    return { ...this.#values };
  }

  /**
   * Snapshot of the admitted bands, selected models, figure sources and units of recorded dimensions.
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
   * Read every dimension in a complete band map.
   *
   * @param bands Band for every dimension in the result.
   * @param family Optional bands by variant, used to detect fixed fields
   *   that belong only to a different variant.
   * @returns A value for each supplied band.
   */
  public dimensions<Drawn extends Dimension>(
    bands: Readonly<Record<Drawn, IAutoMovieArchetypeBand>>,
    family?: Readonly<
      Record<string, Readonly<Partial<Record<string, IAutoMovieArchetypeBand>>>>
    >,
  ): Record<Drawn, number>;

  /**
   * Read the supported dimensions in a partial band map.
   *
   * @param bands Bands to draw. Entries without a band are omitted.
   * @param family Optional bands by variant for validating fixed fields.
   * @returns Values keyed by the dimensions with supplied bands.
   */
  public dimensions<Drawn extends Dimension>(
    bands: Readonly<Partial<Record<Drawn, IAutoMovieArchetypeBand>>>,
    family?: Readonly<
      Record<string, Readonly<Partial<Record<string, IAutoMovieArchetypeBand>>>>
    >,
  ): Partial<Record<Drawn, number>>;

  /**
   * Resolve applicable fixed values and draw the remaining band values.
   *
   * A fixed value must be a finite number inside its band. The seed fixes
   * the draw for that dimension. An unseeded draw uses the midpoint.
   * Catalogue figures already recorded in the session retain their provenance
   * and take precedence in the session's values.
   *
   * @param bands Applicable band per dimension for this variant.
   * @param family Optional variant band maps for recognizing fixed settings
   *   intended for another variant.
   * @returns The band values, keyed by dimensions with supplied bands.
   * @throws {AutoMovieArchetypeRefusal} If an author value is incompatible
   *   with its band or belongs only to a different variant.
   * @throws {Error} If a band's unit differs from the dimension declaration.
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
    for (const name of ownArchetypeRecordKeys(bands)) {
      const band: IAutoMovieArchetypeBand | undefined = bands[name];
      if (band === undefined) continue;
      if (band.unit !== this.#units[name])
        throw new Error(
          `Archetype ${this.archetype} draws ${name} in "${band.unit}", but declares it in "${this.#units[name]}"`,
        );
      const fixed: number | undefined = this.#fixed[name];
      if (fixed !== undefined) {
        const finite: boolean = Number.isFinite(fixed);
        if (!(finite && fixed >= band.minimum && fixed <= band.maximum))
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
            reason: finite
              ? `${name} of ${fixed} lies outside the band of ${band.source}`
              : `${name} requires a finite number in the band of ${band.source}`,
            fix: `set ${name} inside its band, or leave it out to draw it from the seed`,
          });
        values[name] = fixed;
      } else if (this.#root === null) {
        const sum: number = band.minimum + band.maximum;
        values[name] =
          Math.abs(sum) < Infinity
            ? sum / 2
            : band.minimum / 2 + band.maximum / 2;
      } else {
        const width: number = band.maximum - band.minimum;
        const share: number = AutoMovieEngineRandom.createRandom(
          AutoMovieEngineRandom.deriveSeed(this.#root, name),
        ).float(0);
        // If the interval spans zero and its width overflows, the two
        // weighted endpoints remain finite and their sum cannot overflow.
        values[name] =
          width < Infinity
            ? band.minimum + width * share
            : band.minimum * (1 - share) + band.maximum * share;
      }
      // A model's figure is the producer's word over a band's draw, whichever came first.
      if (Object.hasOwn(this.#figures, name)) continue;
      this.#values[name] = values[name];
      this.#bands[name] = band;
      this.#given[name] = band.unit;
    }
    return values;
  }

  /**
   * Record a producer-computed value in its declared unit.
   *
   * A derived value replaces that dimension's recorded band or catalogue
   * figure source. The independent catalogue selection stays recorded.
   *
   * @param dimension Producer dimension receiving the result.
   * @param value Computed value in the dimension's unit.
   * @returns The recorded value.
   */
  public derive(dimension: Dimension, value: number): number {
    const unit: AutoMovieArchetypeDrawSession.Unit = this.#units[dimension];
    this.#values[dimension] = value;
    this.#given[dimension] = unit;
    delete this.#bands[dimension];
    delete this.#figures[dimension];
    return value;
  }
  /**
   * Select and record a whole catalogue entry on one axis.
   *
   * An explicit name selects that entry. An omitted name draws from the
   * remaining entries, using the first entry without a seed. A catalogue
   * figure takes precedence over the session's band value for its dimension.
   *
   * @param axis Name of the selection, such as `model` or `size`.
   * @param value Explicit entry name, or `undefined` to select one.
   * @param models Available entries and their figures by dimension. For a
   *   dependent selection, supply only entries admitted by the earlier choice.
   * @returns The name and figures, or an undefined name and empty figures
   *   for an empty selection.
   * @throws {AutoMovieArchetypeRefusal} If an explicit name is unavailable
   *   or the author fixed a dimension owned by the selected entry.
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
    const names: Name[] =
      models === undefined ? [] : ownArchetypeRecordKeys(models);
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
                    AutoMovieEngineRandom.createRandom(
                      AutoMovieEngineRandom.deriveSeed(this.#root, axis),
                    ).float(0),
                ),
                names.length - 1,
              )
            ]!;
    const figures: Readonly<Partial<Record<Dimension, number>>> =
      models![name]!;
    const dimensions: Dimension[] = ownArchetypeRecordKeys(figures);
    for (const dimension of dimensions)
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
    for (const dimension of dimensions) {
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

/** Units, catalogue choices and provenance records from a draw session. */
export namespace AutoMovieArchetypeDrawSession {
  /**
   * Unit shared by an authored bound, a sampled value and its recorded provenance.
   */
  export type Unit = AutoMovieArchetypeBandUnit;

  /**
   * Associates recorded dimensions with their bands, catalogue axes and units.
   */
  export interface IProvenance<Dimension extends string> {
    /**
     * Admitted bands keyed by dimensions whose recorded values came from a band.
     */
    bands: Readonly<Partial<Record<Dimension, IAutoMovieArchetypeBand>>>;

    /**
     * Selected catalogue names keyed by selection axis, such as `{ size: "175cm" }`.
     */
    models: Readonly<Record<string, string>>;

    /**
     * Catalogue axis that supplied each recorded figure, such as `{ length: "size" }`.
     */
    figures: Readonly<Partial<Record<Dimension, string>>>;

    /**
     * Producer-declared unit for each recorded dimension, including derived values.
     */
    units: Readonly<Partial<Record<Dimension, Unit>>>;
  }

  /** A selected catalogue name with its dimensions from one entry. */
  export interface IModel<Name extends string, Dimension extends string> {
    /** Selected catalogue name, or undefined when no model was available. */
    name: Name | undefined;

    /**
     * Numeric dimensions provided by the selected entry, in the producer's units.
     */
    figures: Readonly<Partial<Record<Dimension, number>>>;
  }
}
