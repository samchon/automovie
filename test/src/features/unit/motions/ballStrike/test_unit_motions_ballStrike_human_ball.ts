import type {
  IAutoMovieMotionHumanPropReader,
  IAutoMovieRigidTransform,
} from "@automovie/interface";
import { HumanBall } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { vclose } from "../../../internal/vclose";

/**
 * `HumanBall` reads the ball a prop subject names at a film second: the prop's
 * reader gives the frame at that second, and the ball's grip its centre and
 * diameter.
 *
 * The ball rolls along +Z at 2 m/s from the origin; its grip sits 0.11 m above
 * its frame with a 0.22 m aperture.
 *
 * Scenarios:
 *
 * 1. Read at 1.5 s, the centre is at (0, 0.11, 3) and the radius 0.11 m, and
 *    the reader was asked for that very second of that very subject.
 */
export function test_unit_motions_ballStrike_human_ball(): void {
  const asked: [string, number][] = [];
  const reader = (subject: string): IAutoMovieMotionHumanPropReader => ({
    prop: {
      subject,
      frame: {
        position: { x: 0, y: 0, z: 0 },
        rotation: { x: 0, y: 0, z: 0, w: 1 },
      },
      points: {},
      affordances: [
        {
          id: "grip",
          kind: "handle",
          frame: {
            translation: { x: 0, y: 0.11, z: 0 },
            rotation: { x: 0, y: 0, z: 0, w: 1 },
            scale: { x: 1, y: 1, z: 1 },
          },
          extent: null,
          aperture: 0.22,
        },
      ],
    },
    frame: (seconds: number): IAutoMovieRigidTransform => {
      asked.push([subject, seconds]);
      return {
        position: { x: 0, y: 0, z: 2 * seconds },
        rotation: { x: 0, y: 0, z: 0, w: 1 },
      };
    },
  });
  const read: HumanBall.IBall = HumanBall({ prop: reader }, "football", 1.5, "ball");
  TestValidator.predicate(
    "the ball at its second",
    vclose(read.centre, { x: 0, y: 0.11, z: 3 }, 1e-12) && read.radius === 0.11,
  );
  TestValidator.equals("the reader asked", asked, [["football", 1.5]]);
}
