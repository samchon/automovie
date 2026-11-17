import { Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidRegion,
  AutoMovieMotionHumanActionName,
  IAutoMovieMotionClock,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanArmPlanned,
  IAutoMovieMotionHumanGrasp,
  IAutoMovieMotionHumanHandToFace,
  IAutoMovieMotionHumanHandToFaceArm,
  IAutoMovieMotionHumanHandToFaceRows,
  IAutoMovieMotionHumanJoints,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanPrimitive,
  IAutoMovieMotionHumanTarget,
  IAutoMovieMotionHumanTouch,
  IAutoMovieMotionHumanTouchDrink,
  IAutoMovieMotionHumanTouchEffector,
  IAutoMovieMotionManner,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionClock } from "../compose/AutoMovieMotionClock";
import { AutoMovieMotionHumanArm } from "../compose/AutoMovieMotionHumanArm";
import { AutoMovieMotionHumanArmObservation } from "../compose/AutoMovieMotionHumanArmObservation";
import { AutoMovieMotionHumanArmPlanned } from "../compose/AutoMovieMotionHumanArmPlanned";
import { AutoMovieMotionHumanBase } from "../compose/AutoMovieMotionHumanBase";
import { AutoMovieMotionHumanBend } from "../compose/AutoMovieMotionHumanBend";
import { AutoMovieMotionHumanHead } from "../compose/AutoMovieMotionHumanHead";
import { AutoMovieMotionHumanInterrupt } from "../compose/AutoMovieMotionHumanInterrupt";
import { AutoMovieMotionHumanJoints } from "../compose/AutoMovieMotionHumanJoints";
import { AutoMovieMotionHumanTiming } from "../compose/AutoMovieMotionHumanTiming";
import { AutoMovieMotionHumanTouch } from "../compose/AutoMovieMotionHumanTouch";
import { AutoMovieMotionHumanTouchEffector } from "../compose/AutoMovieMotionHumanTouchEffector";
import { AutoMovieMotionHumanTouchForm } from "../compose/AutoMovieMotionHumanTouchForm";
import { AutoMovieMotionHumanVariationDraw } from "../compose/AutoMovieMotionHumanVariationDraw";
import { AutoMovieMotionManner } from "../compose/AutoMovieMotionManner";
import { composeAutoMovieMotionHumanAction } from "../compose/composeAutoMovieMotionHumanAction";
import { HumanHeld } from "../handling/HumanHeld";
import { HumanHeldUse } from "../handling/HumanHeldUse";
import { HumanBound } from "../law/HumanBound";
import { poseBones } from "../posture/poseBones";
import { handToFaceArm } from "./handToFaceArm";
import { handToFaceRegion } from "./handToFaceRegion";
import { handToFaceRows } from "./handToFaceRows";
import { handToFaceVessel } from "./handToFaceVessel";

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
  export const name: AutoMovieMotionHumanActionName = "handToFace";

  /** Cancel table. */
  export const interrupts: IAutoMovieMotionHumanActionLaw["interrupts"] =
    AutoMovieMotionHumanInterrupt.table({
      stand: ["fromRelax", "smooth"],
      putDown: ["fromRelax", "smooth"],
      gesture: ["fromRelax", "smooth"],
      walk: ["fromRelax", "smooth"],
      flinch: ["anytime", "reflex"],
    });

  /** A hand-to-face task may be performed over a carrier: it claims the acting arms, their hands and the head. */
  export const overlay: boolean = true;

  /** The tasks' rows. */
  export const ROWS: Readonly<Record<IAutoMovieMotionHumanHandToFaceRows.Task, IAutoMovieMotionHumanHandToFaceRows.IRow>> = handToFaceRows.ROWS;

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
    side: AutoMovieHumanSide,
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
   * @evidence contracts/development/implementation.md#principled-implementation The drinking task's phases (Alt Murphy et al. 2006) as a phrase clock, with the task's row run by the touch stroke per hand and the head's flexion pulsed on the same envelope; with `prop`, the acting hand's effector is the held prop's own point, a vessel drunk from without a kept grasp on the rim side its drink admits (`handToFaceVessel`), any other on its steadiest side (`HumanHeld`), the fingers are kept and the grip is declared.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Row, the head's place at the face, the effector, transport, clock with the task's event names, head pulse, one stroke per hand, composition, the kept hold.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Every value comes from the row or a named constant; tool lengths and head angles are marked provisional on the table.
   * @evidence contracts/development/implementation.md#efficient-algorithms One entry resolve and one elbow solve per hand at plan time; a vessel drunk from adds the drink's search per rim side until one admits (its own side's alone when that admits), found once and handed to the arm, which does not search again; another held prop adds the upright search on each of its eight sides.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Delegates to the touch stroke, the laid arm, the head share, the timing owner, the manner and `HumanHeld`.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The plan closes over the entry bones and the clock.
   */
  export function plan(
    context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanHandToFace.IParams>,
  ): IAutoMovieMotionHumanActionPlan {
    const p: IAutoMovieMotionHumanHandToFace.IParams = context.params;
    const row: IAutoMovieMotionHumanHandToFaceRows.IRow = typeof p.task === "string" ? ROWS[p.task] : p.task;
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
    const modifiers: IAutoMovieMotionManner.IModifiers =
      AutoMovieMotionManner.of(context, p.manner);
    const entry: IAutoMovieMotionHumanPosture = context.entry.posture;
    const bones = poseBones(body, context.entry.pose);
    const first: AutoMovieHumanSide = p.side ?? "right";

    // The acting hand's effector: the row's implied tool, or the point of
    // the prop that hand holds.
    let held: IAutoMovieMotionHumanTouchEffector.IEffector | undefined;
    const effector = (
      side: AutoMovieHumanSide,
    ): IAutoMovieMotionHumanTouchEffector.IEffector =>
      p.prop === undefined || side !== first
        ? AutoMovieMotionHumanTouchForm.curled(row.effector, row.kind)
        : (held ??= grasped(p.prop));
    const hands: [AutoMovieHumanSide, AutoMovieHumanoidRegion | null][] = [
      [first, row.region === null ? null : mirrored(row.region, first)],
      // A second hand on the held prop takes the place of the row's other.
      ...(row.other === undefined || p.other !== undefined
        ? []
        : [
            [first === "right" ? "left" : "right", row.other] as [
              AutoMovieHumanSide,
              AutoMovieHumanoidRegion,
            ],
          ]),
    ];
    const region: ReturnType<typeof handToFaceRegion> = handToFaceRegion(context, row, bones);

    // The head turns as the hand arrives, or, drinking from a vessel, once
    // the vessel is at the lips: the head tips back with the vessel in the
    // drinking phase, after the transport (Alt Murphy et al. 2006, 2011).
    const turn: IAutoMovieMotionHumanJoints.Angles =
      AutoMovieMotionHumanHead.share(0, row.head * modifiers.extent);
    const rises: readonly [string, string] =
      row.upright === true ? ["ready", "strokeEnd"] : ["start", "ready"];

    // The head's place at the face, for the elbow's hint and the arm's
    // search: the entry with the head turned as it is on the hand's arrival,
    // the turn added to the entry's own head and neck as the pulse adds it.
    // A drinker's head turns after the vessel arrives, so the vessel must
    // also be held there (`turned`).
    const turned: IAutoMovieMotionHumanPosture = AutoMovieMotionHumanJoints.add({
      channels: AutoMovieMotionHumanJoints.channels(turn),
      from: 0,
      to: 0,
      delta: (): IAutoMovieMotionHumanJoints.Angles => turn,
    }).write(entry, 0);
    const atFace: IAutoMovieMotionHumanPosture = row.upright === true ? entry : turned;

    // A tool held as the grasp it was taken up by keeps that grasp's turn.
    const kept: IAutoMovieMotionHumanGrasp.IKey | null = HumanHeldUse.kept(
      context,
      first,
      {
        ...p,
        ...(row.point === undefined ? {} : { point: p.point ?? row.point }),
      },
      row.region === null ? null : mirrored(row.region, first),
    );

    // The held prop's effector. A vessel drunk from without a kept grasp
    // takes the side of its rim its drink admits, searched with the lean
    // and the facing (`handToFaceVessel`); any other prop the side held most
    // upright (`HumanHeld.steadiest`).
    let drunk: IAutoMovieMotionHumanTouchDrink.IDrink | undefined;
    const grasped = (
      subject: string,
    ): IAutoMovieMotionHumanTouchEffector.IEffector => {
      if (row.region === null)
        return HumanHeld.effector(context, row, first, subject, p.point);
      const at: (
        posture: IAutoMovieMotionHumanPosture,
        seconds: number,
      ) => Pick<IAutoMovieMotionHumanTarget.IPlace, "point" | "normal"> =
        region(first, mirrored(row.region, first));
      if (row.upright !== true || kept !== null)
        return HumanHeld.steadiest(context, row, first, subject, p.point,
          atFace, at(atFace, 0), row.upright === true);
      const vessel: handToFaceVessel.IVessel = handToFaceVessel.of(
        body,
        atFace,
        first,
        HumanHeld.sides(context, row, first, subject, p.point),
        at(atFace, 0),
        AutoMovieMotionHumanBend.hang(body, atFace, first),
        { posture: turned, place: at(turned, 0) },
      );
      drunk = vessel.drink;
      return vessel.effector;
    };

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
    // How each hand lies at the face, its elbow's hint and its reference.
    const arms: IAutoMovieMotionHumanHandToFaceArm.IArm[] = hands.map(
      ([side, name]: (typeof hands)[number]): IAutoMovieMotionHumanHandToFaceArm.IArm =>
        handToFaceArm.of({
          body,
          atFace,
          turned,
          side,
          effector: effector(side),
          place: region(side, name),
          tangent: row.tangent,
          upright: row.upright === true,
          own: side === first ? kept : null,
          // Read after `effector`, whose held vessel's search sets it.
          ...(side === first && drunk !== undefined ? { drink: drunk } : {}),
        }),
    );

    // The transport lasts at least as long as each arm needs to keep within
    // the audit's travel bound on the way to its place at the face
    // (`AutoMovieMotionHumanArmObservation.reachingGoal`): the default time reads
    // the hand's straight distance alone, and an arm whose fingertips sweep
    // an arc half again as long was asked to pass the bound whatever path
    // it took.
    let reach: number = 0;
    hands.forEach(([side]: (typeof hands)[number], i: number): void => {
      const laid: IAutoMovieMotionHumanHandToFaceArm.IArm = arms[i]!;
      reach = Math.max(
        reach,
        AutoMovieMotionHumanArmObservation.reachingGoal(
          body,
          atFace,
          side,
          AutoMovieMotionHumanArm.angles(context.entry.pose, side),
          { ...laid.goal, reference: laid.reference },
        ),
      );
    });
    const transport: number = Math.max(
      AutoMovieMotionHumanTiming.transport(far),
      reach,
    );
    const repetition: number = AutoMovieMotionHumanTouchForm.period(
      body,
      row.kind,
      AutoMovieMotionHumanTiming.seconds(
        AutoMovieMotionHumanTouchForm.FORMS[row.kind].period,
      ),
    );
    const timed: IAutoMovieMotionClock = AutoMovieMotionManner.time(
      AutoMovieMotionClock.phrase({
        prepare: transport,
        attack: count * repetition,
        hold,
        retract: transport,
      }),
      modifiers,
    );
    const clock: IAutoMovieMotionClock = AutoMovieMotionClock.of(
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
    // Two hands are planned as one trajectory; one hand is a group of one,
    const together: IAutoMovieMotionHumanArmPlanned.ITogether | undefined =
      AutoMovieMotionHumanArmPlanned.together(context.handover, true);
    for (const [index, [side, name]] of hands.entries()) {
      const own: IAutoMovieMotionHumanGrasp.IKey | null = side === first ? kept : null;
      const arm: IAutoMovieMotionHumanHandToFaceArm.IArm = arms[index]!;
      const { lay, bend, lean, facing } = arm;
      const stroke: IAutoMovieMotionHumanTouch.ITouch = {
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
    const plan: IAutoMovieMotionHumanActionPlan = composeAutoMovieMotionHumanAction({
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
