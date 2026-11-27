import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanFrame,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanTargetGrid,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanTarget } from "../../compose/internal/AutoMovieMotionHumanTarget";
import { AutoMovieMotionHumanTargetGrid } from "../../compose/internal/AutoMovieMotionHumanTargetGrid";
import { HumanFrame } from "../../posture/internal/HumanFrame";
import type { IMotionCaptureCase } from "../internal/IMotionCaptureCase";

/**
 * Checks that a captured point is at the place a law names.
 *
 * A law states a hand's place by three names. This verdict reads the place back
 * from the displayed pose: it asks which names the point is nearest to on the
 * body as it stands, and passes when they are the names the law wrote. A table
 * share that drifts from what its name means on some body of the sweep fails
 * here, on that body.
 */
export namespace MotionPlaceVerdicts {
  /**
   * The verdict that a point is at a named place.
   *
   * @param name The verdict's name.
   * @param body The body.
   * @param posture The root and the heading of the displayed pose.
   * @param side The acting hand.
   * @param point The captured point, world metres.
   * @param expected The names the law wrote.
   * @returns The verdict; its detail gives the names found and the point's
   *   offset from the named place (out, up, forward) in arm lengths.
   */
  export function at(
    name: string,
    body: IAutoMovieMotionHumanBody,
    posture: Pick<IAutoMovieMotionHumanPosture, AtPosture>,
    side: AutoMovieHumanSide,
    point: IAutoMovieVector3,
    expected: IAutoMovieMotionHumanTargetGrid.IGrid,
  ): IMotionCaptureCase.IVerdict {
    const found = AutoMovieMotionHumanTargetGrid.nearest(
      body,
      posture,
      side,
      point,
    );
    const frame: IAutoMovieMotionHumanFrame = {
      origin: { x: posture.root.x, y: 0, z: posture.root.z },
      yaw: posture.yaw,
    };
    const local: IAutoMovieVector3 = HumanFrame.local(frame, point);
    const named: IAutoMovieVector3 = HumanFrame.local(
      frame,
      AutoMovieMotionHumanTarget.fallback(
        body,
        posture,
        AutoMovieMotionHumanTargetGrid.place(body, side, expected),
      ).point,
    );
    const arm: number = body.measure.upperArm + body.measure.forearm;
    const share = (value: number): string => (value / arm).toFixed(2);
    return {
      name,
      passed:
        found.height === expected.height &&
        found.lateral === expected.lateral &&
        found.distance === expected.distance,
      detail:
        `${found.height}, ${found.lateral}, ${found.distance}; off by out ` +
        `${share((side === "left" ? 1 : -1) * (local.x - named.x))}, up ` +
        `${share(local.y - named.y)}, forward ${share(local.z - named.z)} arm`,
    };
  }
}

/** The alternatives of `AtPosture`'s site. */
type AtPosture = "root" | "yaw";
