import type {
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanKneeBend,
  HumanFrame,
} from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { humanFixtureBody } from "../../../internal/fixtures/humanFixtureBody";
import { vclose } from "../../../internal/vclose";

/** Rounding of two yaw rotations, metres. */
const ROUNDING: number = 1e-12;

/**
 * `AutoMovieMotionHumanKneeBend` is a leg's bend hint: a point a metre ahead of
 * the rest knee placed by the body's root and heading, ahead along the foot's
 * heading, splayed outward on each side; `prepare` gives the same point for a
 * fixed foot heading.
 *
 * The body is built whole (`humanFixtureBody`) for its rest knees.
 *
 * Scenarios, the body at (1, 0, 2) facing 90 degrees:
 *
 * 1. The left knee's hint is a metre along +X from the placed rest knee.
 * 2. With the foot turned 20 degrees out, the left hint swings by +20 and the
 *    right by −20.
 * 3. `prepare` gives `at`'s point, also after the heading changes.
 * 4. The fixed knee offset survives caller edits before the first query. Current
 *    yaw still rotates the offset on every read.
 */
export async function test_unit_motions_compose_knee_bend(): Promise<void> {
  const body: IAutoMovieMotionHumanBody = await humanFixtureBody("m-average");
  const posture: Pick<IAutoMovieMotionHumanPosture, "root" | "yaw"> = {
    root: { x: 1, y: 0, z: 2 },
    yaw: 90,
  };
  const knee = (side: "left" | "right"): IAutoMovieVector3 =>
    HumanFrame.point(
      { origin: posture.root, yaw: posture.yaw },
      body.rest.get(`${side}LowerLeg`)!,
    );
  const ahead = (side: "left" | "right", heading: number): IAutoMovieVector3 =>
    HumanFrame.point(
      { origin: knee(side), yaw: heading },
      { x: 0, y: 0, z: 1 },
    );

  // 1. Ahead along the heading.
  TestValidator.predicate(
    "a metre ahead of the rest knee",
    vclose(
      AutoMovieMotionHumanKneeBend.at(body, posture, "left"),
      { ...knee("left"), x: knee("left").x + 1 },
      ROUNDING,
    ),
  );

  // 2. Splayed.
  TestValidator.predicate(
    "splayed outward on each side",
    vclose(
      AutoMovieMotionHumanKneeBend.at(body, posture, "left", 90, 20),
      ahead("left", 110),
      ROUNDING,
    ) &&
      vclose(
        AutoMovieMotionHumanKneeBend.at(body, posture, "right", 90, 20),
        ahead("right", 70),
        ROUNDING,
      ),
  );

  // 3. Prepared.
  const read: ReturnType<typeof AutoMovieMotionHumanKneeBend.prepare> =
    AutoMovieMotionHumanKneeBend.prepare(body, "left", 90, 20);
  const turned: Pick<IAutoMovieMotionHumanPosture, "root" | "yaw"> = {
    ...posture,
    yaw: 30,
  };
  TestValidator.predicate(
    "the prepared hint as the cold one",
    vclose(
      read(posture),
      AutoMovieMotionHumanKneeBend.at(body, posture, "left", 90, 20),
      ROUNDING,
    ) &&
      vclose(
        read(turned),
        AutoMovieMotionHumanKneeBend.at(body, turned, "left", 90, 20),
        ROUNDING,
      ),
  );

  const original: IAutoMovieVector3 = body.rest.get("leftLowerLeg")!;
  original.x = 0.25;
  original.y = -0.5;
  original.z = 0.125;
  const fixed: ReturnType<typeof AutoMovieMotionHumanKneeBend.prepare> =
    AutoMovieMotionHumanKneeBend.prepare(body, "left", 0);
  original.x = 4;
  original.z = 8;
  const root: IAutoMovieVector3 = { x: 1, y: 2, z: 3 };
  TestValidator.predicate(
    "rest geometry is fixed before any yaw query",
    vclose(fixed({ root, yaw: 0 }), { x: 1.25, y: 1.5, z: 4.125 }, ROUNDING) &&
      vclose(
        fixed({ root, yaw: 90 }),
        { x: 1.125, y: 1.5, z: 3.75 },
        ROUNDING,
      ) &&
      vclose(fixed({ root, yaw: 0 }), { x: 1.25, y: 1.5, z: 4.125 }, ROUNDING),
  );
}
