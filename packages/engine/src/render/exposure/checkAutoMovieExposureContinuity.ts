import type { IAutoMovieCheckExposureContinuity } from "@automovie/interface";

/**
 * Report every cut whose exposure jumps from the previous cut of the same
 * screenplay scene.
 *
 * Cuts are read in the given order, which is the film's playing order. Each cut
 * is compared with the most recent earlier cut of its `group`, so a cut of
 * another location between them is skipped; a finding is made when the two
 * EV100 values differ by more than `tolerance` stops, unless the later cut sets
 * `change: true`, the screenplay's own decision. Every cut, reported or not,
 * becomes the reference for the next cut of its group. The first cut of a group
 * has nothing to compare with.
 *
 * The default tolerance is one third of a stop, the finest step of the exposure
 * scales cameras mark.
 *
 * @param props The cuts in playing order and the tolerance.
 * @returns One finding per reported cut, in playing order.
 * @throws Error when two cuts share an `index`, an index is not a safe integer,
 *   an `ev100` is not finite, or the tolerance is negative or not finite.
 */
export const checkAutoMovieExposureContinuity: (
  props: IAutoMovieCheckExposureContinuity.IProps,
) => IAutoMovieCheckExposureContinuity.IFinding[] = (
  props: IAutoMovieCheckExposureContinuity.IProps,
): IAutoMovieCheckExposureContinuity.IFinding[] => {
  const tolerance: number = props.tolerance ?? 1 / 3;
  if (!(Number.isFinite(tolerance) && tolerance >= 0))
    throw new Error(
      "checkAutoMovieExposureContinuity: tolerance must be finite and at or above zero.",
    );

  const seen: Set<number> = new Set<number>();
  const previous: Map<string, IAutoMovieCheckExposureContinuity.ICut> = new Map<
    string,
    IAutoMovieCheckExposureContinuity.ICut
  >();
  const findings: IAutoMovieCheckExposureContinuity.IFinding[] = [];
  for (const cut of props.cuts) {
    if (!Number.isSafeInteger(cut.index))
      throw new Error(
        `checkAutoMovieExposureContinuity: cut index ${cut.index} is not a safe integer.`,
      );
    if (seen.has(cut.index))
      throw new Error(
        `checkAutoMovieExposureContinuity: two cuts share index ${cut.index}.`,
      );
    if (!Number.isFinite(cut.ev100))
      throw new Error(
        `checkAutoMovieExposureContinuity: cut ${cut.index} has a non-finite ev100.`,
      );
    seen.add(cut.index);

    const before: IAutoMovieCheckExposureContinuity.ICut | undefined =
      previous.get(cut.group);
    if (
      before !== undefined &&
      cut.change !== true &&
      Math.abs(cut.ev100 - before.ev100) > tolerance
    )
      findings.push({
        group: cut.group,
        previousIndex: before.index,
        previousEv100: before.ev100,
        index: cut.index,
        ev100: cut.ev100,
      });
    previous.set(cut.group, cut);
  }
  return findings;
};
