import type {
  IAutoMovieMotionHumanBody,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanTargetGrid } from "../compose/AutoMovieMotionHumanTargetGrid";
import { prepareHumanKnotCourse } from "../posture/prepareHumanKnotCourse";

/**
 * Prepare a choku-zuki fist's path over the punch's progress `u` in [0, 1]: its
 * shares of the way from the chamber to the aim, `[inward, ahead]`, the inward
 * share moving the fist across toward the midline and the ahead share moving it
 * forward and up.
 *
 * The knots are the chamber (`[0, 0]`), the chest-front crossing and the aim
 * (`[1, 1]`). At the crossing the elbow, brushing the side with the forearm
 * pointing ahead, has come to the chest's front, half the chest's depth and a
 * forearm diameter ahead of the shoulder joints, so the fist stands a forearm
 * beyond it, with no share inward yet: the forearm runs along the flank and the
 * upper arm turns in only once clear of the chest. The shared knot course joins
 * the knots with minimum-jerk quintics, at rest at the chamber and the aim
 * (Flash and Hogan 1985, `prepareHumanKnotCourse`). Each knot's progress is its
 * share of the path's chord length (chord-length parametrisation, Lee 1989,
 * Computer-Aided Design 21(6):363), the lengths read from the rest body
 * standing upright.
 *
 * @param body The body: its measures and its rest shoulder.
 * @param chamber The chamber's offset from the shoulder joint, metres, outward
 *   positive: outward, up and ahead.
 * @returns The path's reader, `[inward, ahead]` at a progress.
 */
export function prepareChokuZukiPath(
  body: Pick<IAutoMovieMotionHumanBody, "measure" | "rest">,
  chamber: IAutoMovieVector3,
): prepareHumanKnotCourse.ICourse {
  const m: IAutoMovieMotionHumanBody["measure"] = body.measure;
  const shoulder: IAutoMovieVector3 = body.rest.get("rightUpperArm")!;

  // The way from the chamber to the aim at the midline, chest high, an arm's
  // length ahead of the root, in the shoulder's frame.
  const across: number = chamber.x + Math.abs(shoulder.x);
  const up: number =
    AutoMovieMotionHumanTargetGrid.height(body, "chest") * m.stature -
    m.shoulderHeight -
    chamber.y;
  const forward: number = m.upperArm + m.forearm - shoulder.z - chamber.z;
  const crossing: number = Math.min(
    1,
    Math.max(
      0,
      (m.chestDepth / 2 + 2 * m.forearmRadius + m.forearm - chamber.z) /
        forward,
    ),
  );
  const along: number = Math.hypot(up, forward);
  const first: number = crossing * along;
  const second: number = Math.hypot(across, (1 - crossing) * along);
  if (!(first > 0 && second > 0))
    return prepareHumanKnotCourse(
      [
        { position: [0, 0], dwell: 0 },
        { position: [1, 1], dwell: 0 },
      ],
      { kind: "fixed", times: [0, 1] },
    );
  return prepareHumanKnotCourse(
    [
      { position: [0, 0], dwell: 0 },
      { position: [0, crossing], dwell: 0 },
      { position: [1, 1], dwell: 0 },
    ],
    { kind: "fixed", times: [0, first / (first + second), 1] },
  );
}
