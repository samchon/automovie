import type { IArchetypeBand } from "./IArchetypeBand";

/**
 * How producers write their bands: one call per free dimension, with its unit, its two ends and its source.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what a call records.
 * @evidence contracts/development/design.md#principled-representation A constructor for `IArchetypeBand` that keeps the citation beside the numbers at the place they are written.
 * @evidence contracts/development/design.md#minimal-and-owned-surface `of`, its shorthand in metres, and the one source text many producers share.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No default source: a band without a citation cannot be written.
 */
export namespace ArchetypeBand {
  /** The source text of a mass that was not read at any source: a typical product mass, always provisional. */
  export const TYPICAL_MASS: string =
    "typical product mass, not read at a source";

  /**
   * A band.
   *
   * @param unit The unit of both ends.
   * @param minimum The least value.
   * @param maximum The greatest value; equal to `minimum` for a dimension its source fixes.
   * @param source The standard's clause or the measurement, with the address it was read at.
   * @param provisional True when the value was not read at its primary source; absent otherwise.
   * @returns The band.
   * @throws {Error} When the ends are not finite or are out of order, a producer's defect.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States each input and the failure.
   * @evidence contracts/development/implementation.md#principled-implementation A record literal behind one ordering check.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One check, one literal.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Reversed ends throw instead of being swapped.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function of(
    unit: IArchetypeBand["unit"],
    minimum: number,
    maximum: number,
    source: string,
    provisional?: boolean,
  ): IArchetypeBand {
    if (
      !(
        Number.isFinite(minimum) &&
        Number.isFinite(maximum) &&
        minimum <= maximum
      )
    )
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
   * @param source The standard's clause or the measurement, with the address it was read at.
   * @param provisional True when the value was not read at its primary source; absent otherwise.
   * @returns The band.
   * @throws {Error} As {@link of} does.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States that it is `of` in metres and each input.
   * @evidence contracts/development/implementation.md#principled-implementation One call of `of`.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One call.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts Nothing beyond the owner it calls.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses `of`, in place of a helper each producer file used to declare.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function metres(
    minimum: number,
    maximum: number,
    source: string,
    provisional?: boolean,
  ): IArchetypeBand {
    return of("m", minimum, maximum, source, provisional);
  }
}
