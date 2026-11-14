import { createBall, createGlove } from "@automovie/archetypes";
import {
  type AutoMovieComposition,
  Quaternion,
  Vector3,
  quaternionFromAutoMovieBasis,
} from "@automovie/engine";
import type {
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  HumanChain,
  HumanObject,
  HumanPerformance,
  HumanRefusal,
  type HumanSegment,
  type IHumanBody,
  type IHumanProp,
  catchObject,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../internal/motionHumanBody";

/**
 * A ball is caught at its own size, in the pocket of the glove the catching hand wears: the catch reads the ball's radius from its `grip` aperture and meets it with the glove's `pocket`, the hand turned as its palm would be.
 *
 * The average man tosses a baseball (`createBall`) to the catcher 2.5 m away, at the catcher's chest short of it by the catch's reach. The catcher wears a fielder's glove (`createGlove`) on the left hand, its fingers along the hand's and its pocket on the palm's side, its wrist opening at the wrist, and catches in that hand.
 *
 * Scenarios, with the average man and the small woman as the catcher:
 * 1. The gloved catch plans; at its contact the glove's pocket, read from the displayed glove through the archetype's own contact, lies within 25 mm (provisional: a glove's padding about the ball) of the ball's surface, its centre a radius away.
 * 2. The same catch bare-handed plans, and its hand stands nearer the ball's centre at contact than the gloved hand does, which the glove holds off.
 * 3. The glove named for a catch in the right hand, which does not wear it, is refused on `glove`.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Builds the throw and the catch through the public chain with the real ball and glove and reads the displayed glove and hand; a pocket off the ball, a glove that changes nothing or a glove caught with by the bare hand fails with the measure.
 * @evidence contracts/development/testing.md#independent-expectations The ball's radius and the pocket are the archetypes' own contacts; the bounds are stated provisional; only the catch's contact instant and its object's centre are read from the law.
 * @evidence contracts/development/testing.md#distinguishing-cases A gloved and a bare catch and a glove on the other hand, on two catchers of opposite build.
 * @evidence contracts/development/testing.md#execution-ownership Prepares two polygon men and six short films; it runs locally and wherever CI runs the archetype tests.
 * @evidence contracts/development/common.md#meaningful-documentation States what is pinned, the stage and the 3 scenarios with their bounds.
 */
export function test_archetype_glove_catch(): void {
  const ball: ReturnType<typeof createBall> = createBall({ kind: "baseball" });
  const glove: ReturnType<typeof createGlove> = createGlove({
    kind: "fielder",
  });
  const radius: number = ball.affordance("grip").aperture! / 2;
  const thrower: IHumanBody = motionHumanBody("m-average");
  const distance: number = 2.5;
  // Worn on the left hand: the glove's fingers (+Z) along the hand's (+X at
  // rest), its pocket (+Y) on the palm's side (-Y at rest), its wrist
  // opening at the wrist.
  const turn: IAutoMovieQuaternion = quaternionFromAutoMovieBasis(
    { x: 0, y: 0, z: 1 },
    { x: 0, y: -1, z: 0 },
    { x: 1, y: 0, z: 0 },
  );
  const worn: IHumanProp.IFrame = {
    position: Vector3.scale(
      Quaternion.rotateVector(turn, glove.affordance("hand").frame.translation),
      -1,
    ),
    rotation: turn,
  };
  const complaints: string[] = [];
  const mm = (metres: number): string => (metres * 1000).toFixed(1);
  for (const name of ["m-average", "f-small"] as const) {
    const body: IHumanBody = motionHumanBody(name);
    const at: IAutoMovieVector3 = {
      x: 0,
      y: body.measure.chestHeight,
      z: distance - catchObject.REACH * (body.measure.upperArm + body.measure.forearm),
    };
    const perform = (
      side: "left" | "right",
      gloved: boolean,
    ): HumanPerformance => {
      const composition: AutoMovieComposition = {
        kind: "parallel",
        parts: [
          HumanChain.subject("a").act(
            "throwObject",
            { at: { kind: "point", at, frame: "world" }, style: "toss" },
            "throw",
          ).node,
          HumanChain.subject("b").catchObject({
            from: "throw",
            ball: "ball",
            hands: "one",
            side,
            ...(gloved ? { glove: "glove" } : {}),
          }).node,
        ],
      };
      return new HumanPerformance({
        seed: "catch",
        laws: [],
        props: [
          HumanObject.prop("ball", ball, { at: { x: 0, y: 0, z: 0.3 }, yaw: 0 }),
          {
            ...HumanObject.prop("glove", glove, {
              at: { x: 0, y: 0, z: 0 },
              yaw: 0,
            }),
            worn: { subject: "b", bone: "leftHand", offset: worn },
          },
        ],
        performers: [
          {
            subject: "a",
            body: thrower,
            at: { x: 0, y: 0, z: 0 },
            yaw: 0,
            proficiency: { level: "trained" },
          },
          {
            subject: "b",
            body,
            at: { x: 0, y: 0, z: distance },
            yaw: 180,
            proficiency: { level: "trained" },
          },
        ],
        composition,
      });
    };
    const contact = (
      film: HumanPerformance,
    ): { at: number; centre: IAutoMovieVector3 } => {
      const act: HumanSegment.ISegment = film.segments("b")[0]!;
      const local: number = act.plan.contact ?? Number.NaN;
      return {
        at: act.start + local,
        centre: (act.plan as catchObject.IPlan).object(local),
      };
    };
    const palm = (film: HumanPerformance, seconds: number): number => {
      const hand: IAutoMovieVector3 = film
        .bones("b", seconds)
        .get("leftHand")!.worldPosition;
      return Vector3.length(
        Vector3.subtract(hand, contact(film).centre),
      );
    };

    // 1. The gloved catch meets the ball with the pocket.
    let gloved: HumanPerformance | undefined;
    try {
      gloved = perform("left", true);
      const meet: { at: number; centre: IAutoMovieVector3 } = contact(gloved);
      const frame: IHumanProp.IFrame = gloved.prop("glove", meet.at);
      const pocket: IAutoMovieVector3 = Vector3.add(
        frame.position,
        Quaternion.rotateVector(
          frame.rotation,
          glove.affordance("pocket").frame.translation,
        ),
      );
      const off: number = Math.abs(
        Vector3.length(Vector3.subtract(pocket, meet.centre)) - radius,
      );
      if (!(off <= 0.025))
        complaints.push(
          `${name}: at the gloved contact the pocket lies ${mm(off)} mm off the ball's surface, within 25 mm expected`,
        );
    } catch (error) {
      complaints.push(
        `${name} gloved: expected to plan, got ${error instanceof Error ? error.message : String(error)}`,
      );
    }

    // 2. Bare-handed, the hand meets the ball nearer by the pocket's depth.
    try {
      const bare: HumanPerformance = perform("left", false);
      if (gloved !== undefined) {
        const depth: number =
          palm(gloved, contact(gloved).at) - palm(bare, contact(bare).at);
        if (!(depth > 0))
          complaints.push(
            `${name}: the gloved hand stands ${mm(-depth)} mm nearer the ball than the bare one, farther by the pocket's depth expected`,
          );
      }
    } catch (error) {
      complaints.push(
        `${name} bare: expected to plan, got ${error instanceof Error ? error.message : String(error)}`,
      );
    }

    // 3. A glove the catching hand does not wear is refused.
    try {
      perform("right", true);
      complaints.push(`${name}: a glove on the other hand was caught with`);
    } catch (error) {
      if (!(error instanceof HumanRefusal) || error.axis !== "glove")
        complaints.push(
          `${name}: the other hand's catch failed with ${error instanceof Error ? error.message : String(error)}, a refusal on glove expected`,
        );
    }
  }
  TestValidator.equals(
    "a ball is caught at its size in the worn glove's pocket",
    complaints,
    [],
  );
}
