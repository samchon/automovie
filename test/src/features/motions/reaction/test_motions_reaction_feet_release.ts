import type {
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  ReactionFeet
} from "../../../../../packages/motions/src/reaction/internal/ReactionFeet";
import {
  poseBones
} from "../../../../../packages/motions/src/posture/internal/poseBones";
import {
  resolveHumanPosture
} from "../../../../../packages/motions/src/posture/internal/resolveHumanPosture";
import { strict as assert } from "node:assert";

import { humanFixtureBody } from "../../internal/fixtures/humanFixtureBody";
import { motionActionContext } from "../../internal/motionActionContext";
import { syntheticHumanPlan } from "../../internal/synthetic/syntheticHumanPlan";
import { vclose } from "../../internal/vclose";

/** The 0.1 s midpoint uses a decimal subtraction and FK translations. */
const ROUNDING_METRES: number = 32 * Number.EPSILON;

/**
 * Check how a planted foot releases into the authored posture.
 *
 * Scenarios:
 *
 * 1. Prepare a 0.5 s release from one base read. The foot stays planted at
 *    release and at the earlier 0.49 s read.
 * 2. At 0.6 s the unplanted goal is halfway between the heel plant and the
 *    direct foot shifted 0.1 m by the root. At 0.7 s the extra goal is gone.
 * 3. Read the release and its midpoint out of order. The midpoint repeats and
 *    the base reads follow the asserted order.
 *
 * @evidence contracts/development/common.md#meaningful-documentation The scenarios specify the release seconds, plant state and base observation order.
 * @evidence contracts/development/testing.md#behavioral-verification Preparation captures one heel and playback blends toward the moving direct pose through the release window.
 * @evidence contracts/development/testing.md#independent-expectations The test reconstructs the midpoint from a separately posed direct foot, literal root displacement and a half-weight average.
 */
export async function test_motions_reaction_feet_release(): Promise<void> {
  const body: IAutoMovieMotionHumanBody = await humanFixtureBody("m-average");
  const { entry } = motionActionContext(body, {});
  const authored: IAutoMovieMotionHumanPosture = { ...entry.posture, limbs: {} };
  const direct: IAutoMovieResolvedBone = poseBones(
    body,
    resolveHumanPosture(body, authored),
  ).get("leftFoot")!;
  const reads: number[] = [];
  const base: IAutoMovieMotionHumanActionPlan = {
    ...syntheticHumanPlan({ duration: 1 }),
    posture: (seconds: number): IAutoMovieMotionHumanPosture => {
      reads.push(seconds);
      return {
        ...authored,
        root: {
          ...authored.root,
          x: authored.root.x + Math.max(0, seconds - 0.5),
        },
      };
    },
  };
  const held: IAutoMovieMotionHumanActionPlan = ReactionFeet.hold(
    base, entry, body, 0.5, 0.25, true,
  );
  assert.deepEqual(reads, [0.5]);
  const middle: IAutoMovieHumanLimbGoal | undefined =
    held.posture(0.6).limbs.leftLeg;
  const release: IAutoMovieHumanLimbGoal | undefined =
    held.posture(0.5).limbs.leftLeg;
  assert(release?.planted && middle?.planted === false);
  assert.deepEqual(held.posture(0.49).limbs.leftLeg, release);
  const expected: IAutoMovieVector3 = {
    x: (release.point.x + direct.worldPosition.x + 0.1) / 2,
    y: (release.point.y + direct.worldPosition.y) / 2,
    z: (release.point.z + direct.worldPosition.z) / 2,
  };
  assert(vclose(middle.point, expected, ROUNDING_METRES));
  assert.equal(held.posture(0.7).limbs.leftLeg, undefined);
  assert.deepEqual(held.posture(0.6).limbs.leftLeg, middle);
  assert.deepEqual(reads, [0.5, 0.6, 0.5, 0.49, 0.7, 0.6]);
}
