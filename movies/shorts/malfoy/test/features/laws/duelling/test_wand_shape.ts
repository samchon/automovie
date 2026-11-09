import { TestValidator } from "@nestia/e2e";

import { harryPotter } from "../../../../src/entities/cast/student/harryPotter";
import { Student } from "../../../../src/entities/cast/student/Student";
import type { IBodyPosture } from "../../../../src/laws/body/IBodyPosture";
import { IBodyState } from "../../../../src/laws/body/IBodyState";
import { PostureFrame } from "../../../../src/laws/body/PostureFrame";
import { DuelLaw } from "../../../../src/laws/duelling/DuelLaw";
import { WandShape } from "../../../../src/laws/duelling/WandShape";
import { StudentPose } from "../../../../src/interactions/staging/StudentPose";

/**
 * The wand arm's shapes against the duel study: the cast holds still
 * through the aim and flicks 7 cm up at the gesture's peak; the sweep starts
 * one sweep time before the contact and reaches 0.25 m across to the own
 * left; the shield's wand hand is raised at the end of the gesture and back
 * down after the fade; the underarm turn makes a full turn with the joined
 * hands above the head.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Evaluates each shape at its defining seconds.
 * @evidence contracts/development/testing.md#independent-expectations Aim, gesture, sweep and fade times from DuelLaw's study values.
 * @evidence contracts/development/testing.md#distinguishing-cases Before, at and after each threshold.
 * @evidence contracts/development/testing.md#execution-ownership Pure functions only.
 */
export function test_wand_shape(): void {
  const harry: Student = new Student(harryPotter);
  const m = harry.measure;
  const p: IBodyPosture = StudentPose.of(IBodyState.standing({ x: 0, y: 0, z: 0 }, 0), m, Object.assign((): undefined => undefined, {}), 0, 0);
  const hand = p.hands.right.point;
  TestValidator.predicate("the aim holds still", WandShape.cast(p, 0, DuelLaw.AIM).hands.right.point.y === hand.y);
  const peak: number = DuelLaw.AIM + (DuelLaw.GESTURE + 0.15) / 2;
  TestValidator.predicate("the flick peaks 7 cm up", Math.abs(WandShape.cast(p, 0, peak).hands.right.point.y - hand.y - 0.07) < 1e-9);
  const contact: number = 0.5;
  TestValidator.predicate("the sweep has not begun one sweep time before the contact", WandShape.deflect(p, 0, contact - DuelLaw.SWEEP, contact).hands.right.point.x === hand.x);
  const swept: number = WandShape.deflect(p, 0, contact - DuelLaw.SWEEP + 0.175, contact).hands.right.point.x - hand.x;
  TestValidator.predicate(`the sweep reaches 0.25 m to the own left (${swept.toFixed(3)})`, Math.abs(swept - 0.25) < 1e-9);
  const raised = PostureFrame.onTrunk(p, 0.5, -0.1, m.shoulder - m.hip + 0.12);
  const shield = WandShape.shield(p, m, DuelLaw.GESTURE, 2).hands.right.point;
  TestValidator.predicate("the shield's wand hand is raised at the end of the gesture", Math.hypot(shield.x - raised.x, shield.y - raised.y, shield.z - raised.z) < 1e-9);
  TestValidator.predicate("the wand hand is down after the fade", WandShape.shield(p, m, 2, 2).hands.right.point.y === hand.y);
  const turned = WandShape.turnUnder(p, m, 0, 1);
  TestValidator.predicate("the underarm turn is a full turn with the hands above the head", Math.abs(turned.heading - 2 * Math.PI) < 1e-9 && turned.hands.right.point.y > m.stature);
}
