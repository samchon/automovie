import type { IAutoMovieAffordance, IAutoMovieMotionHumanPropReader, IAutoMovieRigidTransform } from "@automovie/interface";
import {
  HumanBall
} from "../../../../../packages/motions/src/ballStrike/internal/HumanBall";
import { TestValidator } from "@nestia/e2e";

import { throwsError } from "../../internal/throwsError";
import { vclose } from "../../internal/vclose";

/** A ball's grip at its centre, 0.11 m above its frame, 0.22 m across. */
const GRIP: IAutoMovieAffordance = {
  id: "grip",
  kind: "handle",
  frame: {
    translation: { x: 0, y: 0.11, z: 0 },
    rotation: { x: 0, y: 0, z: 0, w: 1 },
    scale: { x: 1, y: 1, z: 1 },
  },
  extent: null,
  aperture: 0.22,
};

/**
 * Check ball centre and radius from a declared grip at a requested film
 * second.
 *
 * Scenarios:
 *
 * 1. At 1.5 s a ball moving along +Z at 2 m/s and turning half a revolution
 *    about X reads centre (0, -0.11, 3) m and radius 0.11 m.
 * 2. A ball without a grip is refused before reading its frame.
 *
 * @evidence contracts/development/common.md#meaningful-documentation The cases specify the observed ball, aperture and film time and the missing geometry result.
 * @evidence contracts/development/testing.md#behavioral-verification The ball reader receives the real prop affordance and an instrumented frame callback.
 * @evidence contracts/development/testing.md#independent-expectations Half the aperture gives the radius. The half turn flips the grip's Y offset and speed times time gives Z.
 */
export function test_motions_ballStrike_human_ball(): void {
  const asked: [string, number][] = [];
  const reader =
    (
      affordances: readonly IAutoMovieAffordance[],
    ): ((subject: string) => IAutoMovieMotionHumanPropReader) =>
    (subject: string): IAutoMovieMotionHumanPropReader => ({
      prop: {
        subject,
        frame: {
          position: { x: 0, y: 0, z: 0 },
          rotation: { x: 0, y: 0, z: 0, w: 1 },
        },
        points: {},
        affordances,
      },
      frame: (seconds: number): IAutoMovieRigidTransform => {
        asked.push([subject, seconds]);
        return {
          position: { x: 0, y: 0, z: 2 * seconds },
          rotation: { x: 1, y: 0, z: 0, w: 0 },
        };
      },
    });
  const read: HumanBall.IBall = HumanBall(
    { prop: reader([GRIP]) },
    "football",
    1.5,
    "ball",
  );
  TestValidator.predicate(
    "the ball at its second",
    vclose(read.centre, { x: 0, y: -0.11, z: 3 }, 1e-12) &&
      read.radius === 0.11,
  );
  TestValidator.equals("the reader asked", asked, [["football", 1.5]]);
  TestValidator.predicate(
    "no grip, refused unread",
    throwsError(() =>
      HumanBall({ prop: reader([]) }, "football", 1.5, "ball"),
    ) && asked.length === 1,
  );
}
