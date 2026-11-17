import type { AutoMovieHumanoidBone, AutoMovieMotionHumanActionKey, IAutoMovieMotionEvent, IAutoMovieMotionHumanActionContext, IAutoMovieMotionHumanActionLaw, IAutoMovieMotionHumanActionPlan, IAutoMovieMotionHumanBody, IAutoMovieMotionHumanContactWindow, IAutoMovieMotionHumanExerciseKey, IAutoMovieMotionHumanGymnasticsWheel, IAutoMovieMotionHumanPosture, IAutoMovieMotionHumanRoundOff, IAutoMovieResolvedBone } from "@automovie/interface";

import { minimumJerk } from "@automovie/engine";
import { stand } from "../actions/stand";
import { AutoMovieMotionHumanInterrupt } from "../compose/AutoMovieMotionHumanInterrupt";
import { ExerciseKey } from "../exercise/ExerciseKey";
import { HumanBound } from "../law/HumanBound";
import { poseBones } from "../posture/poseBones";
import { GymnasticsWheel } from "./GymnasticsWheel";
import { cartwheel } from "./cartwheel";

/**
 * A round-off (#3377): a cartwheel that travels along the way the body
 * faced, turns half round about the vertical and lands on both feet at
 * once, facing back where it came from, the entry to a back handspring or
 * a back salto.
 *
 * The body rolls as the cartwheel's wheel (`GymnasticsWheel`): the arms
 * raised wide and the legs straddled over the first `cartwheel.SHAPE`
 * degrees, the lowest spoke bearing at every angle. On the way to the
 * hands it turns a quarter about the vertical through what bears, so the
 * wheel rolls along the heading; past the handstand it turns the second
 * quarter about the bearing hand while the legs close, so both feet come
 * down together, knees bent to take the landing. The roll is one axis and
 * each quarter turn is another, about the vertical, and the two run at once
 * while a quarter is being made (over the wheel's first `ENTRY` degrees and
 * over `SNAP` degrees past the handstand): the posture's heading turns and
 * its roll grows in the same instant, composed as heading then roll, not
 * solved as one rotation about a moving axis (#3416 keeps that multi-axis
 * case).
 *
 * The angle follows minimum-jerk progress over the seconds; nothing is
 * integrated, and no hurdle step, push off the second hand or flight before
 * the landing is shown, a first pass.
 *
 * Events: `handsDown` (the first hand bears), `inverted` (half the wheel),
 * `feetDown` (the feet bear again), `relax` (the end).
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the figure, the two turns and where each happens, where the twist and the roll overlap and how they compose with its follow-up, the timing, the events and what is left out.
 * @evidence contracts/development/design.md#principled-representation A wheel table from the body's own joints, the quarter turns a function of the wheel's angle.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The name, the cancel table, the seconds, the closing shape, the parameters and the plan.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No length in metres: the travel follows from the spokes.
 */
export namespace roundOff {
  /** The action's name. */
  export const name: AutoMovieMotionHumanActionKey = "roundOff";

  /** Cancel table: from the end, into standing, walking, a handspring or a salto. */
  export const interrupts: IAutoMovieMotionHumanActionLaw["interrupts"] =
    AutoMovieMotionHumanInterrupt.table({
      stand: ["fromRelax", "smooth"],
      walk: ["fromRelax", "smooth"],
      handspring: ["fromRelax", "smooth"],
      salto: ["fromRelax", "smooth"],
    });

  /** The round-off's seconds when the author names none (provisional: quicker than the cartwheel's, its rhythm of a tumbling run). */
  export const SECONDS: number = 1.2;

  /** The wheel's angle by which the first quarter turn is made, degrees (provisional: before the first hand bears). */
  export const ENTRY: number = 60;

  /** The angle past the handstand over which the legs close and the second quarter turn is made, degrees (provisional). */
  export const SNAP: number = 120;

  /**
   * The landing shape on a body: the legs together, the knees bent and the
   * arms still up (provisional angles).
   *
   * @param body The body.
   * @returns The key.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the shape and that its angles are provisional.
   * @evidence contracts/development/implementation.md#principled-implementation An exercise key on the body (`ExerciseKey.from`), so what it leaves unstated is the body's own standing.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One key.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts None.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work with no algorithm to choose.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses `ExerciseKey.from` and `ExerciseKey.stood`.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function that retains nothing.
   */
  export function landed(body: IAutoMovieMotionHumanBody): IAutoMovieMotionHumanExerciseKey.IKey {
    return ExerciseKey.from(
      body,
      {},
      { ...ExerciseKey.stood(0, 30, 15), shoulder: 150, elbow: 5 },
    );
  }

