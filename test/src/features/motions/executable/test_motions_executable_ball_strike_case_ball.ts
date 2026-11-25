import type {
  IAutoMovieMotionHumanProp,
  IAutoMovieRigidTransform,
} from "@automovie/interface";
import { HumanBall, ballStrikeCaseBall } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { vclose } from "../../internal/vclose";

/**
 * `ballStrikeCaseBall` stages a ball for the kick captures with the contact
 * `createBall` declares: a power grip at its centre whose aperture is its
 * diameter, so a law reading the ball (`HumanBall.placed`) finds its own centre
 * and radius.
 *
 * Scenarios:
 *
 * 1. An 0.11 m ball at (0.2, 0.11, 0.4) reads back that centre and radius.
 */
export function test_motions_executable_ball_strike_case_ball(): void {
  const prop: IAutoMovieMotionHumanProp = ballStrikeCaseBall(
    { x: 0.2, y: 0.11, z: 0.4 },
    0.11,
  );
  const read: HumanBall.IBall = HumanBall.placed(
    prop,
    (): IAutoMovieRigidTransform => prop.frame,
    "ball",
  );
  TestValidator.predicate(
    "the ball's own centre and radius",
    vclose(read.centre, { x: 0.2, y: 0.11, z: 0.4 }, 1e-12) &&
      Math.abs(read.radius - 0.11) <= 1e-12 &&
      prop.affordances![0]!.grip === "power",
  );
}
