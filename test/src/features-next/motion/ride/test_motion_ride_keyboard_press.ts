import { createDesktopKeyboard, createLaptop } from "@automovie/archetypes";
import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPerformance,
  IAutoMovieQuaternion,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanOperate,
  HumanChain,
  HumanObject,
  HumanPerformance,
  HumanRefusal,
} from "@automovie/motions";
import { HumanHand } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../../../features/internal/motionHumanBody";

/**
 * A desktop keyboard and a laptop place G and H on opposite sides of the home-row centre.
 *
 * Scenarios:
 * 1. Read the opposite index fingertips at their press events, half a 19.05 mm pitch from centre.
 * 2. Check board movement within 1 mm, then move the keyboard to the floor and inspect its refusal.
 *
 * @evidence contracts/development/testing.md#behavioral-verification A fixed keyboard places G and H on opposite sides of its home-row centre.
 * @evidence contracts/development/testing.md#independent-expectations Read the opposite index fingertips at their press events, half a 19.05 mm pitch from centre.
 * @evidence contracts/development/testing.md#distinguishing-cases Check board movement within 1 mm, then move the keyboard to the floor and inspect its refusal.
 * @evidence contracts/development/testing.md#execution-ownership Reads public runtime results in memory.
 * @evidence contracts/development/common.md#meaningful-documentation States the measured phases and coordinate frames.
 */
export function test_motion_ride_keyboard_press(): void {
  const text: string = "gh";
  const turn: IAutoMovieQuaternion = Quaternion.fromAxisAngle(
    { x: 0, y: 1, z: 0 },
    180,
  );
  const complaints: string[] = [];
  const mm = (metres: number): string => (metres * 1000).toFixed(1);
  for (const name of ["m-average"] as const) {
    const body: IAutoMovieMotionHumanBody = motionHumanBody(name);
    for (const kind of ["keyboard", "laptop"] as const) {
      const board: ReturnType<
        typeof createDesktopKeyboard | typeof createLaptop
      > = kind === "keyboard" ? createDesktopKeyboard() : createLaptop();
      const row: IAutoMovieVector3 = Quaternion.rotateVector(
        turn,
        board.affordance("homeRow").frame.translation,
      );
      const home = (height: number): IAutoMovieVector3 => ({
        x: 0.1,
        y: height,
        z:
          body.rest.get("rightUpperArm")!.z +
          body.measure.forearm +
          0.5 * body.measure.hand,
      });
      const perform = (
        at: IAutoMovieVector3,
      ): IAutoMovieMotionHumanPerformance =>
        new HumanPerformance({
          seed: "typing",
          laws: [],
          props: [
            HumanObject.prop("keyboard", board, {
              position: Vector3.subtract(at, row),
              rotation: turn,
            }),
          ],
          performers: [
            {
              subject: "a",
              body,
              at: { x: 0, y: 0, z: 0 },
              yaw: 0,
              proficiency: { level: "trained" },
            },
          ],
          composition: HumanChain.subject("a").typeText({
            keyboard: "keyboard",
            text,
          }).node,
        });
      const label: string = `${name} at a ${kind}`;
      const at: IAutoMovieVector3 = home(
        body.measure.shoulderHeight - body.measure.upperArm - 0.005,
      );

      // 1. It plans.
      let film: IAutoMovieMotionHumanPerformance;
      try {
        film = perform(at);
      } catch (error) {
        complaints.push(
          `${label}: expected to plan, got ${error instanceof Error ? error.message : String(error)}`,
        );
        continue;
      }

      // 2. Each press lands on its key.
      const segment: ReturnType<
        IAutoMovieMotionHumanPerformance["segments"]
      >[number] = film.segments("a").at(-1)!;
      [...text].forEach((letter: string, i: number): void => {
        const t: number =
          segment.start + segment.plan.events[i]!.share * segment.plan.duration;
        const side = letter === "g" ? "left" : "right";
        const offset: number = (letter === "g" ? 0.5 : -0.5) * 0.01905;
        const tip: IAutoMovieVector3 = HumanHand.frame(
          body,
          film.bones("a", t),
          side,
          "indexTip",
          "point",
        ).point;
        const miss: number = Vector3.length(
          Vector3.subtract(tip, {
            x: at.x + offset,
            y: at.y - AutoMovieMotionHumanOperate.typeText.TRAVEL,
            z: at.z,
          }),
        );
        if (!(miss <= 0.01))
          complaints.push(
            `${label}: the ${side} fingertip is ${mm(miss)} mm from "${letter}" at press ${i + 1}, within 10 mm expected`,
          );
      });

      // 3. The keyboard stays where it was placed.
      const placed: IAutoMovieRigidTransform = film.prop("keyboard", 0);
      let moved: number = 0;
      for (let s: number = 0; s <= film.duration; s += 0.1)
        moved = Math.max(
          moved,
          Vector3.length(
            Vector3.subtract(
              film.prop("keyboard", s).position,
              placed.position,
            ),
          ),
        );
      if (!(moved <= 0.001))
        complaints.push(
          `${label}: the keyboard moves ${mm(moved)} mm during the typing, within 1 mm expected`,
        );

      // 4. A keyboard on the floor is refused.
      try {
        perform(home(board.affordance("homeRow").frame.translation.y));
        complaints.push(`${label}: a keyboard on the floor was typed on`);
      } catch (error) {
        if (!(error instanceof HumanRefusal) || error.axis !== "keyboard")
          complaints.push(
            `${label}: a keyboard on the floor failed with ${error instanceof Error ? error.message : String(error)}, a refusal on keyboard expected`,
          );
      }
    }
  }
  TestValidator.equals(
    "a text is typed on the placed keyboard's keys",
    complaints,
    [],
  );
}
