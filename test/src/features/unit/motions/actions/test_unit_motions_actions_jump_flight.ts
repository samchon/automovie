import {
  AutoMovieGravity,
  Quaternion,
  inertializeOffset,
} from "@automovie/engine";
import type {
  IAutoMovieHumanPostureRotation,
  IAutoMovieMotionHumanPosture,
  IAutoMovieQuaternion,
} from "@automovie/interface";
import { jumpAirborneTurning, jumpFlight } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../../internal/nclose";
import { throwsError } from "../../../internal/throwsError";

/** Rounding of a few square roots and products. */
const ROUNDING: number = 1e-12;

/** Standing still, unturned. */
const STILL: IAutoMovieMotionHumanPosture = {
  root: { x: 0, y: 0.9, z: 0 },
  yaw: 0,
  pitch: 0,
  roll: 0,
  joints: {},
  limbs: {},
};

/**
 * A jump's flight: `jumpFlight.solve` is the centre's drag-free projectile from
 * take-off to touchdown, `vy = √(2 g apex)`, the flight time solving the
 * landing height and the horizontal speed covering the distance in it, the apex
 * defaulting to 0.06 hip heights plus a tenth of the length plus the climb;
 * `jumpAirborneTurning` declares a turning flight's members and owns the
 * rotation the flight pass hands back: it reads the handed rotation once, at
 * touchdown, and the landing carries that touchdown turn away by Bollo's
 * inertialization over the absorption.
 *
 * Scenarios:
 *
 * 1. A 1 m jump on the level with a 0.5 m apex: vy = √g, T = 2 vy / g, the launch
 *    1 / T along +X, landing at −vy.
 * 2. With no apex asked at hip height 0.9 onto a step 0.2 m up: apex 0.054 + 0.1
 *
 *    - 0.2; an apex of 0.1 under that climb is refused.
 * 3. No turns declare no flight members; a backward somersault is −1 turns, a left
 *    salto's frame a quarter turn about +Y.
 * 4. Handed a 60-degree turn about +X, the turning reads it once, at touchdown
 *    (1.2 s of a 2 s jump): through the absorption to 1.6 s the landing turns
 *    by inertializeOffset(60, 0, 0.4, t − 1.2), and before or after it the
 *    posture is unchanged.
 */
export function test_unit_motions_actions_jump_flight(): void {
  const g: number = AutoMovieGravity.STANDARD;

  // 1. The projectile.
  const flight: jumpFlight.IFlight = jumpFlight.solve(
    { x: 0, y: 1, z: 0 },
    { x: 1, y: 1, z: 0 },
    0.5,
    0.9,
    0,
  );
  const vy: number = Math.sqrt(g);
  TestValidator.predicate(
    "the drag-free projectile",
    nclose(flight.vy, vy, ROUNDING) &&
      nclose(flight.T, (2 * vy) / g, ROUNDING) &&
      nclose(flight.launch.x, g / (2 * vy), ROUNDING) &&
      nclose(flight.land.y, -vy, ROUNDING),
  );

  // 2. The default apex and the climb.
  TestValidator.predicate(
    "the default apex clears the climb; a lower one is refused",
    nclose(
      jumpFlight.solve(
        { x: 0, y: 1, z: 0 },
        { x: 1, y: 1.2, z: 0 },
        undefined,
        0.9,
        0.2,
      ).apex,
      0.054 + 0.1 + 0.2,
      ROUNDING,
    ) &&
      throwsError((): unknown =>
        jumpFlight.solve(
          { x: 0, y: 1, z: 0 },
          { x: 1, y: 1.2, z: 0 },
          0.1,
          0.9,
          0.2,
        ),
      ),
  );

  // 3. The declared members.
  const backward: jumpAirborneTurning.ITurning = jumpAirborneTurning(
    { somersault: 1, way: "backward" },
    0.5,
    1.2,
    2,
    1.6,
  );
  const left: jumpAirborneTurning.ITurning = jumpAirborneTurning(
    { somersault: 1, way: "left" },
    0.5,
    1.2,
    2,
    1.6,
  );
  const quarter: IAutoMovieQuaternion = Quaternion.fromAxisAngle(
    { x: 0, y: 1, z: 0 },
    90,
  );
  const momentum: NonNullable<
    jumpAirborneTurning.ITurning["declared"]["flight"]
  >["momentum"] = left.declared.flight!.momentum;
  TestValidator.predicate(
    "the declared turns",
    jumpAirborneTurning(undefined, 0.5, 1.2, 2, 1.6).declared.flight ===
      undefined &&
      backward.declared.flight?.momentum.kind === "turns" &&
      backward.declared.flight.momentum.somersault === -1 &&
      momentum.kind === "turns" &&
      momentum.frame !== undefined &&
      Math.abs(
        Math.abs(
          momentum.frame.x * quarter.x +
            momentum.frame.y * quarter.y +
            momentum.frame.z * quarter.z +
            momentum.frame.w * quarter.w,
        ) - 1,
      ) <= ROUNDING,
  );

  // 4. The handback.
  const asked: number[] = [];
  const turn: IAutoMovieHumanPostureRotation = {
    about: { x: 0, y: 1, z: 1 },
    turn: Quaternion.fromAxisAngle({ x: 1, y: 0, z: 0 }, 60),
  };
  backward.declared.airborne!(
    (seconds: number): IAutoMovieHumanPostureRotation => {
      asked.push(seconds);
      return turn;
    },
  );
  const at = (t: number): IAutoMovieMotionHumanPosture =>
    backward.landed(STILL, t);
  const decayed: number = inertializeOffset(60, 0, 0.4, 0.2).value;
  const mid: IAutoMovieMotionHumanPosture = at(1.4);
  TestValidator.predicate(
    "the touchdown turn read once and carried away",
    asked.length === 1 &&
      nclose(asked[0]!, 1.2, ROUNDING) &&
      at(1.1) === STILL &&
      at(1.7) === STILL &&
      mid.rotation !== undefined &&
      nclose(
        (2 * Math.acos(Math.min(1, Math.abs(mid.rotation.turn.w))) * 180) /
          Math.PI,
        decayed,
        1e-9,
      ),
  );
}
