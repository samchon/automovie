import { Vector3 } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanSword,
  IAutoMovieMotionHumanSwordParry,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanSword } from "./HumanSword";

/**
 * How far a parry carries a taken blade aside, world metres: square to the
 * defender's front, level, toward the side of the defender's centre line the
 * meeting lies on, until the whole attacking blade, from its grip's end to its
 * point, lies outside the defender's broadest half breadth, the shoulders with
 * the upper arm's girth or the chest, by the blades' `GAP`; none when it
 * already does. The defender's own forward lunge then passes beside it.
 */
export function HumanSwordParryAside(
  context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanSwordParry.IParry>,
  s: IAutoMovieMotionHumanSword.ISetup,
  ends: readonly [IAutoMovieVector3, IAutoMovieVector3],
  middle: IAutoMovieVector3,
): IAutoMovieVector3 {
  const lateral: IAutoMovieVector3 = s.world({ out: 1, up: 0, forward: 0 });
  const centre: IAutoMovieVector3 = context.entry.posture.root;
  const off = (p: IAutoMovieVector3): number =>
    Vector3.dot(Vector3.subtract(p, centre), lateral);
  const side: number = off(middle) >= 0 ? 1 : -1;
  const m: IAutoMovieMotionHumanActionContext["body"]["measure"] =
    context.body.measure;
  const clear: number =
    Math.max(m.chestBreadth / 2, m.shoulderHalfWidth + m.upperArmRadius) +
    HumanSword.GAP;
  const shift: number = Math.max(
    0,
    clear - Math.min(side * off(ends[0]), side * off(ends[1])),
  );
  return Vector3.scale(lateral, side * shift);
}
