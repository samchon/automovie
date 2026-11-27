import { AutoMovieEngineVector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanGestureStroke,
  IAutoMoviePose,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanHand } from "../../posture/internal/HumanHand";
import { poseBones } from "../../posture/internal/poseBones";

/*
 * Measure the farthest entry-to-stroke hand transport while sharing only the
 * fixed action-entry pose's demanded FK. Named and varied stroke probes still
 * evaluate every actual goal; a changed surface adds its real frame demand.
 * Parameter body: The unchanged body supplying actual hand-surface metadata.
 * Parameter entry: The fixed canonical pose at the action's exact entry event.
 * Parameter sides: The hands moved by this gesture.
 * Returns: A reader of actual stroke goals returning farthest travel in metres,
 * using the original relaxed reference hand shape.
 */
export function prepareGestureTransport(
  body: IAutoMovieMotionHumanBody,
  entry: IAutoMoviePose,
  sides: readonly AutoMovieHumanSide[],
): (
  stroke: (
    side: AutoMovieHumanSide,
  ) => IAutoMovieMotionHumanGestureStroke.IHand,
) => number {
  const requested: Set<AutoMovieHumanoidBone> = new Set();
  let reference: ReturnType<typeof poseBones> | undefined;
  return (
    stroke: (
      side: AutoMovieHumanSide,
    ) => IAutoMovieMotionHumanGestureStroke.IHand,
  ): number => {
    const goals: IPrepareGestureTransportGoalsItem[] = sides.map(
      (side: AutoMovieHumanSide): IPrepareGestureTransportGoalsResult => ({
        side,
        hand: stroke(side),
      }),
    );
    if (goals.length === 0) return 0;
    let changed: boolean = reference === undefined;
    for (const { side, hand } of goals)
      for (const bone of HumanHand.frameBones(body, side, hand.surface))
        if (!requested.has(bone)) {
          requested.add(bone);
          changed = true;
        }
    if (changed) reference = poseBones(body, entry, undefined, requested);
    let farthest: number = 0;
    for (const { side, hand } of goals) {
      const from: IAutoMovieVector3 = HumanHand.frame(
        body,
        reference!,
        side,
        hand.surface,
        "relaxed",
      ).point;
      farthest = Math.max(
        farthest,
        AutoMovieEngineVector3.length(AutoMovieEngineVector3.subtract(hand.point, from)),
      );
    }
    return farthest;
  };
}

/*
 * The record of `IPrepareGestureTransportGoalsResult`'s site.
 */
type IPrepareGestureTransportGoalsResult = {
  side: AutoMovieHumanSide;
  hand: IAutoMovieMotionHumanGestureStroke.IHand;
};

/*
 * The record of `IPrepareGestureTransportGoalsItem`'s site.
 */
type IPrepareGestureTransportGoalsItem = {
  side: AutoMovieHumanSide;
  hand: IAutoMovieMotionHumanGestureStroke.IHand;
};
