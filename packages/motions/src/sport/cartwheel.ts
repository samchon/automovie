import { type IAutoMovieResolvedBone, minimumJerk } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionEvent,
} from "@automovie/interface";
import type { tags } from "typia";

import type { HumanActionKey } from "../HumanActionKey";
import { stand } from "../actions/stand";
import type { IHumanBody } from "../body/IHumanBody";
import { AutoMovieMotionHumanInterrupt } from "../compose/AutoMovieMotionHumanInterrupt";
import { ExerciseKey } from "../exercise/ExerciseKey";
import { HumanBound } from "../law/HumanBound";
import type { HumanUnit } from "../law/HumanUnit";
import type { IHumanActionContext } from "../law/IHumanActionContext";
import type { IHumanActionLaw } from "../law/IHumanActionLaw";
import type { IHumanActionPlan } from "../law/IHumanActionPlan";
import type { IHumanContactWindow } from "../law/IHumanContactWindow";
import type { IHumanPosture } from "../posture/IHumanPosture";
import { poseBones } from "../posture/poseBones";
import { GymnasticsWheel } from "./GymnasticsWheel";

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
 * a solve; no run-up, no lunge into the first hand and no push off the
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
  export const name: HumanActionKey = "cartwheel";

  /** Cancel table: from the end, into standing or walking. */
  export const interrupts: IHumanActionLaw["interrupts"] =
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

  /** The wheel's shape: the arms raised wide overhead, the legs straddled (provisional angles). */
  export const WHEEL: ExerciseKey.IKey = ExerciseKey.of(
    {},
    { spread: 35, raise: 150, elbow: 3 },
  );

  /**
   * Parameters.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its meaning and default.
   * @evidence contracts/development/design.md#principled-representation The side, the seconds and the manner.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The values the plan reads.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The side is a closed union.
   */
  export interface IParams {
    /** The side the body wheels to; `left` when absent. */
    to?: "left" | "right";

    /** Seconds the cartwheel takes; `SECONDS` when absent. */
    seconds?: number & tags.ExclusiveMinimum<0> & HumanUnit<"s">;
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
   * @evidence contracts/development/implementation.md#efficient-algorithms One forward kinematics per table row, 73 rows per plan, and one per evaluated second.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses the exercise keys' blend and pose, the standing plan and the gymnastic wheel's table (GymnasticsWheel), which this law's rolling rule became.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The plan closes over the table.
   */
  export function plan(
    context: IHumanActionContext<IParams>,
  ): IHumanActionPlan {
    const body: IHumanBody = context.body;
    const duration: number = HumanBound.above(
      "seconds",
      context.params.seconds ?? SECONDS,
      0,
      "s",
    );
    const sign: number = context.params.to === "right" ? 1 : -1;
    const standing: IHumanPosture = stand
      .plan({ ...context, params: { seconds: 1 } })
      .posture(0);
    const ease = (x: number): number => minimumJerk(x).s;

    // The body at an angle of the turn, its root at the origin.
    const shaped = (angle: number): IHumanPosture => ({
      ...ExerciseKey.posed(
        ExerciseKey.blend(
          ExerciseKey.STOOD,
          WHEEL,
          ease(Math.min(angle, 360 - angle) / SHAPE),
        ),
        standing.yaw,
      ),
      roll: sign * angle,
    });

    // The spokes, each bearing at the height its joint has when it bears:
    // an ankle's when the body stands on it, a wrist's over a laid palm.
    const entered: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
      poseBones(body, context.entry.pose);
    const laid: number = GymnasticsWheel.laid(body);
    const spokes: GymnasticsWheel.ISpoke[] = SPOKES.map(
      (bone: (typeof SPOKES)[number]): GymnasticsWheel.ISpoke => ({
        bones: [bone],
        height: bone.endsWith("Hand")
          ? laid
          : entered.get(bone)!.worldPosition.y,
        support: { kind: "ground" },
      }),
    );
    const wheel: GymnasticsWheel.IWheel = GymnasticsWheel.roll({
      body,
      shaped,
      spokes,
      start: standing.root,
      until: 360,
      step: STEP,
    });

    // The seconds at which the turn reaches an angle.
    const when = (angle: number): number =>
      GymnasticsWheel.when(angle, 360, duration);
    const contacts: IHumanContactWindow[] = GymnasticsWheel.contacts(
      wheel,
      spokes,
      (angle: number): number => when(angle) / duration,
    );
    const first = (suffix: string, after: number): number =>
      contacts.find(
        (window: IHumanContactWindow, index: number): boolean =>
          index >= after && window.part.endsWith(suffix),
      )?.from ?? 0.5;
    const events: IAutoMovieMotionEvent[] = [
      { name: "handsDown", share: first("Hand", 0) },
      { name: "inverted", share: when(180) / duration },
      {
        name: "feetDown",
        share: first(
          "Foot",
          contacts.findIndex((window: IHumanContactWindow): boolean =>
            window.part.endsWith("Hand"),
          ),
        ),
      },
      { name: "relax", share: 1 },
    ];
    return {
      duration,
      events,
      contacts,
      contact: when(180),
      posture: (seconds: number): IHumanPosture => {
        if (seconds >= duration)
          return { ...shaped(0), root: wheel.rows.at(-1)!.root };
        const angle: number = 360 * ease(seconds / duration);
        return { ...shaped(angle), root: wheel.root(angle) };
      },
    };
  }
}
