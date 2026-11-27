import type {
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  wireFlightTouches
} from "../../../../../packages/motions/src/reaction/internal/wireFlightTouches";
import { strict as assert } from "node:assert";

import { humanFixtureBody } from "../../internal/fixtures/humanFixtureBody";
import { vclose } from "../../internal/vclose";

/** A signed half-weight interpolation and two vector sums use a few ulps. */
const ROUNDING_METRES: number = 8 * Number.EPSILON;

/**
 * A one-second flight touching halfway through has quarter-second ramps
 * around a plateau of one eighth of a second. Each ramp uses two previously
 * resolved endpoints, so interleaved playback reads the flight at the
 * requested seconds alone. At each ramp midpoint the wrist is halfway from
 * its moving local reference to the contact, by minimum-jerk symmetry.
 */
export async function test_motions_reaction_wire_flight_touches(): Promise<void> {
  const body: IAutoMovieMotionHumanBody = await humanFixtureBody("m-average");
  const keys: readonly number[] = [0.1875, 0.4375, 0.5625, 0.8125];
  const reads: number[] = [];
  const observations: number[] = [];
  const root = (seconds: number): IAutoMovieVector3 => ({
    x: seconds,
    y: 0,
    z: 0,
  });
  const held: IAutoMovieMotionHumanActionPlan = {
    duration: 1,
    contacts: [],
    events: [],
    posture: (seconds: number): IAutoMovieMotionHumanPosture => {
      reads.push(seconds);
      return {
        root: root(seconds),
        yaw: 0,
        pitch: 0,
        roll: 0,
        joints: {},
        limbs: keys.includes(seconds)
          ? {
              leftArm: {
                point: { x: seconds, y: 0, z: 0.2 * seconds },
                bend: { x: seconds, y: -0.2, z: 0 },
              },
            }
          : {},
      };
    },
  };
  const plan: IAutoMovieMotionHumanActionPlan = wireFlightTouches.apply(
    {
      body,
      start: 3,
      aim: (_, seconds: number) => {
        observations.push(seconds);
        return {
          point: { x: 0.5, y: 1.4, z: 0 },
          normal: { x: 0, y: 0, z: 1 },
        };
      },
    },
    held,
    1,
    root,
    [{ part: "leftHand", target: { kind: "prop", subject: "rail", point: "rim" }, at: 0.5 }],
  );
  assert.deepEqual(observations, [3.5]);
  assert.deepEqual(reads, keys);
  assert.deepEqual(plan.contacts, [
    {
      part: "leftHand",
      kind: "plant",
      from: 0.4375,
      to: 0.5625,
      support: { kind: "prop", subject: "rail" },
    },
  ]);

  const out: IAutoMovieHumanLimbGoal | undefined = plan.posture(0.6875).limbs.leftArm;
  const in_: IAutoMovieHumanLimbGoal | undefined = plan.posture(0.3125).limbs.leftArm;
  const contact: IAutoMovieHumanLimbGoal | undefined = plan.posture(0.5).limbs.leftArm;
  assert(out && vclose(out.point, { x: 0.59375, y: 0.7, z: 0.07625 }, ROUNDING_METRES));
  assert(in_ && vclose(in_.point, { x: 0.40625, y: 0.7, z: 0.03875 }, ROUNDING_METRES));
  assert(contact?.planted && vclose(contact.point, { x: 0.5, y: 1.4, z: 0.015 }, ROUNDING_METRES));
  assert.deepEqual(plan.posture(0.6875).limbs.leftArm, out);
  assert.deepEqual(reads, [...keys, 0.6875, 0.3125, 0.5, 0.6875]);
}
