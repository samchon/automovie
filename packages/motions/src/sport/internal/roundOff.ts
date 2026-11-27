import { AutoMovieEngineMotionSampling } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  AutoMovieMotionHumanActionKey,
  IAutoMovieMotionEvent,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanExerciseKey,
  IAutoMovieMotionHumanFrame,
  IAutoMovieMotionHumanGymnasticsWheel,
  IAutoMovieMotionHumanPlayback,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanRoundOff,
  IAutoMovieResolvedBone,
} from "@automovie/interface";

import { stand } from "../../actions/internal/stand";
import { AutoMovieMotionHumanInterrupt } from "../../compose/AutoMovieMotionHumanInterrupt";
import { ExerciseKey } from "../../exercise/ExerciseKey";
import { HumanBound } from "../../law/HumanBound";
import { HumanPreparedPlayback } from "../../perform/HumanPreparedPlayback";
import { HumanFrame } from "../../posture/HumanFrame";
import { poseBones } from "../../posture/internal/poseBones";
import { GymnasticsWheel } from "../GymnasticsWheel";
import { GymnasticsWheelPlants } from "../GymnasticsWheelPlants";
import { cartwheel } from "./cartwheel";
import { edgeGymnasticsWheelFeet } from "./edgeGymnasticsWheelFeet";

/**
 * A round-off: a cartwheel that travels along the way the body faced, turns
 * half round about the vertical and lands on both feet at once, facing back
 * where it came from, the entry to a back handspring or a back salto.
 *
 * The body rolls as the cartwheel's wheel (`GymnasticsWheel`): the arms raised
 * wide and the legs straddled over the first `cartwheel.SHAPE` degrees, the
 * lowest spoke bearing at every angle. On the way to the hands it turns a
 * quarter about the vertical through what bears, so the wheel rolls along the
 * heading; past the handstand it turns the second quarter about the bearing
 * hand while the legs close, so both feet come down together, knees bent to
 * take the landing. The roll is one axis and each quarter turn is another,
 * about the vertical, and the two run at once while a quarter is being made
 * (over the wheel's first `ENTRY` degrees and over `SNAP` degrees past the
 * handstand): the posture's heading turns and its roll grows in the same
 * instant, composed as heading then roll, not solved as one rotation about a
 * moving axis (is a multi-axis case, not planned here).
 *
 * The angle follows minimum-jerk progress over the seconds; nothing is
 * integrated, and no hurdle step, push off the second hand or flight before the
 * landing is shown, a first pass.
 *
 * Events: `handsDown` (the first hand bears), `inverted` (half the wheel),
 * `feetDown` (the feet bear again), `relax` (the end).
 */
export namespace roundOff {
  /** The action's name. */
  export const name: AutoMovieMotionHumanActionKey = "roundOff";

  /**
   * Cancel table: from the end, into standing, walking, a handspring or a
   * salto.
   */
  export const interrupts: IAutoMovieMotionHumanActionLaw["interrupts"] =
    AutoMovieMotionHumanInterrupt.table({
      stand: ["fromRelax", "smooth"],
      walk: ["fromRelax", "smooth"],
      handspring: ["fromRelax", "smooth"],
      salto: ["fromRelax", "smooth"],
    });

  /**
   * The round-off's seconds when the author names none (provisional: quicker
   * than the cartwheel's, its rhythm of a tumbling run).
   */
  export const SECONDS: number = 1.2;

  /**
   * The wheel's angle by which the first quarter turn is made, degrees
   * (provisional: before the first hand bears).
   */
  export const ENTRY: number = 60;

  /**
   * The angle past the handstand over which the legs close and the second
   * quarter turn is made, degrees (provisional).
   */
  export const SNAP: number = 120;

  /**
   * The landing shape on a body: the legs together, the knees bent and the arms
   * still up (provisional angles).
   *
   * @param body The body.
   * @returns The key.
   */
  export function landed(
    body: IAutoMovieMotionHumanBody,
  ): IAutoMovieMotionHumanExerciseKey.IKey {
    return ExerciseKey.from(
      body,
      {},
      { ...ExerciseKey.stood(0, 30, 15), shoulder: 150, elbow: 5 },
    );
  }

