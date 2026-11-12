import { Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanoidRegion,
  AutoMovieMotionTarget,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { HumanActionName } from "../HumanActionName";
import { AutoMovieMotionClock } from "../compose/AutoMovieMotionClock";
import { AutoMovieMotionHumanArm } from "../compose/AutoMovieMotionHumanArm";
import { AutoMovieMotionHumanBase } from "../compose/AutoMovieMotionHumanBase";
import { AutoMovieMotionHumanBend } from "../compose/AutoMovieMotionHumanBend";
import { AutoMovieMotionHumanHead } from "../compose/AutoMovieMotionHumanHead";
import { AutoMovieMotionHumanInterrupt } from "../compose/AutoMovieMotionHumanInterrupt";
import { AutoMovieMotionHumanJoints } from "../compose/AutoMovieMotionHumanJoints";
import { AutoMovieMotionHumanTarget } from "../compose/AutoMovieMotionHumanTarget";
import { AutoMovieMotionHumanTiming } from "../compose/AutoMovieMotionHumanTiming";
import { AutoMovieMotionHumanTouch } from "../compose/AutoMovieMotionHumanTouch";
import { AutoMovieMotionHumanTouchEffector } from "../compose/AutoMovieMotionHumanTouchEffector";
import { AutoMovieMotionHumanTouchForm } from "../compose/AutoMovieMotionHumanTouchForm";
import { AutoMovieMotionManner } from "../compose/AutoMovieMotionManner";
import type { IAutoMovieMotionHumanPrimitive } from "../compose/IAutoMovieMotionHumanPrimitive";
import { composeAutoMovieMotionHumanAction } from "../compose/composeAutoMovieMotionHumanAction";
import { HumanTrunk } from "../everyday/HumanTrunk";
import { HumanBound } from "../law/HumanBound";
import type { IHumanActionContext } from "../law/IHumanActionContext";
import type { IHumanActionLaw } from "../law/IHumanActionLaw";
import type { IHumanActionPlan } from "../law/IHumanActionPlan";
import { HumanFrame } from "../posture/HumanFrame";
import type { HumanHand } from "../posture/HumanHand";
import type { IHumanPosture } from "../posture/IHumanPosture";
import { poseBones } from "../posture/poseBones";
import { handToFaceRows } from "./handToFaceRows";

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
 * the spoon (van der Kamp and Steenbergen 1999), reading flexes the head by
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
 * Gap: no prop is held; a chain that picks a cup up first holds the prop
 * through `HumanPerformance`, but this law places the hand for the implied
 * tool, not for the prop's own rim.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the tasks, the phases with their source, how each task is a row, the sourced and the provisional values, the events and the gap.
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

  /** The tasks. */
  export type Task = handToFaceRows.Task;

  /** One task's row. */
  export type IRow = handToFaceRows.IRow;

  /** The tasks' rows. */
  export const ROWS: Readonly<Record<Task, IRow>> = handToFaceRows.ROWS;

  /** The reading distance from the eyes to a held text, metres (Bababekova et al. 2011, mean for text). */
  export const READING: number = 0.362;

  /** The eyes' depression below the head's own line when reading, degrees (provisional). */
  export const GAZE: number = 15;

  /**
   * Parameters.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its meaning and default.
   * @evidence contracts/development/design.md#principled-representation The task by name, the hand, the repetitions and the time at the face.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The values the plan reads.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The row supplies every default.
   */
  export interface IParams {
    /** The task. */
    task: Task;

    /** The hand of a one-hand task; `right` when absent. */
    side?: HumanHand.Side;

    /** Repetitions at the face; the row's when absent. */
    count?: number;

    /** Seconds at the face after the repetitions; the row's when absent. */
    seconds?: number;

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
   * Where a held sheet is read: on the line from the eyes pitched down by
   * the head's flexion and the eyes' depression, at the reading distance,
   * facing back at the eyes.
   *
   * @param context The body.
   * @param posture The posture so far, whose head carries the eyes.
   * @param side The hand.
   * @returns The place.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the line, the distance and the facing.
   * @evidence contracts/development/implementation.md#principled-implementation The eyes' midpoint on the posture's trunk, the reading distance of Bababekova et al. 2011 along the gaze line pitched by the head's flexion and the provisional eye depression.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One trunk resolve and one line.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The distance and the depression are named constants.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses `HumanTrunk.resolve` and `HumanFrame.point`.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms One forward-kinematics pass.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function that retains nothing.
   */
  export function sheet(
    context: Pick<IHumanActionContext, "body">,
    posture: IHumanPosture,
    side: HumanHand.Side,
  ): Pick<AutoMovieMotionHumanTarget.IPlace, "point" | "normal"> {
    const bones = HumanTrunk.resolve(context.body, posture);
    const eyes: IAutoMovieVector3 = Vector3.scale(
      Vector3.add(
        bones.get("leftEye")!.worldPosition,
        bones.get("rightEye")!.worldPosition,
      ),
      0.5,
    );
    const head = posture.joints.head ?? [0, 0, 0];
    const neck = posture.joints.neck ?? [0, 0, 0];
    const down: number = ((head[0] + neck[0] + GAZE) * Math.PI) / 180;
    const line: IAutoMovieVector3 = HumanFrame.point(
      { origin: { x: 0, y: 0, z: 0 }, yaw: posture.yaw },
      {
        x: (side === "left" ? 1 : -1) * 0.05,
        y: -Math.sin(down),
        z: Math.cos(down),
      },
    );
    const unit: IAutoMovieVector3 = Vector3.normalize(line);
    return {
      point: Vector3.add(eyes, Vector3.scale(unit, READING)),
      normal: Vector3.scale(unit, -1),
    };
  }

  /**
   * Plan a hand-to-face task.
   *
   * @param context The action's context.
   * @returns The plan.
   * @throws {Error} When the count is not a positive whole number or the time at the face is negative.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the input, the plan and the refusals; the law's doc gives the phases, the rows and the sources.
   * @evidence contracts/development/implementation.md#principled-implementation The drinking task's phases (Alt Murphy et al. 2006) as a phrase clock, with the task's row run by the touch stroke per hand and the head's flexion pulsed on the same envelope.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Row, transport, clock with the task's event names, head pulse, one stroke per hand, composition.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Every value comes from the row or a named constant; tool lengths and head angles are marked provisional on the table.
   * @evidence contracts/development/implementation.md#efficient-algorithms One entry resolve and one elbow solve per hand at plan time.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Delegates to the touch stroke, the head share, the timing owner and the manner.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The plan closes over the entry bones and the clock.
   */
  export function plan(
    context: IHumanActionContext<IParams>,
  ): IHumanActionPlan {
    const p: IParams = context.params;
    const row: IRow = ROWS[p.task];
    const body = context.body;
    const count: number = p.count ?? row.count;
    const hold: number = p.seconds ?? row.hold;
    HumanBound.least("seconds", hold, 0, "s");
    const modifiers: AutoMovieMotionManner.IModifiers =
      AutoMovieMotionManner.of(context, p.manner);
    const entry: IHumanPosture = context.entry.posture;
    const bones = poseBones(body, context.entry.pose);
    const first: HumanHand.Side = p.side ?? "right";
    const hands: [HumanHand.Side, AutoMovieHumanoidRegion | null][] = [
      [first, row.region === null ? null : mirrored(row.region, first)],
      ...(row.other === undefined
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
      (posture: IHumanPosture, seconds: number) =>
        name === null
          ? sheet(context, posture, side)
          : AutoMovieMotionHumanTouch.region(
              context,
              { kind: "self", region: name } satisfies AutoMovieMotionTarget,
              context.start + seconds,
              posture,
              bones,
            );

    // The transport's length: the farther hand's distance to its place.
    let far: number = 0;
    for (const [side, name] of hands) {
      const at: IAutoMovieVector3 = region(side, name)(entry, 0).point;
      const from: IAutoMovieVector3 = AutoMovieMotionHumanTouchEffector.point(
        body,
        bones,
        side,
        row.effector,
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
        AutoMovieMotionHumanJoints.pulse(
          clock,
          ["start", "ready"],
          ["relax", "end"],
          AutoMovieMotionHumanHead.share(0, row.head * modifiers.extent),
        ),
      );
    // The head's place at the face, for the elbow's hint: the entry with the
    // head turned as it will be.
    const atFace: IHumanPosture = {
      ...entry,
      joints: {
        ...entry.joints,
        ...AutoMovieMotionHumanHead.share(0, row.head * modifiers.extent),
      },
    };
    for (const [side, name] of hands) {
      const lay: AutoMovieMotionHumanTouch.ITouch["lay"] =
        row.upright === true ? "upright" : "tangent";
      // A held vessel faces the way its arm turns it best at the face.
      const facing: IAutoMovieVector3 | undefined =
        row.upright === true
          ? AutoMovieMotionHumanTouch.upright(
              body,
              atFace,
              side,
              row.effector,
              region(side, name)(atFace, 0),
              AutoMovieMotionHumanBend.hang(body, atFace, side),
            )
          : undefined;
      const bend: IAutoMovieVector3 = AutoMovieMotionHumanTouch.bend(
        body,
        atFace,
        side,
        row.effector,
        region(side, name)(atFace, 0),
        row.tangent,
        lay,
        facing,
      );
      primitives.push(
        ...AutoMovieMotionHumanTouch.touch({
          body,
          clock,
          side,
          rest: AutoMovieMotionHumanArm.angles(context.entry.pose, side),
          effector: row.effector,
          region: region(side, name),
          kind: row.kind,
          count,
          tangent: row.tangent,
          extent: modifiers.extent,
          bend,
          reference: AutoMovieMotionHumanTouch.laid(
            body,
            atFace,
            side,
            row.effector,
            region(side, name)(atFace, 0),
            row.tangent,
            bend,
            lay,
            facing,
          ),
          lay,
          ...(facing === undefined ? {} : { facing }),
          entry,
          ...(name === null
            ? {}
            : {
                contact: {
                  kind: "person",
                  subject: context.subject,
                  region: name,
                },
              }),
        }),
      );
    }
    return composeAutoMovieMotionHumanAction({
      base: AutoMovieMotionHumanBase.still(
        clock.duration,
        entry,
        AutoMovieMotionHumanBase.plants(),
      ),
      clock,
      primitives,
      contact: row.at,
    });
  }
}
