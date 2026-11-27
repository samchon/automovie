import { AutoMovieEngineMotionSampling } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  AutoMovieMotionHumanActionKey,
  IAutoMovieMotionEvent,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanCartwheel,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanExerciseKey,
  IAutoMovieMotionHumanFrame,
  IAutoMovieMotionHumanGymnasticsWheel,
  IAutoMovieMotionHumanPlayback,
  IAutoMovieMotionHumanPosture,
  IAutoMovieResolvedBone,
} from "@automovie/interface";

import { stand } from "../../actions/internal/stand";
import { AutoMovieMotionHumanInterrupt } from "../../compose/internal/AutoMovieMotionHumanInterrupt";
import { ExerciseKey } from "../../exercise/internal/ExerciseKey";
import { HumanBound } from "../../law/internal/HumanBound";
import { HumanPreparedPlayback } from "../../perform/internal/HumanPreparedPlayback";
import { HumanFrame } from "../../posture/internal/HumanFrame";
import { poseBones } from "../../posture/internal/poseBones";
import { GymnasticsWheel } from "./GymnasticsWheel";
import { GymnasticsWheelPlants } from "./GymnasticsWheelPlants";
import { edgeGymnasticsWheelFeet } from "./edgeGymnasticsWheelFeet";

/*
 * A cartwheel: the body turns once about its front-to-back axis, sideways,
 * passing from one foot to one hand, the other hand, and the other foot, and
 * stands again a wheel's roll to the side.
 *
 * The body is a wheel of four spokes: the arms raised wide overhead and the
 * legs straddled, held as one rigid shape while it turns. At every angle the
 * spoke that reaches lowest bears, the root's height puts that hand's wrist or
 * that foot's ankle at the height it has when it bears, and the root travels so
 * the bearing joint stays where it came down: a wheel rolling without slipping
 * on its spokes' ends. Nothing is integrated; the turn's angle follows
 * minimum-jerk progress over the cartwheel's seconds. The turn is one axis, the
 * roll, with no pitch and no change of heading.
 *
 * Events: `handsDown` (the first hand bears), `inverted` (half the turn),
 * `feetDown` (the first foot bears again).
 *
 * First pass: the body takes the wheel's shape over the first eighth of the
 * turn and leaves it over the last, while it already bears on a foot, so that
 * foot's joint is kept only as well as the changing shape allows; the hands and
 * the feet are carried by the rigid turn and are not laid flat by a solve while
 * carried, but each limb that bears is laid where it came down
 * (`GymnasticsWheelPlants`); no run-up, no lunge into the first hand and no
 * push off the second are shown. A round-off, a handspring and a vault are not
 * this law: they bend the body between their supports or fly between them.
 */
export namespace cartwheel {
  /*
   * The action's name.
   */
  export const name: AutoMovieMotionHumanActionKey = "cartwheel";

  /*
   * Cancel table: from the end, into standing or walking.
   */
  export const interrupts: IAutoMovieMotionHumanActionLaw["interrupts"] =
    AutoMovieMotionHumanInterrupt.table({
      stand: ["fromRelax", "smooth"],
      walk: ["fromRelax", "smooth"],
    });

  /*
   * The cartwheel's seconds when the author names none (provisional).
   */
  export const SECONDS: number = 1.6;

  /*
   * The angle between two rows of the wheel's table, degrees.
   */
  export const STEP: number = 5;

  /*
   * The angle over which the body takes the wheel's shape and leaves it,
   * degrees: the quarter turn to the first hand's contact, so the arms reach
   * overhead as the hand comes down and the straddle opens as the trailing leg
   * rises, rather than whipping up within the first degrees of the turn
   * (provisional: no measured share of the turn located).
   */
  export const SHAPE: number = 90;