  /**
   * The heading's turn at an angle of the wheel: a quarter turn toward the
   * trailing side over the first `ENTRY` degrees, and a second quarter over
   * `SNAP` past the handstand, each a minimum-jerk share.
   *
   * @param sign 1 leading right, -1 leading left.
   * @param angle The wheel's turn, degrees, 0 to 360.
   * @returns Degrees.
   */
  export function turned(sign: number, angle: number): number {
    return (
      sign *
      (90 * AutoMovieEngineMotionSampling.minimumJerkShare(angle / ENTRY) +
        90 * AutoMovieEngineMotionSampling.minimumJerkShare((angle - 180) / SNAP))
    );
  }
  /**
   * Plan a round-off.
   *
   * @param context The action's context.
   * @returns The plan.
   * @throws {HumanRefusal} When the seconds are not positive.
   */
  export function plan(
    context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanRoundOff.IParams>,
  ): IAutoMovieMotionHumanActionPlan {
    const body: IAutoMovieMotionHumanBody = context.body;
    const duration: number = HumanBound.above(
      "seconds",
      context.params.duration ?? SECONDS,
      0,
      "s",
    );
    const sign: number = context.params.lead === "right" ? 1 : -1;
    const standing: IAutoMovieMotionHumanPosture = stand
      .plan({ ...context, params: { hold: 1 } })
      .posture(0);
    const ease: (x: number) => number = (x: number): number =>
      AutoMovieEngineMotionSampling.minimumJerkShare(x);
    const wheeled: IAutoMovieMotionHumanExerciseKey.IKey =
      cartwheel.wheel(body);
    // The wheel leaves the body as the entry shows it, its stance and feet.
    const entering: ReturnType<typeof ExerciseKey.prepareBlend> =
      ExerciseKey.prepareBlend(ExerciseKey.shown(context.entry.pose), wheeled);
    const closing: ReturnType<typeof ExerciseKey.prepareBlend> =
      ExerciseKey.prepareBlend(wheeled, landed(body));

    // The heading's turn at an angle of the wheel: a quarter toward the
    // trailing side on the way to the hands, so the leading side faces the
    // heading, and a second quarter past the handstand.
    const turn: (angle: number) => number = (angle: number): number =>
      turned(sign, angle);

    // The shape at an angle: the cartwheel's wheel in the first half, closing
    // to the landing shape past the handstand.
    const shaped: (angle: number) => IAutoMovieMotionHumanPosture = (
      angle: number,
    ): IAutoMovieMotionHumanPosture => ({
      ...ExerciseKey.posed(
        angle <= 180
          ? entering(ease(angle / cartwheel.SHAPE))
          : closing(ease((angle - 180) / SNAP)),
        standing.yaw + turn(angle),
      ),
      roll: sign * angle,
    });

    // The spokes: both feet, each foot, each hand, the leading hand first.
    const entered: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
      poseBones(
        body,
        context.entry.pose,
        undefined,
        new Set<AutoMovieHumanoidBone>(["leftFoot", "rightFoot"]),
      );
    const ankle: number =
      (entered.get("leftFoot")!.worldPosition.y +
        entered.get("rightFoot")!.worldPosition.y) /
      2;
    const laid: number = GymnasticsWheel.laid(body);
    const ground: IAutoMovieMotionHumanContactWindow.Support = {
      kind: "ground",
    };
    const lead: AutoMovieHumanSide = sign < 0 ? "left" : "right";
    const trail: AutoMovieHumanSide = lead === "left" ? "right" : "left";
    const spokes: IAutoMovieMotionHumanGymnasticsWheel.ISpoke[] = [
      { bones: ["leftFoot", "rightFoot"], height: ankle, support: ground },
      { bones: [`${lead}Foot`], height: ankle, support: ground },
      { bones: [`${trail}Foot`], height: ankle, support: ground },
      { bones: [`${lead}Hand`], height: laid, support: ground },
      { bones: [`${trail}Hand`], height: laid, support: ground },
    ];
    const wheel: IAutoMovieMotionHumanGymnasticsWheel.IWheel =
      GymnasticsWheel.roll({
        body,
        shaped,
        spokes,
        // The root where the entry shows it, so the feet bear where they
        // stand.
        start: context.entry.pose.root?.translation ?? standing.root,
        until: 360,
        step: cartwheel.STEP,
      });

    // The seconds at which the wheel reaches an angle.
    const when: (angle: number) => number = (angle: number): number =>
      GymnasticsWheel.when(angle, 360, duration);
    const contacts: IAutoMovieMotionHumanContactWindow[] =
      GymnasticsWheel.contacts(
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
    /** Read the current wheel angle and straighten the trunk at the exit. */
    const carried: (seconds: number) => IAutoMovieMotionHumanPosture = (
      seconds: number,
    ): IAutoMovieMotionHumanPosture => {
      const angle: number =
        360 * ease(Math.min(duration, Math.max(0, seconds)) / duration);
      return {
        ...shaped(angle),
        ...(seconds >= duration ? { roll: 0 } : {}),
        root: wheel.root(angle),
      };
    };
    // The bearing hands and feet laid where they came down, the hands in the
    // T-shape the round-off is coached and measured in (Farana et al. 2014):
    // the first turned across the run, the second along it.
    const frame: IAutoMovieMotionHumanFrame = {
      origin: { x: 0, y: 0, z: 0 },
      yaw: standing.yaw,
    };
    // A foot rolled past the ankle's range bears on its forefoot's edge.
    const borne: IAutoMovieMotionHumanContactWindow[] = edgeGymnasticsWheelFeet(
      body,
      contacts,
      duration,
      carried,
    );
    const lay: ReturnType<typeof GymnasticsWheelPlants> = GymnasticsWheelPlants(
      body,
      borne,
      duration,
      carried,
      {
        first: HumanFrame.point(frame, { x: -sign, y: 0, z: 0 }),
        second: HumanFrame.point(frame, { x: 0, y: 0, z: 1 }),
      },
    );
    const goals: IAutoMovieMotionHumanActionPlan = {
      duration,
      events,
      contacts: borne,
      contact: feetDown * duration,
      posture: (seconds: number): IAutoMovieMotionHumanPosture =>
        lay(carried(seconds), Math.min(duration, Math.max(0, seconds))),
    };
    // The laid hands are goals the displayed arms follow on one coherent
    // course (the performance's arm course), so the law sets no arm path.
    const result: IAutoMovieMotionHumanActionPlan = goals;
    HumanPreparedPlayback.attach(result, body, {
      mode: "posture",
      phases: [
        {
          from: 0,
          to: duration,
          sample: (seconds: number): IAutoMovieMotionHumanPlayback.ISample => ({
            posture: result.posture(seconds),
          }),
        },
      ],
    });
    return result;
  }
}
