import { AutoMovieEngineQuaternion } from "@automovie/engine";
import type {
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionClock,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanPrimitive,
  IAutoMovieQuaternion,
} from "@automovie/interface";
import {
  AutoMovieMotionClock
} from "../../../../../packages/motions/src/compose/internal/AutoMovieMotionClock";
import {
  AutoMovieMotionHumanGoal
} from "../../../../../packages/motions/src/compose/internal/AutoMovieMotionHumanGoal";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";
import { throwsError } from "../../internal/throwsError";
import { vclose } from "../../internal/vclose";

/** Rounding of a lerp and a slerp. */
const ROUNDING: number = 1e-12;

/** The base action's planted goal. */
const FROM: IAutoMovieHumanLimbGoal = {
  point: { x: 0, y: 1, z: 0 },
  bend: { x: 0, y: 1, z: -1 },
  rotation: { x: 0, y: 0, z: 0, w: 1 },
  planted: true,
};

/** The goal a primitive asks. */
const TO: IAutoMovieHumanLimbGoal = {
  point: { x: 0.4, y: 1.2, z: 0.8 },
  bend: { x: 0.4, y: 1, z: -0.2 },
  rotation: AutoMovieEngineQuaternion.fromAxisAngle({ x: 0, y: 1, z: 0 }, 80),
  contact: { x: 0.4, y: 1.25, z: 0.8 },
};

/** A posture holding the base goal on the right arm. */
const POSTURE: IAutoMovieMotionHumanPosture = {
  root: { x: 0, y: 0.9, z: 0 },
  yaw: 0,
  pitch: 0,
  roll: 0,
  joints: {},
  limbs: { rightArm: FROM },
};

/**
 * `AutoMovieMotionHumanGoal` moves a limb from the goal its base gives toward a
 * primitive's: `mix` moves the end joint and the bend on straight lines and
 * slerps the rotation by one clamped weight, keeps the asked goal's contact, is
 * not planted between the ends, is either goal itself at its end, and refuses
 * goals in different frames; `toward` mixes the limb's present goal, refusing a
 * limb with none; `pulse` writes the limb from its rise's first instant to its
 * fall's last at the clock's envelope times a size.
 *
 * Scenarios:
 *
 * 1. At a quarter: the point (0.1, 1.05, 0.2), the bend (0.1, 1, −0.8), the
 *    rotation 20 degrees about +Y, the contact the asked goal's, not planted.
 * 2. At −1 and 2 the goals themselves; a goal on the chest mixed with one in the
 *    world is refused.
 * 3. `toward` on a limb with no goal and no origin is refused.
 * 4. A pulse rising over 0 to 1 s and falling over 2 to 3 s at size 0.5 claims the
 *    right arm from 0 to 3 s and at 1.5 s writes half the way.
 */
export function test_motions_compose_human_goal(): void {
  // 1. A quarter.
  const q: IAutoMovieHumanLimbGoal = AutoMovieMotionHumanGoal.mix(
    FROM,
    TO,
    0.25,
  );
  const twenty: IAutoMovieQuaternion = AutoMovieEngineQuaternion.fromAxisAngle(
    { x: 0, y: 1, z: 0 },
    20,
  );
  TestValidator.predicate(
    "a quarter of the way",
    vclose(q.point, { x: 0.1, y: 1.05, z: 0.2 }, ROUNDING) &&
      vclose(q.bend, { x: 0.1, y: 1, z: -0.8 }, ROUNDING) &&
      Math.abs(
        Math.abs(
          q.rotation!.x * twenty.x +
            q.rotation!.y * twenty.y +
            q.rotation!.z * twenty.z +
            q.rotation!.w * twenty.w,
        ) - 1,
      ) <= ROUNDING &&
      q.contact === TO.contact &&
      q.planted === undefined,
  );

  // 2. The ends and the frames.
  TestValidator.predicate(
    "the goals at the ends; different frames refused",
    AutoMovieMotionHumanGoal.mix(FROM, TO, -1) === FROM &&
      AutoMovieMotionHumanGoal.mix(FROM, TO, 2) === TO &&
      throwsError((): unknown =>
        AutoMovieMotionHumanGoal.mix(FROM, { ...TO, on: "chest" }, 0.5),
      ),
  );

  // 3. No goal to leave.
  TestValidator.predicate(
    "a limb with no goal is refused",
    throwsError(
      (): unknown =>
        AutoMovieMotionHumanGoal.toward(
          {
            limb: "leftArm",
            from: 0,
            to: 1,
            goal: (): IAutoMovieHumanLimbGoal => TO,
            weight: (): number => 0.5,
          },
          POSTURE,
          0.5,
        ),
      "has no goal to leave",
    ),
  );

  // 4. A pulse.
  const clock: IAutoMovieMotionClock = AutoMovieMotionClock(3, [
    { name: "a", seconds: 1 },
    { name: "b", seconds: 2 },
  ]);
  const pulse: IAutoMovieMotionHumanPrimitive = AutoMovieMotionHumanGoal.pulse(
    clock,
    "rightArm",
    ["start", "a"],
    ["b", "end"],
    (): IAutoMovieHumanLimbGoal => TO,
    undefined,
    0.5,
  );
  const written: IAutoMovieHumanLimbGoal = pulse.write(POSTURE, 1.5).limbs
    .rightArm!;
  TestValidator.predicate(
    "the pulse's span and weight",
    pulse.channels.join() === "rightArm" &&
      pulse.from === 0 &&
      pulse.to === 3 &&
      nclose(written.point.x, 0.2, ROUNDING),
  );
}
