import { Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanoidRegion,
  AutoMovieMotionTarget,
  IAutoMovieVector3,
} from "@automovie/interface";
import type { tags } from "typia";

import type { HumanActionName } from "../HumanActionName";
import { AutoMovieMotionClock } from "../compose/AutoMovieMotionClock";
import { AutoMovieMotionHumanArm } from "../compose/AutoMovieMotionHumanArm";
import { AutoMovieMotionHumanArmPlanned } from "../compose/AutoMovieMotionHumanArmPlanned";
import { AutoMovieMotionHumanBase } from "../compose/AutoMovieMotionHumanBase";
import { AutoMovieMotionHumanHead } from "../compose/AutoMovieMotionHumanHead";
import { AutoMovieMotionHumanInterrupt } from "../compose/AutoMovieMotionHumanInterrupt";
import { AutoMovieMotionHumanJoints } from "../compose/AutoMovieMotionHumanJoints";
import type { AutoMovieMotionHumanTarget } from "../compose/AutoMovieMotionHumanTarget";
import { AutoMovieMotionHumanTiming } from "../compose/AutoMovieMotionHumanTiming";
import { AutoMovieMotionHumanTouch } from "../compose/AutoMovieMotionHumanTouch";
import { AutoMovieMotionHumanTouchEffector } from "../compose/AutoMovieMotionHumanTouchEffector";
import { AutoMovieMotionHumanTouchForm } from "../compose/AutoMovieMotionHumanTouchForm";
import { AutoMovieMotionHumanVariationDraw } from "../compose/AutoMovieMotionHumanVariationDraw";
import { AutoMovieMotionManner } from "../compose/AutoMovieMotionManner";
import type { IAutoMovieMotionHumanPrimitive } from "../compose/IAutoMovieMotionHumanPrimitive";
import { composeAutoMovieMotionHumanAction } from "../compose/composeAutoMovieMotionHumanAction";
import type { HumanGrasp } from "../handling/HumanGrasp";
import { HumanHeld } from "../handling/HumanHeld";
import { HumanHeldUse } from "../handling/HumanHeldUse";
import { HumanBound } from "../law/HumanBound";
import type { HumanUnit } from "../law/HumanUnit";
import type { IHumanActionContext } from "../law/IHumanActionContext";
import type { IHumanActionLaw } from "../law/IHumanActionLaw";
import type { IHumanActionPlan } from "../law/IHumanActionPlan";
import type { HumanHand } from "../posture/HumanHand";
import type { IHumanPosture } from "../posture/IHumanPosture";
import { poseBones } from "../posture/poseBones";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import { handToFaceArm } from "./handToFaceArm";
import { handToFaceRows } from "./handToFaceRows";
import { handToFaceSheet } from "./handToFaceSheet";

