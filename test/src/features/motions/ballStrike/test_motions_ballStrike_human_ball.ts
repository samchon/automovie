import type { IAutoMovieAffordance, IAutoMovieMotionHumanPropReader, IAutoMovieRigidTransform } from "@automovie/interface";
import { HumanBall } from "@automovie/motions/internal";
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
 * The struck ball read from its own `grip`, as `createBall` declares it: the
 * centre is the grip's point in the ball's frame at the film second, the radius
 * half its aperture.
 *
 * Scenarios:
 *
 * 1. A ball rolling along +Z at 2 m/s, turned a half turn about +X, read at 1.5 s
 *    has its centre 0.11 m below its frame at (0, -0.11, 3) and its radius 0.11
 *    m, read at that very second of that very subject.
 * 2. A ball without a grip is refused before its frame is read.
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
