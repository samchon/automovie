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

import { AutoMovieMotionClock } from "../../compose/internal/AutoMovieMotionClock";
import { AutoMovieMotionHumanArm } from "../../compose/internal/AutoMovieMotionHumanArm";
import { AutoMovieMotionHumanArmObservation } from "../../compose/internal/AutoMovieMotionHumanArmObservation";
import { AutoMovieMotionHumanArmPlanned } from "../../compose/internal/AutoMovieMotionHumanArmPlanned";
import { AutoMovieMotionHumanBase } from "../../compose/internal/AutoMovieMotionHumanBase";
import { AutoMovieMotionHumanBend } from "../../compose/internal/AutoMovieMotionHumanBend";
import { AutoMovieMotionHumanHead } from "../../compose/internal/AutoMovieMotionHumanHead";
import { AutoMovieMotionHumanInterrupt } from "../../compose/internal/AutoMovieMotionHumanInterrupt";
import { AutoMovieMotionHumanJoints } from "../../compose/internal/AutoMovieMotionHumanJoints";
import { AutoMovieMotionHumanTiming } from "../../compose/internal/AutoMovieMotionHumanTiming";
import { AutoMovieMotionHumanTouchEffector } from "../../compose/internal/AutoMovieMotionHumanTouchEffector";
import { AutoMovieMotionHumanTouchForm } from "../../compose/internal/AutoMovieMotionHumanTouchForm";
import { AutoMovieMotionHumanVariationDraw } from "../../compose/internal/AutoMovieMotionHumanVariationDraw";
import { AutoMovieMotionManner } from "../../compose/internal/AutoMovieMotionManner";
import { composeAutoMovieMotionHumanAction } from "../../compose/internal/composeAutoMovieMotionHumanAction";
import { touchPrimitive } from "../../compose/internal/touchPrimitive";
import { HumanHeld } from "../../handling/internal/HumanHeld";
import { HumanHeldEffector } from "../../handling/internal/HumanHeldEffector";
import { HumanHeldUse } from "../../handling/internal/HumanHeldUse";
import { planHumanHeldSupport } from "../../handling/internal/planHumanHeldSupport";
import { HumanBound } from "../../law/internal/HumanBound";
import { HumanRefusal } from "../../law/HumanRefusal";
import { poseBones } from "../../posture/internal/poseBones";
import { handToFaceArm } from "./handToFaceArm";
import { handToFaceDrinkable } from "./handToFaceDrinkable";
import { handToFaceMirrored } from "./handToFaceMirrored";
import { handToFaceRegion } from "./handToFaceRegion";
import { handToFaceRows } from "./handToFaceRows";
import { handToFaceSheet } from "./handToFaceSheet";
import { handToFaceVessel } from "./handToFaceVessel";

