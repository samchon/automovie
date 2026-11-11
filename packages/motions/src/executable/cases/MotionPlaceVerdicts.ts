import type { IAutoMovieVector3 } from "@automovie/interface";

import type { IHumanBody } from "../../body/IHumanBody";
import { AutoMovieMotionHumanTarget } from "../../compose/AutoMovieMotionHumanTarget";
import { HumanFrame } from "../../posture/HumanFrame";
import type { HumanHand } from "../../posture/HumanHand";
import type { IHumanPosture } from "../../posture/IHumanPosture";
import type { IMotionCaptureCase } from "../IMotionCaptureCase";

/**
 * Checks that a captured point is at the place a law names.
 *
 * A law states a hand's place by three names. This verdict reads the place
 * back from the displayed pose: it asks which names the point is nearest to
 * on the body as it stands, and passes when they are the names the law
 * wrote. A table share that drifts from what its name means on some body of
 * the sweep fails here, on that body.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what is checked, from what, and what a failure means.
 * @evidence contracts/development/design.md#principled-representation One verdict per captured point, in the capture's own verdict record.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One function; the only owner of place verdicts.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Reads names back through `nearest`, a path that does not run the resolver forward.
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
   * @returns The verdict; its detail gives the names found and the point's offset from the named place (out, up, forward) in arm lengths.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the inputs, the pass rule and what the detail reports.
   * @evidence contracts/development/implementation.md#principled-implementation Passes when the nearest height, lateral and distance names equal the expected ones; the offset is measured from the expected place in the performer's floor frame.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One nearest-name read, one resolved place and one difference.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No tolerance is typed: the names' own midpoints are the bounds.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses `nearest`, `place`, `fallback` and `HumanFrame.local`.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work with no algorithm to choose.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function that retains nothing.
   */
  export function at(
    name: string,
    body: IHumanBody,
    posture: Pick<IHumanPosture, "root" | "yaw">,
    side: HumanHand.Side,
    point: IAutoMovieVector3,
    expected: AutoMovieMotionHumanTarget.IGrid,
  ): IMotionCaptureCase.IVerdict {
    const found = AutoMovieMotionHumanTarget.nearest(
      body,
      posture,
      side,
      point,
    );
    const frame: HumanFrame.IFrame = {
      origin: { x: posture.root.x, y: 0, z: posture.root.z },
      yaw: posture.yaw,
    };
    const local: IAutoMovieVector3 = HumanFrame.local(frame, point);
    const named: IAutoMovieVector3 = HumanFrame.local(
      frame,
      AutoMovieMotionHumanTarget.fallback(
        body,
        posture,
        AutoMovieMotionHumanTarget.place(body, side, expected),
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