  /*
   * The wheel's shape on a body: the arms raised wide overhead, the legs
   * straddled (provisional angles).
   * Parameter body: The body.
   * Returns: The key.
   */
  export function wheel(
    body: IAutoMovieMotionHumanBody,
  ): IAutoMovieMotionHumanExerciseKey.IKey {
    return ExerciseKey.from(body, {}, { spread: 35, raise: 150, elbow: 3 });
  }

  /*
   * How far the body has taken the wheel's shape at an angle of the turn: a
   * minimum-jerk share over the first `SHAPE` degrees, and back over the last.
   * Parameter angle: The wheel's turn, degrees, 0 to 360.
   * Returns: The shape's share, 0 to 1.
   */
  export function shapeShare(angle: number): number {
    return AutoMovieEngineMotionSampling.minimumJerkShare(
      angle <= 180 ? angle / SHAPE : (360 - angle) / SHAPE,
    );
  }

  /*
   * Plan a cartwheel.
   * Parameter context: The action's context.
   * Returns: The plan.
   * When the seconds are not positive.
   */
  export function plan(
    context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanCartwheel.IParams>,
  ): IAutoMovieMotionHumanActionPlan {
    const body: IAutoMovieMotionHumanBody = context.body;
    const duration: number = HumanBound.above(
      "seconds",
      context.params.duration ?? SECONDS,
      0,
      "s",
    );
    const sign: number = context.params.to === "right" ? 1 : -1;
    const standing: IAutoMovieMotionHumanPosture = stand
      .plan({ ...context, params: { hold: 1 } })
      .posture(0);
    const ease: (x: number) => number = (x: number): number =>
      AutoMovieEngineMotionSampling.minimumJerkShare(x);
    // The shape leaves the body as the entry shows it, its stance and its
    // feet, and closes on the relaxed stand.
    const entering: ReturnType<typeof ExerciseKey.prepareBlend> =
      ExerciseKey.prepareBlend(
        ExerciseKey.shown(context.entry.pose),
        wheel(body),
      );
    const leaving: ReturnType<typeof ExerciseKey.prepareBlend> =
      ExerciseKey.prepareBlend(ExerciseKey.standing(body), wheel(body));

    // The body at an angle of the turn, its root at the origin.
    const shaped: (angle: number) => IAutoMovieMotionHumanPosture = (
      angle: number,
    ): IAutoMovieMotionHumanPosture => ({
      ...ExerciseKey.posed(
        angle <= 180 ? entering(shapeShare(angle)) : leaving(shapeShare(angle)),
        standing.yaw,
      ),
      roll: sign * angle,
    });

    // The spokes, each bearing at the height its joint has when it bears:
    // an ankle's when the body stands on it, a wrist's over a laid palm.
    const entered: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
      poseBones(
        body,
        context.entry.pose,
        undefined,
        new Set<AutoMovieHumanoidBone>(["leftFoot", "rightFoot"]),
      );
    const laid: number = GymnasticsWheel.laid(body);
    // The leading side first, so the leading foot keeps the weight from the
    // stand, where both feet are level (`GymnasticsWheel.roll`'s tie rule).
    const spokes: IAutoMovieMotionHumanGymnasticsWheel.ISpoke[] = (
      sign < 0 ? SPOKES : SPOKES_RIGHT
    ).map(
      (bone: Spoke): IAutoMovieMotionHumanGymnasticsWheel.ISpoke => ({
        bones: [bone],
        height: bone.endsWith("Hand")
          ? laid
          : entered.get(bone)!.worldPosition.y,
        support: { kind: "ground" },
      }),
    );
    const rolling: IAutoMovieMotionHumanGymnasticsWheel.IWheel =
      GymnasticsWheel.roll({
        body,
        shaped,
        spokes,
        // The root where the entry shows it, so the first foot bears where
        // it stands.
        start: context.entry.pose.root?.translation ?? standing.root,
        until: 360,
        step: STEP,
      });

    // The seconds at which the turn reaches an angle.
    const when: (angle: number) => number = (angle: number): number =>
      GymnasticsWheel.when(angle, 360, duration);
    // The wheel bears on one spoke a row, but the cartwheel ends standing on
    // both feet: the foot that landed first stays down while the other comes
    // down beside it, so its last window runs to the end.
    const contacts: IAutoMovieMotionHumanContactWindow[] =
      GymnasticsWheel.contacts(
        rolling,
        spokes,
        (angle: number): number => when(angle) / duration,
      ).map(
        (
          window: IAutoMovieMotionHumanContactWindow,
          index: number,
          all: readonly IAutoMovieMotionHumanContactWindow[],
        ): IAutoMovieMotionHumanContactWindow =>
          index === all.length - 2 &&
          window.part.endsWith("Foot") &&
          all[index + 1]!.part.endsWith("Foot") &&
          all[index + 1]!.part !== window.part
            ? { ...window, to: 1 }
            : window,
      );
    const inverted: number = when(180);
    const first: (suffix: string, after: number) => number = (
      suffix: string,
      after: number,
    ): number =>
      contacts.find(
        (window: IAutoMovieMotionHumanContactWindow, index: number): boolean =>
          index >= after && window.part.endsWith(suffix),
      )?.from ?? 0.5;
    const events: IAutoMovieMotionEvent[] = [
      { name: "handsDown", share: first("Hand", 0) },
      { name: "inverted", share: inverted / duration },
      {
        name: "feetDown",
        share: first(
          "Foot",
          contacts.findIndex(
            (window: IAutoMovieMotionHumanContactWindow): boolean =>
              window.part.endsWith("Hand"),
          ),
        ),
      },
      { name: "relax", share: 1 },
    ];
    /*
     * Read the current wheel angle and its interpolated support root.
     */
    const carried: (seconds: number) => IAutoMovieMotionHumanPosture = (
      seconds: number,
    ): IAutoMovieMotionHumanPosture => {
      const angle: number = 360 * ease(seconds / duration);
      return { ...shaped(angle), root: rolling.root(angle) };
    };
    // The bearing hands and feet laid where they came down, not turned with
    // the rigid shape, the hands in the T-shape: the first along the travel,
    // the second toward the way the body faces (`GymnasticsWheelPlants`).
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
    const turning: (seconds: number) => IAutoMovieMotionHumanPosture = (
      seconds: number,
    ): IAutoMovieMotionHumanPosture => lay(carried(seconds), seconds);
    /*
     * The landing shape restarts at zero angle on the final support row.
     */
    const landed: () => IAutoMovieMotionHumanPosture =
      (): IAutoMovieMotionHumanPosture =>
        lay(
          { ...shaped(360), roll: 0, root: rolling.rows.at(-1)!.root },
          duration,
        );
    const goals: IAutoMovieMotionHumanActionPlan = {
      duration,
      events,
      contacts: borne,
      contact: inverted,
      posture: (seconds: number): IAutoMovieMotionHumanPosture =>
        seconds >= duration ? landed() : turning(seconds),
    };
    // The laid hands are goals the displayed arms follow on one coherent
    // course (the performance's arm course), so the law sets no arm path.
    const result: IAutoMovieMotionHumanActionPlan = goals;
    HumanPreparedPlayback.attach(result, body, {
      mode: "posture",
      phases: [
        {
          from: duration,
          to: duration,
          sample: (): IAutoMovieMotionHumanPlayback.ISample => ({
            posture: result.posture(duration),
          }),
        },
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

  /*
   * The joints a wheel to the left bears on, the leading side first.
   */
  const SPOKES: readonly Spoke[] = [
    "leftFoot",
    "rightFoot",
    "leftHand",
    "rightHand",
  ];

  /*
   * The joints a wheel to the right bears on, the leading side first.
   */
  const SPOKES_RIGHT: readonly Spoke[] = [
    "rightFoot",
    "leftFoot",
    "rightHand",
    "leftHand",
  ];
  /*
   * A joint a wheel may bear on.
   */
  type Spoke = "leftFoot" | "rightFoot" | "leftHand" | "rightHand";
}
