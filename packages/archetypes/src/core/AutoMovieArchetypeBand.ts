import type { AutoMovieArchetypeBandUnit } from "./AutoMovieArchetypeBandUnit";
import type { IAutoMovieArchetypeBand } from "./IAutoMovieArchetypeBand";

/**
 * Constructs a producer's finite measurement bands with shared units and provenance.
 */
export namespace AutoMovieArchetypeBand {
  /**
   * Source label for a typical mass estimate. Pass `true` when recording its provisional band.
   */
  export const TYPICAL_MASS: string =
    "typical product mass, not read at a source";

  /**
   * Create an inclusive band of finite measurements.
   *
   * @param unit Unit shared by both endpoints.
   * @param minimum Lower endpoint in `unit`.
   * @param maximum Upper endpoint in `unit`. Equal endpoints fix a value.
   * @param source Reference or measurement supporting the interval.
   * @param provisional Pass `true` to record an estimate or a secondary
   *   source. The marker is omitted otherwise.
   * @returns The band record, ready for an applicable dimension.
   * @throws {Error} If either endpoint is nonfinite or the endpoints are reversed.
   */
  export function of(
    unit: AutoMovieArchetypeBandUnit,
    minimum: number,
    maximum: number,
    source: string,
    provisional?: boolean,
  ): IAutoMovieArchetypeBand {
    if (!Number.isFinite(minimum) || !Number.isFinite(maximum))
      throw new Error(`Band endpoints must be finite numbers (${source})`);
    if (minimum > maximum)
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
   * Create a dimensional band measured in metres.
   *
   * @param minimum Lower endpoint in metres.
   * @param maximum Upper endpoint in metres.
   * @param source Reference or measurement supporting the interval.
   * @param provisional Pass `true` to mark an estimate or secondary source.
   * @returns The corresponding metre band.
   * @throws {Error} If either endpoint is nonfinite or the endpoints are reversed.
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
