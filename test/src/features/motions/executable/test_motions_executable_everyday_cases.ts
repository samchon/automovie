import { Quaternion, Vector3 } from "@automovie/engine";
import type { IAutoMovieAffordance, IAutoMovieMotionHumanProp, IAutoMovieVector3 } from "@automovie/interface";
import {
  everydayCaseKit,
  everydayGestureSwings,
  everydayPostureCaseObstacle,
  everydayTypeCaseBoard,
  everydayVerdicts,
} from "@automovie/motions/executable/internal";
import { typeText } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";
import { vclose } from "../../internal/vclose";

/** An affordance's world point on a placed prop. */
const world = (
  prop: IAutoMovieMotionHumanProp,
  id: string,
): IAutoMovieVector3 =>
  Vector3.add(
    prop.frame.position,
    Quaternion.rotateVector(
      prop.frame.rotation,
      prop.affordances!.find((c: IAutoMovieAffordance): boolean => c.id === id)!
        .frame.translation,
    ),
  );

/**
 * The everyday capture families' own staging and verdicts.
 *
 * Scenarios:
 *
 * 1. +X and (1, 1, 0) are 45 degrees apart; the second action's peak, a quarter
 *    into a wave over 3 to 4 s, falls at 3.25 s.
 * 2. A tremor of a tenth of the range beside a full peak counts one swing: only
 *    maxima above a quarter of the range count.
 * 3. A kerb 0.2 m high and 0.3 m deep, its near side's middle at (0, 0, 0.5)
 *    before a performer facing +Z, has its edge at (0, 0.2, 0.5) and its top's
 *    middle at (0, 0.2, 0.65).
 * 4. A keyboard placed at (0, 0.75, 0.4) turns its +Z, the typist's side, to -Z
 *    and its key field is `typeText.WIDTH` wide.
 * 5. A 2 degree overshoot fails a 1 degree limit, shown in degrees.
 */
export function test_motions_executable_everyday_cases(): void {
  TestValidator.predicate(
    "the angle and the event",
    nclose(
      everydayCaseKit.angle({ x: 1, y: 0, z: 0 }, { x: 1, y: 1, z: 0 }),
      45,
      1e-9,
    ) &&
      everydayCaseKit.event(
        {
          segments: () => [
            { name: "walk", start: 1, plan: { duration: 2, events: [] } },
            {
              name: "wave",
              start: 3,
              plan: { duration: 1, events: [{ name: "peak", share: 0.25 }] },
            },
          ],
        },
        "a",
        1,
        "peak",
      ) === 3.25,
  );
  TestValidator.equals(
    "the swings above a quarter of the range",
    everydayGestureSwings([0, 0.1, 0, 1, 0]),
    1,
  );
  const kerb: IAutoMovieMotionHumanProp = everydayPostureCaseObstacle({
    at: { x: 0, y: 0, z: 0.5 },
    height: 0.2,
    depth: 0.3,
  });
  const board: IAutoMovieMotionHumanProp = everydayTypeCaseBoard({
    x: 0,
    y: 0.75,
    z: 0.4,
  });
  TestValidator.predicate(
    "the kerb and the keyboard",
    vclose(world(kerb, "edge"), { x: 0, y: 0.2, z: 0.5 }, 1e-12) &&
      vclose(world(kerb, "top"), { x: 0, y: 0.2, z: 0.65 }, 1e-12) &&
      vclose(
        Quaternion.rotateVector(board.frame.rotation, { x: 0, y: 0, z: 1 }),
        { x: 0, y: 0, z: -1 },
        1e-12,
      ) &&
      board.affordances!.find(
        (a: IAutoMovieAffordance): boolean => a.id === "keys",
      )!.width === typeText.WIDTH,
  );
  TestValidator.equals(
    "over the limit",
    everydayVerdicts.within("rom", 2, 1, "deg"),
    { name: "rom", passed: false, detail: "2.00 deg (limit 1.00 deg)" },
  );
}
