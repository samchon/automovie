import type {
  IAutoMovieMotionHumanPrecisionDeck,
  IAutoMoviePhysicalFrame,
  IAutoMoviePhysicalSegmentState,
  IAutoMovieVector3,
} from "@automovie/interface";
import { pocketedBalls } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { throwsError } from "../../../internal/throwsError";

/** A 3 cm ball, its centre of mass at its centre. */
const ball = (id: string): pocketedBalls.IBall => ({
  id,
  profile: {
    segments: [
      {
        centerOfMass: { x: 0, y: 0, z: 0 },
        shapes: [
          {
            id: "ball",
            material: "resin",
            transform: {
              position: { x: 0, y: 0, z: 0 },
              rotation: { x: 0, y: 0, z: 0, w: 1 },
            },
            kind: "sphere",
            radius: 0.03,
          },
        ],
      },
    ],
  },
});

/** A body's root at a point, unturned and at rest. */
const at = (position: IAutoMovieVector3): IAutoMoviePhysicalSegmentState => ({
  position,
  rotation: { x: 0, y: 0, z: 0, w: 1 },
  velocity: { x: 0, y: 0, z: 0 },
  angularVelocity: { x: 0, y: 0, z: 0 },
});

/**
 * `pocketedBalls` credits a ball to a pocket at the first cache frame its
 * centre is more than a radius below the bed, the pocket being the mouth whose
 * plan reach holds it; a ball that drops outside every reach left over a rail.
 *
 * The bed is at 0.8 m with a corner pocket at the origin reaching 6 cm; the
 * shot is released at 1 s and baked at 10 frames a second for 1 s. Ball `a`
 * sinks 0.1 m/s 2 cm from the pocket, from 3.5 cm above the bed; `b` sinks the
 * same way 1 m off; `c` rests on the bed.
 *
 * Scenarios:
 *
 * 1. `a` first lies more than 3 cm below the bed at 0.7 s, credited at 1.7 s
 *    to the corner; `b` is not credited, nor `c`.
 * 2. No pocket, or a ball missing from the cache, is refused.
 */
export function test_unit_motions_sport_pocketed_balls(): void {
  const corner: IAutoMovieMotionHumanPrecisionDeck.IPocket = {
    id: "corner",
    point: { x: 0, y: 0.8, z: 0 },
    reach: 0.06,
  };
  const result = (ids: string[]): pocketedBalls.IRead["result"] => ({
    release: 1,
    cache: {
      duration: 1,
      rate: 10,
      at: (seconds: number): IAutoMoviePhysicalFrame => {
        const sunk: number = 0.835 - 0.1 * seconds;
        const bodies: Record<string, Record<string, IAutoMoviePhysicalSegmentState>> = {
          a: { root: at({ x: 0.02, y: sunk, z: 0 }) },
          b: { root: at({ x: 1, y: sunk, z: 0 }) },
          c: { root: at({ x: 0.5, y: 0.83, z: 0 }) },
        };
        return {
          seconds,
          bodies: Object.fromEntries(
            ids.map(
              (
                id: string,
              ): [string, Record<string, IAutoMoviePhysicalSegmentState>] => [
                id,
                bodies[id]!,
              ],
            ),
          ),
        };
      },
    },
  });
  const balls: pocketedBalls.IBall[] = [ball("a"), ball("b"), ball("c")];
  TestValidator.equals(
    "the pocketed ball",
    pocketedBalls({ balls, pockets: [corner], result: result(["a", "b", "c"]) }),
    [{ ball: "a", pocket: "corner", seconds: 1.7 }],
  );
  TestValidator.predicate(
    "no pocket, or a missing ball",
    throwsError(() =>
      pocketedBalls({ balls, pockets: [], result: result(["a", "b", "c"]) }),
    ) &&
      throwsError(() =>
        pocketedBalls({ balls, pockets: [corner], result: result(["a"]) }),
      ),
  );
}
