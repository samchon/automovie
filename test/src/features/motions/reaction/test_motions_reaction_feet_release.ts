import type {
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  ReactionFeet,
  poseBones,
  resolveHumanPosture,
} from "@automovie/motions/internal";
import { strict as assert } from "node:assert";

import { humanFixtureBody } from "../../internal/fixtures/humanFixtureBody";
import { motionActionContext } from "../../internal/motionActionContext";
import { syntheticHumanPlan } from "../../internal/synthetic/syntheticHumanPlan";
import { vclose } from "../../internal/vclose";

/** The 0.1 s midpoint uses a decimal subtraction and FK translations. */
const ROUNDING_METRES: number = 32 * Number.EPSILON;

/**
 * The release leaves the held footprint and rejoins the authored shape over
 * 0.2 s. A translation of that shape translates its direct foot by the same
 * amount. The prepared heel at release is read exactly once from the base
 * before any out-of-order playback.
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
