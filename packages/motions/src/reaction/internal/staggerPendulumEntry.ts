import { AutoMovieEngineVector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanFoot,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanBalance } from "../../everyday/internal/HumanBalance";
import { HumanFoot } from "../../posture/internal/HumanFoot";
import { HumanFrame } from "../../posture/internal/HumanFrame";
import { StrikingTarget } from "../../striking/internal/StrikingTarget";
import type { StaggerPendulum } from "./StaggerPendulum";
import { staggerBounds } from "./staggerBounds";
import { staggerKnots } from "./staggerKnots";

/*
 * The entry geometry a stagger's pendulum starts from (`StaggerPendulum`),
 * prepared once from the body and the entry alone.
 */
export namespace staggerPendulumEntry {
  /*
   * The alternatives of `PrepareResult`'s site.
   */
  export type PrepareResult =
    | "w"
    | "centre"
    | "root"
    | "forward"
    | "across"
    | "entered"
    | "width"
    | "length"
    | "bend";

  /*
   * The entry's geometry a pendulum starts from, which depends on the body and
   * the entry alone: the frequency, the whole-body centre of mass (one full
   * forward-kinematics read), the root, the heading's axes, the feet, the
   * soles' narrowest side-by-side width and length, and the trunk's shift of
   * the centre of mass per sine of its tilt (`staggerKnots.bending`, three more
   * centre-of-mass reads).
   * Parameter body: The body.
   * Parameter entry: The posture the push meets.
   * Returns: The fixed geometry, shared by every pendulum of one search over
   * speeds and foot orders.
   */
  export function prepare(
    body: IAutoMovieMotionHumanActionContext["body"],
    entry: IAutoMovieMotionHumanActionContext["entry"],
  ): Pick<StaggerPendulum, PrepareResult> {
    const forward: IAutoMovieVector3 = HumanFrame.point(
      { origin: { x: 0, y: 0, z: 0 }, yaw: entry.posture.yaw },
      { x: 0, y: 0, z: 1 },
    );
    const across: IAutoMovieVector3 = { x: forward.z, y: 0, z: -forward.x };
    const entered: Record<
      AutoMovieHumanSide,
      IAutoMovieMotionHumanFoot.IPlacement
    > = StrikingTarget.feet(entry);
    return {
      w: staggerBounds.omega(body),
      centre: HumanBalance.centre(body, entry.posture),
      root: entry.posture.root,
      forward,
      across,
      entered,
      width: extent(body, entered, across),
      length: extent(body, entered, forward),
      bend: staggerKnots.bending(body, entry),
    };
  }

  /*
   * Each entry sole's ankle-relative extent along an axis, the larger of the
   * two.
   */
  function extent(
    body: IAutoMovieMotionHumanActionContext["body"],
    entered: Record<AutoMovieHumanSide, IAutoMovieMotionHumanFoot.IPlacement>,
    axis: IAutoMovieVector3,
  ): number {
    return Math.max(
      ...(["left", "right"] as const).map(
        (side: AutoMovieHumanSide): number => {
          const along: number[] = HumanFoot.sole(body, side, entered[side]).map(
            (q: IAutoMovieVector3): number =>
              AutoMovieEngineVector3.dot(AutoMovieEngineVector3.subtract(q, entered[side].ankle), axis),
          );
          return Math.max(...along) - Math.min(...along);
        },
      ),
    );
  }
}
