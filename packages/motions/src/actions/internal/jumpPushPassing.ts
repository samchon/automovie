import { AutoMovieEngineVector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanFoot,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanFrame } from "../../posture/internal/HumanFrame";

/*
 * A jump push's reaching-foot pass (`jumpPush`): the bump that opens the
 * reaching foot's lateral gap to the take-off shank where it passes along the
 * heading, read from the push's body, heading, reaching foot and take-off
 * foot.
 * Parameter scope: What the push builds the pass from.
 * Returns: The bump at a share of the reaching foot's path.
 */
export function jumpPushPassing(
  scope: jumpPushPassing.IScope,
): jumpPushPassing.Passing {
  const { body, heading, reaching, support }: jumpPushPassing.IScope = scope;
  // The reaching foot passes the take-off shank on its own side: along the
  // heading its gap to the take-off ankle is linear in the path's share, so
  // it passes at s* = g0 / (g0 − g1); a lateral gap there under two shank
  // radii (the passing clearance a line walk keeps) is opened by a bump that
  // is the shortfall at s* and zero at both ends, s(1 − s) / (s*(1 − s*)).
  const forward: IAutoMovieVector3 = HumanFrame.point(
    { origin: { x: 0, y: 0, z: 0 }, yaw: heading },
    { x: 0, y: 0, z: 1 },
  );
  const aside: IAutoMovieVector3 = AutoMovieEngineVector3.scale(
    AutoMovieEngineVector3.normalize(AutoMovieEngineVector3.cross({ x: 0, y: 1, z: 0 }, forward)),
    reaching === "left" ? 1 : -1,
  );
  const clearance: number = 2 * body.measure.shankRadius;
  const passing = (
    from: IAutoMovieVector3,
    into: IAutoMovieVector3,
    s: number,
  ): IAutoMovieVector3 => {
    const g0: number = AutoMovieEngineVector3.dot(
      AutoMovieEngineVector3.subtract(from, support.ankle),
      forward,
    );
    const g1: number = AutoMovieEngineVector3.dot(
      AutoMovieEngineVector3.subtract(into, support.ankle),
      forward,
    );
    // A pass is a sign change of two real gaps (`PASS_GAP`), strictly
    // inside the path.
    if (!(g0 * g1 < 0) || !(Math.min(Math.abs(g0), Math.abs(g1)) > PASS_GAP))
      return { x: 0, y: 0, z: 0 };
    const at: number = g0 / (g0 - g1);
    const gap: number = AutoMovieEngineVector3.dot(
      AutoMovieEngineVector3.subtract(AutoMovieEngineVector3.lerp(from, into, at), support.ankle),
      aside,
    );
    const bump: number = Math.max(0, clearance - gap);
    // Held at the full bump from the pass to its mirror share, so a pass
    // near either end does not swell the bump past it in between.
    return AutoMovieEngineVector3.scale(
      aside,
      bump * Math.min(1, (s * (1 - s)) / (at * (1 - at))),
    );
  };

  return passing;
}

/*
 * What a jump push's pass reads and what it is.
 */
export namespace jumpPushPassing {
  /*
   * What a jump push builds its pass from.
   */
  export interface IScope {
    /*
     * The body.
     */
    body: IAutoMovieMotionHumanBody;

    /*
     * The jump's heading, degrees.
     */
    heading: number;

    /*
     * The foot that leaves at once.
     */
    reaching: AutoMovieHumanSide;

    /*
     * The take-off foot as entered.
     */
    support: IAutoMovieMotionHumanFoot.IPlacement;
  }

  /*
   * The bump that opens the pass at a share of the reaching foot's path.
   * Parameter from: The reaching ankle's start, world metres.
   * Parameter into: The reaching ankle's end, world metres.
   * Parameter s: The path's share.
   * Returns: The bump, world metres.
   */
  export type Passing = (
    from: IAutoMovieVector3,
    into: IAutoMovieVector3,
    s: number,
  ) => IAutoMovieVector3;
}
/*
 * The least forward gap that reads as one foot ahead of the other, metres: a
 * nanometre, the walk's root-solve width (`walkReach`), under which the gap is
 * a rounding of side by side.
 */
const PASS_GAP: number = 1e-9;
