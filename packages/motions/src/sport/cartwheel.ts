import { minimumJerk } from "@automovie/engine";
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
  IAutoMovieMotionHumanGymnasticsWheel,
  IAutoMovieMotionHumanPlayback,
  IAutoMovieMotionHumanPosture,
  IAutoMovieResolvedBone,
} from "@automovie/interface";

import { stand } from "../actions/stand";
import { AutoMovieMotionHumanInterrupt } from "../compose/AutoMovieMotionHumanInterrupt";
import { ExerciseKey } from "../exercise/ExerciseKey";
import { HumanBound } from "../law/HumanBound";
import { HumanPreparedPlayback } from "../perform/HumanPreparedPlayback";
import { HumanFrame } from "../posture/HumanFrame";
import { poseBones } from "../posture/poseBones";
import { GymnasticsWheel } from "./GymnasticsWheel";
import { GymnasticsWheelPlants } from "./GymnasticsWheelPlants";

/**
 * A cartwheel (#3377): the body turns once about its front-to-back axis,
 * sideways, passing from one foot to one hand, the other hand, and the
 * other foot, and stands again a wheel's roll to the side.
 *
 * The body is a wheel of four spokes: the arms raised wide overhead and the
 * legs straddled, held as one rigid shape while it turns. At every angle
 * the spoke that reaches lowest bears, the root's height puts that hand's
 * wrist or that foot's ankle at the height it has when it bears, and the
 * root travels so the bearing joint stays where it came down: a wheel
 * rolling without slipping on its spokes' ends. Nothing is integrated; the
 * turn's angle follows minimum-jerk progress over the cartwheel's seconds.
 * The turn is one axis, the roll, with no pitch and no change of heading.
 *
 * Events: `handsDown` (the first hand bears), `inverted` (half the turn),
 * `feetDown` (the first foot bears again).
 *
 * First pass: the body takes the wheel's shape over the first eighth of the
 * turn and leaves it over the last, while it already bears on a foot, so
 * that foot's joint is kept only as well as the changing shape allows; the
 * hands and the feet are carried by the rigid turn and are not laid flat by
 * a solve while carried, but each limb that bears is laid where it came
 * down (`GymnasticsWheelPlants`); no run-up, no lunge into the first hand and no push off the
 * second are shown. A round-off, a handspring and a vault are not this law:
 * they bend the body between their supports or fly between them.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what the law shows, its kinematic model, the one axis, the events and what the first pass leaves out.
 * @evidence contracts/development/design.md#principled-representation A table of the wheel's root by angle, built once per plan from the body's own joints, so a tall and a small body roll different distances by their own spokes.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The name, the cancel table, the shape, the parameters and the plan.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No length in metres: the travel follows from the spokes.
 */
export namespace cartwheel {
  /** The action's name. */
  export const name: AutoMovieMotionHumanActionKey = "cartwheel";

  /** Cancel table: from the end, into standing or walking. */
  export const interrupts: IAutoMovieMotionHumanActionLaw["interrupts"] =
    AutoMovieMotionHumanInterrupt.table({
      stand: ["fromRelax", "smooth"],
      walk: ["fromRelax", "smooth"],
    });

  /** The cartwheel's seconds when the author names none (provisional). */
  export const SECONDS: number = 1.6;

  /** The angle between two rows of the wheel's table, degrees. */
  export const STEP: number = 5;

  /** The angle over which the body takes the wheel's shape and leaves it, degrees (provisional). */
  export const SHAPE: number = 45;

  /**
   * The wheel's shape on a body: the arms raised wide overhead, the legs
   * straddled (provisional angles).
   *
   * @param body The body.
   * @returns The key.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the shape and that its angles are provisional.
   * @evidence contracts/development/implementation.md#principled-implementation An exercise key on the body (`ExerciseKey.from`), so what it leaves unstated is the body's own standing.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One key.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts None.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work with no algorithm to choose.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses `ExerciseKey.from`.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function that retains nothing.
   */
  export function wheel(
    body: IAutoMovieMotionHumanBody,
  ): IAutoMovieMotionHumanExerciseKey.IKey {
    return ExerciseKey.from(body, {}, { spread: 35, raise: 150, elbow: 3 });
  }

