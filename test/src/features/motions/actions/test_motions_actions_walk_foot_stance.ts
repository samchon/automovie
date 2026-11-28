import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanFoot,
  IAutoMovieMotionHumanWalkFoot,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  HumanFoot
} from "../../../../../packages/motions/src/posture/internal/HumanFoot";
import {
  humanFootOffset
} from "../../../../../packages/motions/src/posture/internal/humanFootOffset";
import {
  walkFootStance
} from "../../../../../packages/motions/src/actions/internal/walkFootStance";
import { TestValidator } from "@nestia/e2e";

import { humanFixture } from "../../internal/fixtures/humanFixture";
import { nclose } from "../../internal/nclose";
import { vclose } from "../../internal/vclose";

/** Rounding of a pivot's rotation and its read-back, degrees. */
const DEGREES: number = 1e-9;

/** Rounding of a pivot's turned sole point, metres. */
const METRES: number = 1e-12;

/**
 * `walkFootStance` rolls a stance foot through its rockers: from `STRIKE`
 * toes-up about the heel to flat over `HEEL_SHARE` of the stance, flat, then
 * about the ball to its push pitch at toe-off over the last `PUSH_SHARE`, the
 * toes extending by the pitch so they stay on the floor. Each rocker turns
 * about a fixed point, so neither the heel nor the ball slides.
 *
 * The stance here strikes at 1 s and leaves at 2 s, pushing to 40 degrees
 * toes-down: the heel rocker ends at 1.12 s and the forefoot rocker starts at
 * 1.5 s.
 *
 * The foot is the stored average man's sole sockets on a left ankle at rest
 * 0.08 m up and its toes' joint 0.13 m ahead of it and 0.06 m lower.
 *
 * Scenarios:
 *
 * 1. At the strike the foot is `STRIKE` toes-up, its toes unflexed.
 * 2. Between the rockers it stands on its footprint, flat.
 * 3. At toe-off it is at its push pitch, the toes extended by as much.
 * 4. Over the heel rocker the heel keeps its place, and over the forefoot rocker
 *    the ball keeps its place.
 *
 * @evidence contracts/development/common.md#meaningful-documentation A stance foot rocks over its heel and forefoot while their respective world contacts stay fixed.
 * @evidence contracts/development/testing.md#behavioral-verification Calls foot-rocker placement at strike, flat stance, toe-off and inside the two rocker windows on the stored sole geometry.
 * @evidence contracts/development/testing.md#independent-expectations A fixed pivot carries the known local heel or ball to the same world point. The prescribed strike and 40-degree push fix the toe and foot orientation checks.
 */
export async function test_motions_actions_walk_foot_stance(): Promise<void> {
  const body: humanFootOffset.IBody = {
    rest: new Map<AutoMovieHumanoidBone, IAutoMovieVector3>([
      ["leftFoot", { x: 0.09, y: 0.08, z: 0 }],
      ["leftToes", { x: 0.09, y: 0.02, z: 0.13 }],
    ]),
    surfaces: (await humanFixture("m-average")).surfaces,
  };
  const flat: IAutoMovieMotionHumanFoot.IPlacement = {
    ankle: { x: 0.1, y: 0.08, z: 0.3 },
    rotation: HumanFoot.rotation(0, 0),
  };
  const foot: (seconds: number) => IAutoMovieMotionHumanWalkFoot.IFoot =
    walkFootStance(body, "left", flat, 0, 1, 2, -40, 1);
  const pitch: (seconds: number) => number = (seconds: number): number =>
    HumanFoot.headingPitch(foot(seconds).placement.rotation).pitch;

  // 1. The strike.
  TestValidator.predicate(
    "toes-up at the strike",
    nclose(pitch(1), walkFootStance.STRIKE, DEGREES) && foot(1).toes === 0,
  );

  // 2. Flat between the rockers.
  const between: IAutoMovieMotionHumanWalkFoot.IFoot = foot(1.3);
  TestValidator.predicate(
    "flat on its footprint",
    vclose(between.placement.ankle, flat.ankle, METRES) &&
      nclose(pitch(1.3), 0, DEGREES) &&
      between.toes === 0,
  );

  // 3. Toe-off.
  TestValidator.predicate(
    "at the push pitch",
    nclose(pitch(2), -40, DEGREES) && nclose(foot(2).toes, 40, DEGREES),
  );

  // 4. No slide.
  const heel: IAutoMovieVector3 = HumanFoot.point(body, "left", "heel", flat);
  const ball: IAutoMovieVector3 = HumanFoot.point(body, "left", "mtp", flat);
  TestValidator.predicate(
    "the heel holds over the heel rocker",
    vclose(
      HumanFoot.point(body, "left", "heel", foot(1.05).placement),
      heel,
      METRES,
    ),
  );
  TestValidator.predicate(
    "the ball holds over the forefoot rocker",
    vclose(
      HumanFoot.point(body, "left", "mtp", foot(1.8).placement),
      ball,
      METRES,
    ),
  );
}
