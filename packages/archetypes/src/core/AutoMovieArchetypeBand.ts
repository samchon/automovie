import type { AutoMovieArchetypeBandUnit } from "./AutoMovieArchetypeBandUnit";
import type { IAutoMovieArchetypeBand } from "./IAutoMovieArchetypeBand";

/**
 * How producers write their bands: one call per free dimension, with its unit,
 * its two ends and its source.
 */
export namespace AutoMovieArchetypeBand {
  /**
   * The source text of a mass that was not read at any source: a typical
   * product mass, always provisional.
   */
  export const TYPICAL_MASS: string =
    "typical product mass, not read at a source";

  /**
   * A band.
   *
   * @param unit The unit of both ends.
   * @param minimum The least value.
   * @param maximum The greatest value; equal to `minimum` for a dimension its
   *   source fixes.
   * @param source The standard's clause or the measurement, with the address it
   *   was read at.
   * @param provisional True when the value was not read at its primary source;
   *   absent otherwise.
   * @returns The band.
   * @throws {Error} When the ends are not finite or are out of order, a
   *   producer's defect.
   */
  export function of(
    unit: AutoMovieArchetypeBandUnit,
    minimum: number,
    maximum: number,
    source: string,
    provisional?: boolean,
  ): IAutoMovieArchetypeBand {
    if (!(minimum <= maximum))
      throw new Error(
        `A band runs from its least to its greatest value: ${minimum} to ${maximum} (${source})`,
      );
    return {
      minimum,
      maximum,
      unit,
      source,
      ...(provisional === true ? { provisional } : {}),
    };
  }

  /**
   * A band in metres: {@link of} with the unit most dimensions have.
   *
   * @param minimum The least value, metres.
   * @param maximum The greatest value, metres.
   * @param source The standard's clause or the measurement, with the address it
   *   was read at.
   * @param provisional True when the value was not read at its primary source;
   *   absent otherwise.
   * @returns The band.
   * @throws {Error} As {@link of} does.
   */
  export function metres(
    minimum: number,
    maximum: number,
    source: string,
    provisional?: boolean,
  ): IAutoMovieArchetypeBand {
    return of("m", minimum, maximum, source, provisional);
  }
}
