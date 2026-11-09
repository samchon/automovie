import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";
import { HumanFoot } from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

/**
 * A planted foot that reaches a rotation other than the one asked for turns
 * about its contact and its toes take back the lost pitch: the heel-off of
 * the terminal stance rocker.
 *
 * The foot is plain geometry: an ankle with a ball 0.14 m ahead and 0.07 m
 * below it and a heel 0.05 m behind at the same depth, in the foot's rest
 * frame (+Z toes, +Y up).
 *
 * Scenarios:
 * 1. Asked flat, reached 15° toes-down: the ball stays on its anchor within
 *    1e-12 m, the heel rises above the floor, and the toes extend by 15°.
 * 2. Asked 10° toes-down, reached 25° toes-down: the toes extend by 15°.
 * 3. Reached more toes-up than asked: the toes do not extend.
 * 4. Metamorphic: turning the rotations and the anchor 40° about the vertical
 *    turns the ankle the same way and leaves the toes' extension unchanged.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls the public helper and checks the contact, the heel and the toes; a contact not held or a sign error fails.
 * @evidence contracts/development/testing.md#independent-expectations The contact's world point and the pitch difference are computed by hand from the definitions; the vertical turn is a metamorphic relation.
 * @evidence contracts/development/testing.md#distinguishing-cases Covers a flat ask, a pitched ask, a toes-up reach and a turned frame.
 * @evidence contracts/development/testing.md#execution-ownership A pure in-memory unit on plain geometry; it runs in CI.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 4 scenarios and what each pins.
 */
export function test_motion_heel_off(): void {
  const ball: IAutoMovieVector3 = { x: 0, y: -0.07, z: 0.14 };
  const heel: IAutoMovieVector3 = { x: 0, y: -0.07, z: -0.05 };
  const pitch = (degrees: number, yaw: number = 0): IAutoMovieQuaternion =>
    HumanFoot.rotation(yaw, degrees);
  const anchor: IAutoMovieVector3 = { x: 0.1, y: 0, z: 1 };

  // 1. Flat ask, toes-down reach.
  const off = HumanFoot.heelOff(pitch(0), pitch(-15), anchor, ball);
  const held: IAutoMovieVector3 = Vector3.add(
    off.ankle,
    Quaternion.rotateVector(pitch(-15), ball),
  );
  TestValidator.predicate(
    "the ball stays on its anchor",
    Vector3.length(Vector3.subtract(held, anchor)) < 1e-12,
  );
  TestValidator.predicate(
    "the heel rises",
    Vector3.add(off.ankle, Quaternion.rotateVector(pitch(-15), heel)).y > 0.01,
  );
  TestValidator.predicate(
    "the toes extend by the lost 15 degrees",
    Math.abs(off.toes - 15) < 1e-9,
  );

  // 2. Pitched ask.
  TestValidator.predicate(
    "the toes extend by 15 degrees from a pitched ask",
    Math.abs(
      HumanFoot.heelOff(pitch(-10), pitch(-25), anchor, ball).toes - 15,
    ) < 1e-9,
  );

  // 3. Toes-up reach.
  TestValidator.equals(
    "no extension when the foot is more toes-up",
    HumanFoot.heelOff(pitch(0), pitch(5), anchor, ball).toes,
    0,
  );

  // 4. A turn about the vertical.
  const turn: IAutoMovieQuaternion = Quaternion.fromAxisAngle(
    { x: 0, y: 1, z: 0 },
    40,
  );
  const turned = HumanFoot.heelOff(
    pitch(0, 40),
    pitch(-15, 40),
    Quaternion.rotateVector(turn, anchor),
    ball,
  );
  TestValidator.predicate(
    "the ankle turns with the frame",
    Vector3.length(
      Vector3.subtract(turned.ankle, Quaternion.rotateVector(turn, off.ankle)),
    ) < 1e-12,
  );
  TestValidator.predicate(
    "the toes' extension is unchanged by the turn",
    Math.abs(turned.toes - off.toes) < 1e-9,
  );
}