/**
 * A hand-to-face task of daily living while standing: drinking, sipping,
 * eating with a spoon, biting held food, a phone at the ear, reading a held
 * sheet, brushing the teeth, combing the hair, washing the face and wiping
 * the mouth (M14, #3234).
 *
 * Every task takes the drinking task's phases (Alt Murphy et al. 2006,
 * 2011): reach and forward transport to the face, the task at the face,
 * back transport and return. Each is a row of the touch generator
 * (`AutoMovieMotionHumanTouch`) on a region of the performer's own head:
 * the effector is the tip of the implied tool (a cup's rim, a spoon's bowl,
 * a brush's head, a phone's face) stated in the hand's axes as shares of
 * the hand's length, or a bare palm, so the task is performed with no prop
 * and the hand stands where the tool would put it. A grooming task repeats
 * its stroke at the face (rub kinds); eating brings the head forward to meet
 * the spoon (van der Kamp and Steenbergen 1999), drinking tips the head back
 * only once the vessel is at the lips, in the drinking phase that follows
 * the transport (Alt Murphy et al. 2011), reading flexes the head by
 * 35 degrees, inside the 33 to 45 degrees of Lee et al. 2015, and holds the
 * sheet 36.2 cm from the eyes (Bababekova et al. 2011, the mean for text),
 * on the line pitched down by the head's flexion and 15 degrees of the eyes
 * (provisional). Tool lengths, the head's shares and the sip's extension
 * are provisional.
 *
 * Events: the phrase instants, with `atMouth` (or `atEar`, `atFace`,
 * `atSheet`) at `ready` and `taskEnd` at `strokeEnd`. The back transport may
 * be cut into a put-down or standing from `relax`.
 *
 * With `prop`, the task is performed with the prop the hand already holds
 * (a glass a `pickUp` took): the prop's own point, a vessel's `lip` or a
 * phone's `screen`, replaces the implied tool (`HumanHeld`), the
 * fingers keep their grip, and the hand holds the prop through the task and
 * after it. A prop that is not in the hand is refused. With the `grasp` the
 * prop was taken up by for its use, the hand holds it at the face as that
 * grasp presents it there (`HumanHeldUse`), so the task asks the wrist only
 * what the grip was chosen for; with `other` as well, the other hand takes
 * the prop's other handle where the first carries it, as a camera is held
 * in both hands.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the tasks, the phases with their source, how each task is a row, the sourced and the provisional values, the events and what a held prop changes.
 * @evidence contracts/development/design.md#principled-representation A law record whose tasks are rows of one touch generator with an implied tool.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The name, the cancel table, the task table, the parameters and the plan.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No task is a law of its own.
 */
export namespace handToFace {
  /** The action's name. */
  export const name: HumanActionName = "handToFace";

  /** Cancel table. */
  export const interrupts: IHumanActionLaw["interrupts"] =
    AutoMovieMotionHumanInterrupt.table({
      stand: ["fromRelax", "smooth"],
      putDown: ["fromRelax", "smooth"],
      gesture: ["fromRelax", "smooth"],
      walk: ["fromRelax", "smooth"],
      flinch: ["anytime", "reflex"],
    });

  /** A hand-to-face task may be performed over a carrier: it claims the acting arms, their hands and the head. */
  export const overlay: boolean = true;

  /** The tasks. */
  export type Task = handToFaceRows.Task;

  /** One task's row. */
  export type IRow = handToFaceRows.IRow;

  /** The tasks' rows. */
  export const ROWS: Readonly<Record<Task, IRow>> = handToFaceRows.ROWS;

  /**
   * Parameters.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its meaning and default.
   * @evidence contracts/development/design.md#principled-representation The task by name, the hand, the repetitions and the time at the face.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The values the plan reads.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The row supplies every default.
   */
  export interface IParams {
    /** The task: one of the table's by name, or a row of the production's own. */
    task: Task | IRow;

    /** The hand of a one-hand task; `right` when absent. */
    side?: HumanHand.Side;

    /** Repetitions at the face; the row's when absent. */
    count?: number;

    /** Seconds at the face after the repetitions, or two bounds the seed draws them between, evenly (a puff on a cigarette lasts 1.6 to 2.1 s); the row's when absent. */
    seconds?:
      | (number & tags.Minimum<0> & HumanUnit<"s">)
      | { between: readonly [number, number] };

    /** The subject id of the prop the acting hand holds, performed with instead of the implied tool; no prop when absent. */
    prop?: string;

    /** The prop's point that meets the face, one of its affordance ids; the row's (`lip` for a drink, `screen` for a phone) when absent. */
    point?: string;

    /**
     * With `prop`, the grasp it was taken up by for its use
     * (`HumanHeldUse.IGrasp`): the hand holds the prop at the face as that
     * grasp presents it at the row's region, the prop's point as the use's
     * working point, and moves only the point. The prop's point faces into
     * the region when absent.
     */
    grasp?: HumanHeldUse.IGrasp;