  /**
   * Plan a round-off.
   *
   * @param context The action's context.
   * @returns The plan.
   * @throws {HumanRefusal} When the seconds are not positive.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the input, the plan and the refusal.
   * @evidence contracts/development/implementation.md#principled-implementation The shape at an angle is the cartwheel's wheel in the first half and closes to `landed` in the second; its heading turns by the quarter turns; the wheel table rolls it over both feet, each foot, each hand and both feet again.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The shape by angle, the table, the angle by time, the supports from the table.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The final posture is returned with no roll, the same body as a whole wheel, so the next action does not unwind it.
   * @evidence contracts/development/implementation.md#efficient-algorithms One forward kinematics per row of the table, and one per evaluated second.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses the cartwheel's wheel shape and step, the exercise keys and the standing plan.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The plan closes over the table.
   */
  export function plan(
    context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanRoundOff.IParams>,
  ): IAutoMovieMotionHumanActionPlan {
    const body: IAutoMovieMotionHumanBody = context.body;
    const duration: number = HumanBound.above(
      "seconds",
      context.params.seconds ?? SECONDS,
      0,
      "s",
    );
    const sign: number = context.params.lead === "right" ? 1 : -1;
    const standing: IAutoMovieMotionHumanPosture = stand
      .plan({ ...context, params: { seconds: 1 } })
      .posture(0);
    const ease = (x: number): number => minimumJerk(x).s;

    // The heading's turn at an angle of the wheel: a quarter toward the
    // trailing side on the way to the hands, so the leading side faces the
    // heading, and a second quarter past the handstand.
    const turn = (angle: number): number =>
      sign * (90 * ease(angle / ENTRY) + 90 * ease((angle - 180) / SNAP));

    // The shape at an angle: the cartwheel's wheel in the first half, closing
    // to the landing shape past the handstand.
    const shaped = (angle: number): IAutoMovieMotionHumanPosture => ({
      ...ExerciseKey.posed(
        angle <= 180
          ? ExerciseKey.blend(
              ExerciseKey.standing(body),
              cartwheel.wheel(body),
              ease(angle / cartwheel.SHAPE),
            )
          : ExerciseKey.blend(
              cartwheel.wheel(body),
              landed(body),
              ease((angle - 180) / SNAP),
            ),
        standing.yaw + turn(angle),
      ),
      roll: sign * angle,
    });

    // The spokes: both feet, each foot, each hand, the leading hand first.
    const entered: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
      poseBones(body, context.entry.pose);
    const ankle: number =
      (entered.get("leftFoot")!.worldPosition.y +
        entered.get("rightFoot")!.worldPosition.y) /
      2;
    const laid: number = GymnasticsWheel.laid(body);
    const ground: IAutoMovieMotionHumanContactWindow.Support = { kind: "ground" };
    const lead: "left" | "right" = sign < 0 ? "left" : "right";
    const trail: "left" | "right" = lead === "left" ? "right" : "left";
    const spokes: IAutoMovieMotionHumanGymnasticsWheel.ISpoke[] = [
      { bones: ["leftFoot", "rightFoot"], height: ankle, support: ground },
      { bones: [`${lead}Foot`], height: ankle, support: ground },
      { bones: [`${trail}Foot`], height: ankle, support: ground },
      { bones: [`${lead}Hand`], height: laid, support: ground },
      { bones: [`${trail}Hand`], height: laid, support: ground },
    ];
    const wheel: IAutoMovieMotionHumanGymnasticsWheel.IWheel = GymnasticsWheel.roll({
      body,
      shaped,
      spokes,
      start: standing.root,
      until: 360,
      step: cartwheel.STEP,
    });

    // The seconds at which the wheel reaches an angle.
    const when = (angle: number): number =>
      GymnasticsWheel.when(angle, 360, duration);
    const contacts: IAutoMovieMotionHumanContactWindow[] = GymnasticsWheel.contacts(
      wheel,
      spokes,
      (angle: number): number => when(angle) / duration,
    );
    const handsDown: number =
      contacts.find((w: IAutoMovieMotionHumanContactWindow): boolean =>
        w.part.endsWith("Hand"),
      )?.from ?? 0.5;
    const feetDown: number =
      contacts.find(
        (w: IAutoMovieMotionHumanContactWindow): boolean =>
          w.part.endsWith("Foot") && w.from > handsDown,
      )?.from ?? 1;
    const events: IAutoMovieMotionEvent[] = [
      { name: "handsDown", share: handsDown },
      { name: "inverted", share: when(180) / duration },
      { name: "feetDown", share: feetDown },
      { name: "relax", share: 1 },
    ];
    return {
      duration,
      events,
      contacts,
      contact: feetDown * duration,
      posture: (seconds: number): IAutoMovieMotionHumanPosture => {
        const angle: number =
          360 * ease(Math.min(duration, Math.max(0, seconds)) / duration);
        return {
          ...shaped(angle),
          ...(seconds >= duration ? { roll: 0 } : {}),
          root: wheel.root(angle),
        };
      },
    };
  }
}