  /** The joints a wheel may bear on. */
  const SPOKES: readonly (
    | "leftFoot"
    | "rightFoot"
    | "leftHand"
    | "rightHand"
  )[] = ["leftFoot", "rightFoot", "leftHand", "rightHand"];

  /**
   * Plan a cartwheel.
   *
   * @param context The action's context.
   * @returns The plan.
   * @throws {HumanRefusal} When the seconds are not positive.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the input, the plan and the refusal.
   * @evidence contracts/development/implementation.md#principled-implementation One table by angle: the shape at that angle is posed, the lowest spoke bears, the root's height sets that joint at its bearing height and the root's place keeps the joint where it came down; a change of spoke hands the place over while both are down, so the root is continuous.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The shape by angle, the table, the posture by time, the supports from the table's runs.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The final posture is returned with no roll, which is the same body as a whole turn, so the next action does not unwind it.
   * @evidence contracts/development/implementation.md#efficient-algorithms The original 73 table rows use demanded spoke FK. The fixed standing/wheel pair and its ordered joint union prepare once; row/playback interpolation allocates only the actual key/joints. Entry FK requests only ankles; speedup is unmeasured.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses the exercise key's one prepared blend owner, standing plan and GymnasticsWheel table. Only unchanged body-dependent endpoint keys are shared; every queried angle still evaluates its original interpolation.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The plan closes over its table and one fixed key-pair reader; queried shapes retain no history or FK reader.
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
      minimumJerk.share(x);
    const between: ReturnType<typeof ExerciseKey.prepareBlend> =
      ExerciseKey.prepareBlend(ExerciseKey.standing(body), wheel(body));

    // The body at an angle of the turn, its root at the origin.
    const shaped: (angle: number) => IAutoMovieMotionHumanPosture = (
      angle: number,
    ): IAutoMovieMotionHumanPosture => ({
      ...ExerciseKey.posed(
        between(ease(Math.min(angle, 360 - angle) / SHAPE)),
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
    const spokes: IAutoMovieMotionHumanGymnasticsWheel.ISpoke[] = SPOKES.map(
      (
        bone: (typeof SPOKES)[number],
      ): IAutoMovieMotionHumanGymnasticsWheel.ISpoke => ({
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
        start: standing.root,
        until: 360,
        step: STEP,
      });

    // The seconds at which the turn reaches an angle.
    const when: (angle: number) => number = (angle: number): number =>
      GymnasticsWheel.when(angle, 360, duration);
    const contacts: IAutoMovieMotionHumanContactWindow[] =
      GymnasticsWheel.contacts(
        rolling,
        spokes,
        (angle: number): number => when(angle) / duration,
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
    /** Read the current wheel angle and its interpolated support root. */
    const carried: (seconds: number) => IAutoMovieMotionHumanPosture = (
      seconds: number,
    ): IAutoMovieMotionHumanPosture => {
      const angle: number = 360 * ease(seconds / duration);
      return { ...shaped(angle), root: rolling.root(angle) };
    };
    // The bearing hands and feet laid where they came down, not turned with
    // the rigid shape (`GymnasticsWheelPlants`).
    const lay: ReturnType<typeof GymnasticsWheelPlants.of> =
      GymnasticsWheelPlants.of(
        body,
        contacts,
        duration,
        carried,
        HumanFrame.point(
          { origin: { x: 0, y: 0, z: 0 }, yaw: standing.yaw },
          { x: -sign, y: 0, z: 0 },
        ),
      );
    const turning: (seconds: number) => IAutoMovieMotionHumanPosture = (
      seconds: number,
    ): IAutoMovieMotionHumanPosture => lay(carried(seconds), seconds);
    /** The landing shape restarts at zero angle on the final support row. */
    const landed: () => IAutoMovieMotionHumanPosture =
      (): IAutoMovieMotionHumanPosture =>
        lay({ ...shaped(0), root: rolling.rows.at(-1)!.root }, duration);
    const goals: IAutoMovieMotionHumanActionPlan = {
      duration,
      events,
      contacts,
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
}