    /** With `grasp`, the prop's handle the other hand takes (a camera's far end): that hand is laid on it where the holding hand carries the prop, in place of the row's other region. The row's other hand when absent. */
    other?: string;

    /** How it is performed. */
    manner?: AutoMovieMotionManner.IManner;
  }

  /**
   * The region a row names for a hand: the right hand's region, mirrored for
   * the left.
   *
   * @param region The right hand's region.
   * @param side The hand.
   * @returns The region.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the mirroring rule.
   * @evidence contracts/development/implementation.md#principled-implementation Paired regions carry their side in the name, so mirroring swaps the suffix; a midline region is its own mirror.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One conditional chain.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Only the trailing side is swapped.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work with no algorithm to choose.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Nothing to reuse or cache.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function that retains nothing.
   */
  export function mirrored(
    region: AutoMovieHumanoidRegion,
    side: HumanHand.Side,
  ): AutoMovieHumanoidRegion {
    if (side === "right") return region;
    return region.endsWith("Right")
      ? (region.replace(/Right$/, "Left") as AutoMovieHumanoidRegion)
      : region.endsWith("Left")
        ? (region.replace(/Left$/, "Right") as AutoMovieHumanoidRegion)
        : region;
  }

  /**
   * Plan a hand-to-face task.
   *
   * @param context The action's context.
   * @returns The plan.
   * @throws {HumanRefusal} When the count is not a positive whole number, the time at the face is negative, `prop` names a prop the hand does not hold or a point the prop lacks, `grasp` comes without a held prop, its point or a region of the face, or `other` comes without `grasp` or names a handle the prop lacks.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the input, the plan and the refusals; the law's doc gives the phases, the rows and the sources.
   * @evidence contracts/development/implementation.md#principled-implementation The drinking task's phases (Alt Murphy et al. 2006) as a phrase clock, with the task's row run by the touch stroke per hand and the head's flexion pulsed on the same envelope; with `prop`, the acting hand's effector is the held prop's own point on its steadiest side (`HumanHeld`), the fingers are kept and the grip is declared.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Row, the head's place at the face, the effector, transport, clock with the task's event names, head pulse, one stroke per hand, composition, the kept hold.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Every value comes from the row or a named constant; tool lengths and head angles are marked provisional on the table.
   * @evidence contracts/development/implementation.md#efficient-algorithms One entry resolve and one elbow solve per hand at plan time; a held vessel adds the upright search on each of its eight sides.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Delegates to the touch stroke, the laid arm, the head share, the timing owner, the manner and `HumanHeld`.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The plan closes over the entry bones and the clock.
   */
  export function plan(
    context: IHumanActionContext<IParams>,
  ): IHumanActionPlan {
    const p: IParams = context.params;
    const row: IRow = typeof p.task === "string" ? ROWS[p.task] : p.task;
    const body = context.body;
    const count: number = p.count ?? row.count;
    const hold: number =
      typeof p.seconds === "object"
        ? p.seconds.between[0] +
          (p.seconds.between[1] - p.seconds.between[0]) *
            AutoMovieMotionHumanVariationDraw.uniforms(
              context.series("seconds"),
              1,
            )[0]!
        : (p.seconds ?? row.hold);
    HumanBound.least("seconds", hold, 0, "s");
    const modifiers: AutoMovieMotionManner.IModifiers =
      AutoMovieMotionManner.of(context, p.manner);
    const entry: IHumanPosture = context.entry.posture;
    const bones = poseBones(body, context.entry.pose);
    const first: HumanHand.Side = p.side ?? "right";

    // The acting hand's effector: the row's implied tool, or the point of
    // the prop that hand holds.
    let held: AutoMovieMotionHumanTouchEffector.IEffector | undefined;
    const effector = (
      side: HumanHand.Side,
    ): AutoMovieMotionHumanTouchEffector.IEffector =>
      p.prop === undefined || side !== first
        ? AutoMovieMotionHumanTouchForm.curled(row.effector, row.kind)
        : (held ??= grasped(p.prop));
    const hands: [HumanHand.Side, AutoMovieHumanoidRegion | null][] = [
      [first, row.region === null ? null : mirrored(row.region, first)],
      // A second hand on the held prop takes the place of the row's other.
      ...(row.other === undefined || p.other !== undefined
        ? []
        : [
            [first === "right" ? "left" : "right", row.other] as [
              HumanHand.Side,
              AutoMovieHumanoidRegion,
            ],
          ]),
    ];
    const region =
      (side: HumanHand.Side, name: AutoMovieHumanoidRegion | null) =>
      (posture: IHumanPosture, seconds: number) => {
        if (name === null) return handToFaceSheet.of(context, posture, side);
        const place: Pick<
          AutoMovieMotionHumanTarget.IPlace,
          "point" | "normal"
        > = AutoMovieMotionHumanTouch.region(
          context,
          { kind: "self", region: name } satisfies AutoMovieMotionTarget,
          context.start + seconds,
          posture,

          // Over a carrier the face travels with the body, so the region
          // is read on the bones the posture of that instant gives.
          context.carrier === undefined
            ? bones
            : poseBones(body, resolveHumanPosture(body, posture)),
        );
        // A row that stands its effector upright reads the region's normal
        // level, so its tangent `up` is the world's up.
        const level: number = Math.hypot(place.normal.x, place.normal.z);
        return row.level === true && level > 1e-6
          ? {
              ...place,
              normal: {
                x: place.normal.x / level,
                y: 0,
                z: place.normal.z / level,
              },
            }
          : place;
      };

    // The head turns as the hand arrives, or, drinking from a vessel, once
    // the vessel is at the lips: the head tips back with the vessel in the
    // drinking phase, after the transport (Alt Murphy et al. 2006, 2011).
    const turn: AutoMovieMotionHumanJoints.Angles =
      AutoMovieMotionHumanHead.share(0, row.head * modifiers.extent);
    const rises: readonly [string, string] =
      row.upright === true ? ["ready", "strokeEnd"] : ["start", "ready"];

    // The head's place at the face, for the elbow's hint and the arm's
    // search: the entry with the head turned as it is on the hand's arrival,
    // the turn added to the entry's own head and neck as the pulse adds it.
    // A drinker's head turns after the vessel arrives, so the vessel must
    // also be held there (`turned`).
    const turned: IHumanPosture = AutoMovieMotionHumanJoints.add({
      channels: AutoMovieMotionHumanJoints.channels(turn),
      from: 0,
      to: 0,
      delta: (): AutoMovieMotionHumanJoints.Angles => turn,
    }).write(entry, 0);
    const atFace: IHumanPosture = row.upright === true ? entry : turned;

    // The held prop's effector, on the side of the rim held most upright; a
    // drink leans it at the lips (`AutoMovieMotionHumanTouchDrink`).
    const grasped = (
      subject: string,
    ): AutoMovieMotionHumanTouchEffector.IEffector =>
      row.region === null
        ? HumanHeld.effector(context, row, first, subject, p.point)
        : HumanHeld.steadiest(
            context,
            row,
            first,
            subject,
            p.point,
            atFace,
            region(first, mirrored(row.region, first))(atFace, 0),
            row.upright === true,
          );

    // The transport's length: the farther hand's distance to its place.
    let far: number = 0;
    for (const [side, name] of hands) {
      const at: IAutoMovieVector3 = region(side, name)(entry, 0).point;
      const from: IAutoMovieVector3 = AutoMovieMotionHumanTouchEffector.point(
        body,
        bones,
        side,
        effector(side),
      );
      far = Math.max(far, Vector3.length(Vector3.subtract(at, from)));
    }
    const transport: number = AutoMovieMotionHumanTiming.transport(far);
    const repetition: number = AutoMovieMotionHumanTouchForm.period(
      body,
      row.kind,
      AutoMovieMotionHumanTiming.seconds(
        AutoMovieMotionHumanTouchForm.FORMS[row.kind].period,
      ),
    );
    const timed: AutoMovieMotionClock.IClock = AutoMovieMotionManner.time(
      AutoMovieMotionClock.phrase({
        prepare: transport,
        attack: count * repetition,
        hold,
        retract: transport,
      }),
      modifiers,
    );
    const clock: AutoMovieMotionClock.IClock = AutoMovieMotionClock.of(
      timed.duration,
      [
        ...timed.instants,
        { name: row.at, seconds: timed.at("ready") },
        { name: "taskEnd", seconds: timed.at("strokeEnd") },
      ],
    );

    const primitives: IAutoMovieMotionHumanPrimitive[] = [];
    if (row.head !== 0)
      primitives.push(
        AutoMovieMotionHumanJoints.pulse(clock, rises, ["relax", "end"], turn),
      );
    // A tool held as the grasp it was taken up by keeps that grasp's turn.
    const kept: HumanGrasp.IKey | null = HumanHeldUse.kept(
      context,
      first,
      {
        ...p,
        ...(row.point === undefined ? {} : { point: p.point ?? row.point }),
      },
      row.region === null ? null : mirrored(row.region, first),
    );
    // Two hands are planned as one trajectory.
    const together: AutoMovieMotionHumanArmPlanned.ITogether | undefined =
      hands.length > 1 ? AutoMovieMotionHumanArmPlanned.together() : undefined;
    for (const [side, name] of hands) {
      const own: HumanGrasp.IKey | null = side === first ? kept : null;
      // How the hand lies at the face, its elbow's hint and its reference.
      const arm: handToFaceArm.IArm = handToFaceArm.of({
        body,
        atFace,
        turned,
        side,
        effector: effector(side),
        place: region(side, name),
        tangent: row.tangent,
        upright: row.upright === true,
        own,
      });
      const { lay, bend, lean, facing } = arm;
      const stroke: AutoMovieMotionHumanTouch.ITouch = {
        body,
        clock,
        side,
        rest: AutoMovieMotionHumanArm.angles(context.entry.pose, side),
        effector: effector(side),
        region: region(side, name),
        kind: row.kind,
        count,
        tangent: row.tangent,
        extent: modifiers.extent,
        bend,
        reference: arm.reference,
        lay,
        ...(facing === undefined ? {} : { facing }),
        ...(lean === undefined ? {} : { lean }),
        ...(own === null ? {} : { held: own.wrist.rotation }),
        entry,
        ...(together === undefined ? {} : { together }),
        ...(p.prop !== undefined && side === first
          ? { fingers: "keep" as const }
          : {}),
        ...(name === null || (p.prop !== undefined && side === first)
          ? {}
          : {
              contact: {
                kind: "person",
                subject: context.subject,
                region: name,
              },
            }),
      };
      primitives.push(...AutoMovieMotionHumanTouch.touch(stroke));

      // The other hand on the held prop's other handle, where this hand's
      // goal carries it.
      if (own !== null && p.prop !== undefined && p.other !== undefined)
        primitives.push(
          ...HumanHeldUse.second({
            context,
            clock,
            side,
            prop: p.prop,
            handle: p.other,
            key: own,
            goal: AutoMovieMotionHumanTouch.goal(stroke),
            weight: (seconds: number): number =>
              AutoMovieMotionHumanTouch.share(clock, seconds),
          }),
        );
    }
    const plan: IHumanActionPlan = composeAutoMovieMotionHumanAction({
      base: AutoMovieMotionHumanBase.under(context, clock.duration),
      clock,
      primitives,
      contact: row.at,
    });

    // With a prop, the hand grips it through the whole task and keeps it after.
    return p.prop === undefined
      ? plan
      : HumanHeld.kept(context, plan, first, p.prop);
  }
}