/**
 * A hand-to-face task of daily living while standing: drinking, sipping, eating
 * with a spoon, biting held food, a phone at the ear, reading a held sheet,
 * brushing the teeth, combing the hair, washing the face and wiping the mouth.
 *
 * Every task takes the drinking task's phases (Alt Murphy et al. 2006, 2011):
 * reach and forward transport to the face, the task at the face, back transport
 * and return. Each is a row of the touch generator
 * (`AutoMovieMotionHumanTouch`) on a region of the performer's own head: the
 * effector is the tip of the implied tool (a cup's rim, a spoon's bowl, a
 * brush's head, a phone's face) stated in the hand's axes as shares of the
 * hand's length, or a bare palm, so the task is performed with no prop and the
 * hand stands where the tool would put it. A grooming task repeats its stroke
 * at the face (rub kinds); eating brings the head forward to meet the spoon
 * (van der Kamp and Steenbergen 1999), drinking tips the head back only once
 * the vessel is at the lips, in the drinking phase that follows the transport
 * (Alt Murphy et al. 2011), and reading holds the sheet 36.2 cm from the eyes
 * (Bababekova et al. 2011, the mean for text) where the hanging arm's hand
 * meets that distance. While walking, the sheet follows the preferred
 * head-relative gaze and viewing distance measured for walking readers
 * (doi:10.1007/s00221-021-06267-6, Table 1). The head flexes by Lee et al.
 * 2015's measured 35 degrees and the eyes taking the rest of the line of sight
 * up to their range (`handToFaceSheet`). Tool lengths, the other head shares
 * and the sip's extension have no located measurement.
 *
 * Events: the phrase instants, with `atMouth` (or `atEar`, `atFace`, `atSheet`)
 * at `ready` and `taskEnd` at `strokeEnd`. The back transport may be cut into a
 * put-down or standing from `relax`.
 *
 * With `prop`, the task is performed with the prop the hand already holds (a
 * glass a `pickUp` took): the prop's own point, a vessel's `lip` or a phone's
 * `screen`, replaces the implied tool (`HumanHeld`), the fingers keep their
 * grip, and the hand holds the prop through the task and after it. A prop that
 * is not in the hand is refused. With the `grasp` the prop was taken up by for
 * its use, the hand holds it at the face as that grasp presents it there
 * (`HumanHeldUse`), so the task asks the wrist only what the grip was chosen
 * for; with `other` as well, the other hand takes the prop's other handle where
 * the first carries it, as a camera is held in both hands.
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

  /**
   * A hand-to-face task may be performed over a carrier: it claims the acting
   * arms, their hands and the head.
   */
  export const overlay: boolean = true;

  /** The tasks' rows. */
  export const ROWS: Readonly<
    Record<
      IAutoMovieMotionHumanHandToFaceRows.Task,
      IAutoMovieMotionHumanHandToFaceRows.IRow
    >
  > = handToFaceRows.ROWS;

  /**
   * Plan a hand-to-face task.
   *
   * @param context The action's context.
   * @returns The plan.
   * @throws {HumanRefusal} When the count is not a positive whole number, the
   *   time at the face is negative, `prop` names a prop the hand does not hold
   *   or a point the prop lacks, a vessel drunk from is held by a grip not
   *   taken for drinking (`pickUp` without a `use` at the mouth), `grasp` comes
   *   without a held prop, its point or a region of the face, or `other` comes
   *   without `grasp` or names a handle the prop lacks.
   */
  export function plan(
    context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanHandToFace.IParams>,
  ): IAutoMovieMotionHumanActionPlan {
    const p: IAutoMovieMotionHumanHandToFace.IParams = context.params;
    const row: IAutoMovieMotionHumanHandToFaceRows.IRow =
      typeof p.kind === "string" ? ROWS[p.kind] : p.kind;
    const body: IAutoMovieMotionHumanActionContext["body"] = context.body;
    const count: number = p.count ?? row.count;
    let hold: number;
    if (typeof p.hold === "object") {
      const lower: number = HumanBound.least(
        "seconds.between[0]",
        p.hold.between.minimumSeconds,
        0,
        "s",
      );
      const upper: number = HumanBound.least(
        "seconds.between[1]",
        p.hold.between.maximumSeconds,
        lower,
        "s",
      );
      hold =
        lower +
        (upper - lower) *
          AutoMovieMotionHumanVariationDraw.uniforms(
            context.series("seconds"),
            1,
          )[0]!;
    } else hold = HumanBound.least("hold", p.hold ?? row.hold, 0, "s");
    const modifiers: IAutoMovieMotionManner.IModifiers = AutoMovieMotionManner(
      context,
      p.manner,
    );
    const entry: IAutoMovieMotionHumanPosture = context.entry.posture;
    const bones: ReturnType<typeof poseBones> = poseBones(
      body,
      context.entry.pose,
    );
    const first: AutoMovieHumanSide = p.hand ?? "right";

    // The acting hand's effector: the row's implied tool, or the point of
    // the prop that hand holds.
    // The held prop's effector is read within this plan once its hand first
    // asks for it, after the arm's geometry below is laid (`grasped`).
    let held: IAutoMovieMotionHumanTouchEffector.IEffector | undefined;
    const effector = (
      side: AutoMovieHumanSide,
    ): IAutoMovieMotionHumanTouchEffector.IEffector => {
      if (p.prop === undefined || side !== first)
        return AutoMovieMotionHumanTouchForm.curled(row.effector, row.kind);
      if (held === undefined) held = grasped(p.prop);
      return held;
    };
    const hands: [AutoMovieHumanSide, AutoMovieHumanoidRegion | null][] = [
      [
        first,
        row.region === null ? null : handToFaceMirrored(row.region, first),
      ],
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
    const region: ReturnType<typeof handToFaceRegion> = handToFaceRegion(
      context,
      row,
      bones,
    );

    // The head turns as the hand arrives, or, drinking from a vessel, once
    // the vessel is at the lips: the head tips back with the vessel in the
    // drinking phase, after the transport (Alt Murphy et al. 2006, 2011).
    // A held sheet's reader flexes the head by the measured reading flexion,
    // more where the line of sight to the sheet passes the eye's range.
    const head: number =
      row.region === null
        ? handToFaceSheet.head(context, entry, first)
        : row.head;
    const turn: IAutoMovieMotionHumanJoints.Angles =
      AutoMovieMotionHumanHead.share(0, head * modifiers.extent);
    const rises: readonly [string, string] =
      row.upright === true ? ["ready", "strokeEnd"] : ["start", "ready"];

    // The head's place at the face, for the elbow's hint and the arm's
    // search: the entry with the head turned as it is on the hand's arrival,
    // the turn added to the entry's own head and neck as the pulse adds it.
    // A drinker's head turns after the vessel arrives, so the vessel must
    // also be held there (`turned`).
    const turned: IAutoMovieMotionHumanPosture = AutoMovieMotionHumanJoints.add(
      {
        channels: AutoMovieMotionHumanJoints.channels(turn),
        from: 0,
        to: 0,
        delta: (): IAutoMovieMotionHumanJoints.Angles => turn,
      },
    ).write(entry, 0);
    const atFace: IAutoMovieMotionHumanPosture =
      row.upright === true ? entry : turned;

    // A tool held as the grasp it was taken up by keeps that grasp's turn.
    const kept: IAutoMovieMotionHumanGrasp.IKey | null = HumanHeldUse.kept(
      context,
      first,
      {
        ...p,
        ...(row.point === undefined ? {} : { point: p.point ?? row.point }),
      },
      row.region === null ? null : handToFaceMirrored(row.region, first),
    );

    // A kept vessel presents the named rim point captured at pickup. Other
    // vessels may present any rim side admitted with the drinking lean
    // and the facing (`handToFaceVessel`); any other prop the side held most
    // upright (`HumanHeld.steadiest`).
    let drunk: IAutoMovieMotionHumanTouchDrink.IDrink | undefined;
    const grasped = (
      subject: string,
    ): IAutoMovieMotionHumanTouchEffector.IEffector => {
      if (row.region === null)
        return HumanHeld.effector(context, row, first, subject, p.point);
      // A vessel is drunk from with the grip it was taken for drinking: the
      // drinking task grasps the glass in its reach phase and transports it
      // to the mouth in that grasp (Alt Murphy et al. 2006). A grip chosen
      // for its reach alone (`pickUp` without a `use` at this region) is set
      // by where the vessel stood, not by the drink, so the drink is refused
      // with the way to take it, never searched for an arm it may not leave.
      // A prop the hand does not hold is refused by its owner (`HumanHeld`).
      if (
        row.upright === true &&
        context.entry.holds[first] === subject &&
        !handToFaceDrinkable(
          context.entry.uses[first],
          handToFaceMirrored(row.region, first),
        )
      )
        throw new HumanRefusal({
          kind: "reach",
          axis: "facing",
          value: first,
          reason: `the ${first} hand holds ${subject} by a grip chosen for its reach alone, not for drinking from it at the ${row.region}, so no arm brings it to the lips as a person drinks`,
          fix: `take ${subject} by a grip for its use: \`pickUp\` with \`use\` bringing its ${row.point ?? "lip"} to the mouth`,
        });
      const at: (
        posture: IAutoMovieMotionHumanPosture,
        seconds: number,
      ) => Pick<IAutoMovieMotionHumanTarget.IPlace, PlanGraspedAt> = region(
        first,
        handToFaceMirrored(row.region, first),
      );
      if (row.upright !== true)
        return HumanHeld.steadiest(
          context,
          row,
          first,
          subject,
          p.point,
          atFace,
          at(atFace, 0),
          false,
        );
      const vessel: handToFaceVessel.IVessel = handToFaceVessel(
        body,
        atFace,
        first,
        kept === null
          ? HumanHeld.sides(context, row, first, subject, p.point)
          : [HumanHeldEffector(context, row, first, subject, p.point, true)()],
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
      ([
        side,
        name,
      ]: (typeof hands)[number]): IAutoMovieMotionHumanHandToFaceArm.IArm =>
        handToFaceArm({
          body,
          atFace,
          turned,
          side,
          effector: effector(side),
          place: region(side, name),
          tangent: row.tangent,
          upright: row.upright === true,
          own: side === first && drunk === undefined ? kept : null,
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
    const support: boolean =
      kept !== null && p.prop !== undefined && p.other !== undefined;
    // Present the held tool before the support starts. The extra hold
    // interval lets the support withdraw before the holding arm returns.
    const timed: IAutoMovieMotionClock = AutoMovieMotionManner.time(
      AutoMovieMotionClock.phrase({
        prepare: transport,
        ...(support ? { wait: transport } : {}),
        attack: count * repetition,
        hold: hold + (support ? transport : 0),
        retract: transport,
      }),
      modifiers,
    );
    const clock: IAutoMovieMotionClock = AutoMovieMotionClock(timed.duration, [
      ...timed.instants,
      { name: row.at, seconds: timed.at("ready") },
      { name: "taskEnd", seconds: timed.at("strokeEnd") },
    ]);

    const primitives: IAutoMovieMotionHumanPrimitive[] = [];
    if (head !== 0)
      primitives.push(
        AutoMovieMotionHumanJoints.pulse(clock, rises, ["relax", "end"], turn),
      );
    // Direct touches can share a trajectory. A tool's secondary grip is
    // prepared separately against the already posed holding arm.
    const together: IAutoMovieMotionHumanArmPlanned.ITogether | undefined =
      AutoMovieMotionHumanArmPlanned.together(
        context.handover,
        true,
        context.tempo,
      );
    for (const [index, [side, name]] of hands.entries()) {
      const own: IAutoMovieMotionHumanGrasp.IKey | null =
        side === first ? kept : null;
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
        ...(own === null || drunk !== undefined
          ? {}
          : { held: own.wrist.rotation }),
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
      primitives.push(...touchPrimitive(stroke));
    }
    const base: ReturnType<typeof AutoMovieMotionHumanBase.under> =
      AutoMovieMotionHumanBase.under(context, clock.duration);
    if (support && p.prop !== undefined && p.other !== undefined) {
      // Preparation publishes the lead group's course. The final composer
      // reuses that course and adds the independently admitted support.
      const lead: IAutoMovieMotionHumanActionPlan =
        composeAutoMovieMotionHumanAction({
          base,
          clock,
          primitives,
        });
      const prepare: number = clock.at("strokeStart") - clock.at("ready");
      primitives.push(
        ...planHumanHeldSupport({
          context,
          clock,
          side: first,
          prop: p.prop,
          handle: p.other,
          lead,
          span: {
            start: clock.at("ready"),
            ready: clock.at("strokeStart"),
            relax: clock.at("relax") - prepare,
            end: clock.at("relax"),
          },
        }),
      );
    }
    const plan: IAutoMovieMotionHumanActionPlan =
      composeAutoMovieMotionHumanAction({
        base,
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

/** The alternatives of `PlanGraspedAt`'s site. */
type PlanGraspedAt = "point" | "normal";
