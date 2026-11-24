import { projectileContinue } from "@automovie/engine";
import type {
  IAutoMovieHit,
  IAutoMovieProjectile,
  IAutoMovieProjectileContinue,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../internal/nclose";

/**
 * A surface supplies compressive reaction, never a tensile attachment.
 *
 * With restitution one, a 0.1 m/s ceiling impact rebounds downward and falls
 * under downward gravity despite the supplied 0.1 m rolling radius. The
 * matching floor impact rises only 0.1²/(2g), below that radius, and rolls.
 * Zero normal gravity does not return a bounce to the surface. An explicit
 * ceiling roll must refuse the tensile reaction it would require, whereas
 * a neutral-gravity tangential roll retains its speed and moves v*t.
 *
 * Scenarios:
 *
 * 1. A unit-restitution ceiling rebound falls away under downward gravity.
 * 2. The matching floor impact has a sub-radius rebound and rolls.
 * 3. Zero gravity keeps a bounce in flight and a tangential roll at speed.
 * 4. An explicitly requested roll against outward gravity is refused.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Actual public continuation outputs and readback distinguish ceiling flight, compressive floor settlement, neutral flight, refused tensile roll and a neutral tangential roll.
 * @evidence contracts/development/testing.md#independent-expectations Restitution one reverses the 0.1 m/s normal velocity. The floor rebound height is 0.1²/(2*9.80665), while a ceiling rebound accelerates away; a neutral roll with speed two travels two metres in one second.
 * @evidence contracts/development/testing.md#distinguishing-cases The same gravity with opposite surface normals changes compressive to outward force; zero gravity distinguishes neutral from both. Automatic bounce-to-roll and explicitly requested roll are checked separately.
 * @evidence contracts/development/testing.md#execution-ownership The named unit calls projectileContinue and its public segment reader with independent projectile/contact records. No collider override, private import, process or tolerance alteration is used.
 * @evidence contracts/development/common.md#meaningful-documentation Gives velocities, radius, gravity, unilateral surface premise and the analytic normal-height/neutral-distance expectations.
 */
export function test_physics_projectile_normal_gravity(): void {
  const zero: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
  const gravity: IAutoMovieVector3 = { x: 0, y: -9.80665, z: 0 };
  const ceiling: IAutoMovieProjectile = {
    origin: { x: 0, y: 10, z: 0 },
    velocity: { x: 0, y: 0.1, z: 0 },
    gravity,
  };
  const hit: IAutoMovieHit = {
    time: 0,
    point: ceiling.origin,
    normal: { x: 0, y: -1, z: 0 },
    collider: "ceiling",
  };
  const bounce: IAutoMovieProjectileContinue.Outcome = {
    kind: "bounce",
    restitution: 1,
    friction: 0,
    roll: { radius: 0.1, resistance: 0.1 },
  };
  const departed: IAutoMovieProjectileContinue.Segment = projectileContinue(
    ceiling,
    hit,
    bounce,
  );
  TestValidator.predicate(
    "a ceiling rebound flies away instead of binding to the ceiling",
    departed.kind === "flight" &&
      nclose(departed.projectile.velocity.y, -0.1, 0) &&
      projectileContinue.at(departed, 1).position.y < 10,
  );

  const floor: IAutoMovieProjectileContinue.Segment = projectileContinue(
    { origin: zero, velocity: { x: 0, y: -0.1, z: 0 }, gravity },
    { ...hit, point: zero, normal: { x: 0, y: 1, z: 0 }, collider: "floor" },
    bounce,
  );
  TestValidator.predicate(
    "a sub-radius rebound under inward gravity rolls",
    floor.kind === "roll" && nclose(floor.deceleration, 0.1 * 9.80665, 0),
  );

  const neutral: IAutoMovieProjectileContinue.Segment = projectileContinue(
    { ...ceiling, gravity: zero },
    hit,
    bounce,
  );
  TestValidator.predicate(
    "zero gravity cannot return an outward bounce to its surface",
    neutral.kind === "flight" && nclose(neutral.projectile.velocity.y, -0.1, 0),
  );

  let refused: boolean = false;
  try {
    projectileContinue(ceiling, hit, { kind: "roll", resistance: 0.1 });
  } catch (error) {
    refused = error instanceof RangeError;
  }
  TestValidator.predicate(
    "an explicit tensile ceiling roll is refused",
    refused,
  );

  const rolling: IAutoMovieProjectileContinue.Segment = projectileContinue(
    { ...ceiling, gravity: zero, velocity: { x: 2, y: 0, z: 0 } },
    hit,
    { kind: "roll", resistance: 0.1 },
  );
  const at: ReturnType<typeof projectileContinue.at> = projectileContinue.at(
    rolling,
    1,
  );
  TestValidator.predicate(
    "neutral normal gravity leaves a tangential roll at constant speed",
    rolling.kind === "roll" &&
      nclose(rolling.deceleration, 0, 0) &&
      nclose(at.position.x, 2, 0) &&
      nclose(at.position.y, 10, 0) &&
      nclose(at.velocity.x, 2, 0),
  );
}
