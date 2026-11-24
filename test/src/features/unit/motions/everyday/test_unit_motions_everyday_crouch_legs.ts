import { Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  HumanFrame,
  crouchLegs,
  hipJoints,
  stand,
} from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { humanFixtureBody } from "../../../internal/fixtures/humanFixtureBody";
import { vclose } from "../../../internal/vclose";

/** Rounding of the leg's closed-form geometry, metres. */
const ROUNDING: number = 1e-9;

/**
 * `crouchLegs` places a crouch's legs at a share of its descent: each hip joint
 * over its ankle by the shank's and the thigh's tilts, `hip = ankle + up (shank
 * cos(a s) + thigh cos(b s)) + forward (shank sin(a s) - thigh sin(b s))`, the
 * root moved by the two hips' mean offset; flat feet stay where they stand, and
 * a lifted heel rises about the toes' joint by what the ankle's dorsiflexion
 * leaves of the shank's tilt, the toes extending by as much.
 *
 * The body is built whole (`humanFixtureBody`): the legs read the rig's hip
 * joints and feet.
 *
 * Scenarios, the average man standing at the origin facing +Z, a crouch whose
 * shank tilts 30 and thigh 60 degrees at its lowest:
 *
 * 1. At share 0 with flat heels the root and both ankles stay where they stand.
 * 2. At share 1 with flat heels both ankles stay and the root moves to the hips'
 *    closed-form place, lower than standing.
 * 3. With a 20 degree heel and 10 degrees of dorsiflexion, at share 1 the toes
 *    extend 20 degrees and both ankles rise above where they stand.
 */
export async function test_unit_motions_everyday_crouch_legs(): Promise<void> {
  const body: IAutoMovieMotionHumanBody = await humanFixtureBody("m-average");
  const m: IAutoMovieMotionHumanBody["measure"] = body.measure;
  const standing: IAutoMovieMotionHumanPosture = stand.posture(
    body,
    { x: 0, y: 0, z: 0 },
    0,
  );
  const legs = (heel: number, dorsiflexion: number): crouchLegs.AtShare =>
    crouchLegs({
      body,
      m,
      yaw: 0,
      heel,
      dorsiflexion,
      shankTilt: 30,
      thighTilt: 60,
      standing,
    });
  const ankle = (
    posture: IAutoMovieMotionHumanPosture,
    side: AutoMovieHumanSide,
  ): IAutoMovieVector3 => posture.limbs[`${side}Leg`]!.point;
  const flat: crouchLegs.AtShare = legs(0, 0);
  const rest: IAutoMovieMotionHumanPosture = flat(standing, 0)(0);
  TestValidator.predicate(
    "at the start",
    vclose(rest.root, standing.root, ROUNDING) &&
      vclose(ankle(rest, "left"), ankle(standing, "left"), ROUNDING) &&
      vclose(ankle(rest, "right"), ankle(standing, "right"), ROUNDING),
  );
  const rad = (deg: number): number => (deg * Math.PI) / 180;
  const joints: Record<AutoMovieHumanSide, IAutoMovieVector3> = hipJoints(
    body,
    standing.root,
    HumanFrame.turn(0),
  );
  let offset: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
  for (const side of ["left", "right"] as const) {
    const hip: IAutoMovieVector3 = Vector3.add(ankle(standing, side), {
      x: 0,
      y: m.shank * Math.cos(rad(30)) + m.thigh * Math.cos(rad(60)),
      z: m.shank * Math.sin(rad(30)) - m.thigh * Math.sin(rad(60)),
    });
    offset = Vector3.addScaled(
      offset,
      Vector3.subtract(hip, joints[side]),
      0.5,
    );
  }
  const low: IAutoMovieMotionHumanPosture = flat(standing, 1)(0);
  TestValidator.predicate(
    "at the lowest",
    vclose(low.root, Vector3.add(standing.root, offset), ROUNDING) &&
      low.root.y < standing.root.y &&
      vclose(ankle(low, "left"), ankle(standing, "left"), ROUNDING) &&
      vclose(ankle(low, "right"), ankle(standing, "right"), ROUNDING),
  );
  const heeled: IAutoMovieMotionHumanPosture = legs(20, 10)(standing, 1)(0);
  TestValidator.predicate(
    "on the toes",
    heeled.joints.leftToes![0] === 20 &&
      heeled.joints.rightToes![0] === 20 &&
      ankle(heeled, "left").y > ankle(standing, "left").y &&
      ankle(heeled, "right").y > ankle(standing, "right").y,
  );
}
