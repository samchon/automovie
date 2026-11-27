import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanDive,
} from "@automovie/interface";

import { dive } from "./dive";

/*
 * Each foot's toe-off roll, solved by secant steps on the planted take-off
 * itself from the flat take-off's dorsiflexion past the unloaded limit
 * (`ANKLE_DORSIFLEXION.unloaded`); none for a slide, whose feet stay on the
 * floor.
 *
 * Part of `dive.plan`, which prepares it once per plan.
 * Parameter prepared: What the plan prepared for it.
 * Returns: The plan's `lift`.
 */
export function diveLift(prepared: diveLift.IPrepared): dive.Lift {
  const { kind, excess, rolled }: diveLift.IPrepared = prepared;
  return ((): dive.Lift => {
    if (kind !== "dive") return { left: 0, right: 0 };
    let before: dive.Lift = { left: 0, right: 0 };
    let over: dive.Lift = excess();
    let now: dive.Lift = {
      left: Math.max(0, over.left),
      right: Math.max(0, over.right),
    };
    for (
      let k: number = 0;
      k < dive.SECANT && (now.left > 0 || now.right > 0);
      ++k
    ) {
      const after: dive.Lift = excess(rolled(now));
      if (after.left <= 0 && after.right <= 0) break;
      const step: (side: AutoMovieHumanSide) => number = (
        side: AutoMovieHumanSide,
      ): number => {
        if (after[side] <= 0) return now[side];
        const run: number = now[side] - before[side];
        const slope: number =
          run === 0 ? 0 : (over[side] - after[side]) / run;
        // A roll that did not lower the ankle is stepped by the excess.
        return (
          now[side] +
          after[side] / (slope > 0 ? slope : 1)
        );
      };
      const next: dive.Lift = { left: step("left"), right: step("right") };
      before = now;
      over = after;
      now = next;
    }
    return now;
  })();
}

/*
 * The `lift` of `dive.plan`, built from what that plan prepared.
 */
export namespace diveLift {
  /*
   * What `dive.plan` prepared for its `lift`.
   */
  export interface IPrepared {
    /*
     * The `kind` `dive.plan` prepared.
     */
    kind: IAutoMovieMotionHumanDive.Kind;

    /*
     * The `excess` `dive.plan` prepared.
     */
    excess: (on?: dive.Feet) => dive.Lift;

    /*
     * The `rolled` `dive.plan` prepared.
     */
    rolled: (lift: dive.Lift) => dive.Feet;
  }
}
