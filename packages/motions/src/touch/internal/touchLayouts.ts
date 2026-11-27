import type {
  AutoMovieHumanSide,
  IAutoMovieMotionTarget,
} from "@automovie/interface";

import type { touchHold } from "./touchHold";

/**
 * Share a touch's fixed entry-layout decisions during one plan construction.
 * Each declared hand/target pair is evaluated here, in declaration order;
 * callers receive fresh scalar layout records.
 *
 * @param hands The at-most-two hand/target pairs this touch actually plans.
 * @param read The layout calculation over this plan's fixed entry/body inputs.
 * @returns The same layout reader with completed declared decisions shared.
 */
export function touchLayouts(
  hands: readonly (readonly [AutoMovieHumanSide, IAutoMovieMotionTarget])[],
  read: touchHold.Lay,
): touchHold.Lay {
  const completed: readonly touchHold.ILaid[] = hands.map(
    ([side, target]: readonly [AutoMovieHumanSide, IAutoMovieMotionTarget]) =>
      read(side, target),
  );
  return (
    side: AutoMovieHumanSide,
    target: IAutoMovieMotionTarget,
  ): touchHold.ILaid => {
    const index: number = hands.findIndex(
      ([hand, at]: readonly [
        AutoMovieHumanSide,
        IAutoMovieMotionTarget,
      ]): boolean => hand === side && at === target,
    );
    if (index < 0) return read(side, target);
    return { ...completed[index]! };
  };
}
