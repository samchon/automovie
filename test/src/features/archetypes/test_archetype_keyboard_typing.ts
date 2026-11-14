import { createKeyboard } from "@automovie/archetypes";
import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  HumanChain,
  HumanHand,
  HumanObject,
  HumanPerformance,
  HumanRefusal,
  type IHumanBody,
  type IHumanProp,
  typeText,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../internal/motionHumanBody";

/**
 * A text is typed on the keyboard placed in the scene: each press lands on the key the keyboard's own home row places, wherever the keyboard stands.
 *
 * A keyboard and an open laptop (`createKeyboard`) each stand turned half round, the typist's side toward the performer, placed so the home row lies at standing elbow height a forearm and half a hand ahead of the shoulders, 0.1 m to the performer's left. The performer types `hello world` with `typeText`, which reads the prop's `homeRow` and `keys`.
 *
 * Scenarios, on the average man and the small woman, for each kind:
 * 1. The typing plans.
 * 2. At each press the pressing index fingertip is within 10 mm (the typing cases' bound) of that key's centre, laid out from the placed keyboard's `homeRow` on the 19.05 mm pitch and sunk by the key travel.
 * 3. Through the whole film, read every tenth of a second, the keyboard keeps its placed frame within 1 mm (the campaign's grip bound).
 * 4. The same keyboard placed on the floor is refused on `keyboard`.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Builds the typing through the public chain on the real keyboard and reads the displayed fingertips and the prop; a press off its key, a keyboard that moves or a keyboard on the floor typed on fails with the measure.
 * @evidence contracts/development/testing.md#independent-expectations Each key's place is computed here from the archetype's own `homeRow` contact and the placement, not read from the plan; the 10 mm and the 1 mm are the existing bounds.
 * @evidence contracts/development/testing.md#distinguishing-cases A keyboard and a laptop, off the body's midline, at elbow height and on the floor, on two bodies of opposite build.
 * @evidence contracts/development/testing.md#execution-ownership Prepares two polygon men and eight short films; it runs locally and wherever CI runs the archetype tests.
 * @evidence contracts/development/common.md#meaningful-documentation States what is pinned, the stage and the 4 scenarios with their bounds.
 */
export function test_archetype_keyboard_typing(): void {
  const text: string = "hello world";
  const turn: IAutoMovieQuaternion = Quaternion.fromAxisAngle(
    { x: 0, y: 1, z: 0 },
    180,
  );
  const complaints: string[] = [];
  const mm = (metres: number): string => (metres * 1000).toFixed(1);
  for (const name of ["m-average", "f-small"] as const) {
    const body: IHumanBody = motionHumanBody(name);
    for (const kind of createKeyboard.KINDS) {
      const board: ReturnType<typeof createKeyboard> = createKeyboard({ kind });
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
      const perform = (at: IAutoMovieVector3): HumanPerformance =>
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
      let film: HumanPerformance;
      try {
        film = perform(at);
      } catch (error) {
        complaints.push(
          `${label}: expected to plan, got ${error instanceof Error ? error.message : String(error)}`,
        );
        continue;
      }

      // 2. Each press lands on its key.
      const segment: ReturnType<HumanPerformance["segments"]>[number] = film
        .segments("a")
        .at(-1)!;
      [...text].forEach((letter: string, i: number): void => {
        const t: number =
          segment.start + segment.plan.events[i]!.share * segment.plan.duration;
        const key: ReturnType<typeof typeText.key> = typeText.key(letter);
        const tip: IAutoMovieVector3 = HumanHand.frame(
          body,
          film.bones("a", t),
          key.side,
          "indexTip",
          "point",
        ).point;
        const miss: number = Vector3.length(
          Vector3.subtract(tip, {
            x: at.x + key.at.x,
            y: at.y - typeText.TRAVEL,
            z: at.z + key.at.z,
          }),
        );
        if (!(miss <= 0.01))
          complaints.push(
            `${label}: the ${key.side} fingertip is ${mm(miss)} mm from "${letter}" at press ${i + 1}, within 10 mm expected`,
          );
      });

      // 3. The keyboard stays where it was placed.
      const placed: IHumanProp.IFrame = film.prop("keyboard", 0);
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
