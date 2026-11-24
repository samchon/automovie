import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanLimb,
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  AutoMovieMotionHumanActionName,
  IAutoMovieAffordance,
  IAutoMovieMotionClock,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanArmTarget,
  IAutoMovieMotionHumanBend,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanHeld,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanToolWork,
  IAutoMovieMotionHumanUseTool,
  IAutoMovieMotionManner,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanArm } from "../compose/AutoMovieMotionHumanArm";
import { AutoMovieMotionHumanBase } from "../compose/AutoMovieMotionHumanBase";
import { AutoMovieMotionHumanBend } from "../compose/AutoMovieMotionHumanBend";
import { AutoMovieMotionHumanHeld } from "../compose/AutoMovieMotionHumanHeld";
import { AutoMovieMotionHumanInterrupt } from "../compose/AutoMovieMotionHumanInterrupt";
import { AutoMovieMotionHumanTiming } from "../compose/AutoMovieMotionHumanTiming";
import { AutoMovieMotionManner } from "../compose/AutoMovieMotionManner";
import { composeAutoMovieMotionHumanAction } from "../compose/composeAutoMovieMotionHumanAction";
import { HumanGrip } from "../handling/HumanGrip";
import { HumanBound } from "../law/HumanBound";
import { HumanRefusal } from "../law/HumanRefusal";
import { HumanFrame } from "../posture/HumanFrame";
import { HumanHand } from "../posture/HumanHand";
import { placeHumanHandSurface } from "../posture/placeHumanHandSurface";
import { poseBones } from "../posture/poseBones";
import { HumanToolTurn } from "./HumanToolTurn";
import { HumanToolWork } from "./HumanToolWork";
import { prepareToolPlayback } from "./prepareToolPlayback";
import { useToolClock } from "./useToolClock";
import { useToolCycle } from "./useToolCycle";
import { useToolPose } from "./useToolPose";
import { useToolTarget } from "./useToolTarget";

/** The record of `IPlanFace`'s site. */
type IPlanFace = { point: IAutoMovieVector3; direction: IAutoMovieVector3 };

/**
 * Working with a one-handed tool held in the hand, in cycles over a work point
 * while standing: hammering, sawing, stirring or turning a screwdriver.
 *
 * The tool is the prop the hand holds (`prop`, taken up before, as `pickUp`
 * does), rigid in the hand from the instant its grip closed, so its working
 * point is its own `face` contact at a fixed offset in the hand's frame
 * (`AutoMovieMotionHumanHeld`), and the goal is that point on the work, the
 * hand following from it. The tool's line runs from its `grip` to its `face`
 * (`createTool`'s contacts). The work fixes that line (a hammer's level at the
 * strike, a spoon's upright, a screwdriver's along the heading, a saw's sloping
 * down to the cut), and the hand turns the least that lays the held tool on it:
 * a hammer's face and a saw's teeth turned down onto the work, a screwdriver
 * and a spoon with the palm inward, as a saw and a screwdriver run on with the
 * forearm. The saw's slope is the one of `SLOPES` the arm holds with the least
 * strain ({@link AutoMovieMotionHumanBend.strain}). A hammer turns about the
 * wrist up to `RAISE` degrees and strikes back down onto the work point once a
 * cycle; a saw pushes and pulls its teeth along its line over the work point by
 * a stroke of half the forearm; a spoon circles inside the vessel it stirs
 * (`HumanToolWork`); a screwdriver turns about its own axis into the work, the
 * forearm's pronation and supination of `TURN` degrees each way. The hand
 * reaches the working pose in the timing owner's movement time
 * (`AutoMovieMotionHumanTiming`), works `cycles` cycles (a hammer's and a saw's
 * of `PERIODS` seconds, a stir's the time its circle takes at a tool stroke's
 * speed, `STROKE_SPEED`), and returns, its fingers kept closed on the tool as
 * the grip left them. Experts vary amplitude less (Bril et al. 2010, J Exp
 * Psychol Hum Percept Perform 36:825); the seeded variation is not drawn yet.
 * Events: `ready`, per cycle `contact<n>` (the strike, the stroke's middle, the
 * circle's nearest point, the turn's end), and `recover`.
 *
 * The plan carries the tool's working point in the hand (`IPlan.tool`), so a
 * capture reads it from the displayed hand; the tool stays held after.
 *
 * Not yet: two-handed tools (shovel, broom, mop), kneeling or seated work,
 * fatigue (Cote et al. 2002, 2005).
 */
export namespace useTool {
  /** The action's name. */
  export const name: AutoMovieMotionHumanActionName = "useTool";

  /** Cancel table: work stops between cycles. */
  export const interrupts: IAutoMovieMotionHumanActionLaw["interrupts"] = {
    stand: [
      {
        window: ["recover", 1],
        kind: "inertialize",
        entry: 0,
        blend: AutoMovieMotionHumanInterrupt.BLENDS.deliberate,
      },
    ],
    putDown: [
      {
        window: ["recover", 1],
        kind: "inertialize",
        entry: 0,
        blend: AutoMovieMotionHumanInterrupt.BLENDS.deliberate,
      },
    ],
  };

  /**
   * May be performed over a carrier, such as seated or while another action
   * carries the body: it claims only the parts it moves.
   */
  export const overlay: boolean = true;

  /**
   * The cycle of a work that keeps its own rhythm, seconds: a saw's push and
   * pull at the 2.0 Hz mean spontaneous sawing frequency of Starke and Baber
   * 2017 (PLOS ONE 12:e0173281); a hammer's strike at the 2 Hz its strikers
   * kept without pausing, where at 1 Hz they paused after each impact (Petrič
   * et al. 2017, Front Comput Neurosci 11:45). A screwdriver's 0.7 s has no
   * located measurement (self-paced screwdriving rates are reported only under
   * pacing); a stir's cycle follows from its circle (`STROKE_SPEED`).
   */
  export const PERIODS: Readonly<
    Record<Exclude<IAutoMovieMotionHumanToolWork.Kind, "stir">, number>
  > = {
    hammer: 0.5,
    saw: 0.5,
    screwdriver: 0.7,
  };

  /**
   * A tool stroke's mean hand speed, metres per second: two excursions of 14.0
   * cm per cycle at 2.10 Hz, real sawing in Starke and Baber 2017 (experiment
   * 5). A circling stroke (a stir, a wipe) goes round its circle at this
   * speed.
   */
  export const STROKE_SPEED: number = 2 * 0.14 * 2.1;

  /**
   * The slopes below the horizontal a saw's blade is tried at, degrees; the
   * arm's least strain picks one. The band holds Disston's crosscutting 45 and
   * ripping 60 (Tool Manual for School Shops, 1927); its shallower end has no
   * located source, and the sourced two alone leave a small body's arm 30 mm
   * short of the work, which the law does not yet answer by leaning or
   * stepping.
   */
  export const SLOPES: readonly number[] = [20, 30, 40, 50, 60];

  /**
   * The hammer's raise about the wrist from the strike to the full windup,
   * degrees: the 70 ± 10 degrees of wrist motion from windup to impact in a
   * simulated hammering task (Leventhal et al. 2010, J Hand Surg Am 35:1097,
   * Results, "Wrist and Forearm Motion").
   */
  export const RAISE: number = 70;

  /**
   * The screwdriver's turn each way of the forearm's neutral, degrees: a stroke
   * of 60, the most comfortable rotation of Bano, Mallick and Khan 2013 (Int J
   * Ergonomics 4:1), inside the functional 50 of pronation and of supination of
   * Morrey, Askew and Chao 1981 (J Bone Joint Surg Am 63:872).
   */
  export const TURN: number = 30;

  /**
   * The hand's palm in its own rest axes, the direction `HumanHand.rotation`
   * turns onto the asked palm.
   */
  const PALM: IAutoMovieVector3 = { x: 0, y: -1, z: 0 };

  /**
   * A working pose: the tool's unit line toward its working point, the grip's
   * place and the hand's rotation.
   */
  export interface IWork {
    /** The tool's unit line toward its working point, world frame. */
    axis: IAutoMovieVector3;

    /** The grip's place, world metres. */
    grip: IAutoMovieVector3;

    /** The hand's rotation, world frame. */
    rotation: IAutoMovieQuaternion;
  }

  /**
   * Plan a tool's use.
   *
   * @param context The action's context.
   * @returns The plan with its tool.
   * @throws {HumanRefusal} When the cycle count is not a positive integer, the
   *   hand does not hold the tool, the tool has no `grip` or `face` or its face
   *   lies within the hand that holds it, or a stir's work point is no vessel
   *   the spoon reaches into.
   */
  export function plan(
    context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanUseTool.IParams>,
  ): IAutoMovieMotionHumanUseTool.IPlan {
    const body: IAutoMovieMotionHumanBody = context.body;
    const m: IAutoMovieMotionHumanBody["measure"] = body.measure;
    const kind: IAutoMovieMotionHumanToolWork.Kind = context.params.tool;
    const subject: string = context.params.prop;
    const side: AutoMovieHumanSide =
      context.params.hand ??
      (context.entry.holds.left === subject &&
      context.entry.holds.right !== subject
        ? "left"
        : "right");
    // Four cycles when the author names none, the contract's default
    // (`IAutoMovieMotionHumanUseTool.IParams.cycles`).
    const cycles: number = context.params.count ?? 4;
    HumanBound.whole("count", cycles);
    const modifiers: IAutoMovieMotionManner.IModifiers = AutoMovieMotionManner(
      context,
      context.params.manner,
    );
    const yaw: number = context.entry.posture.yaw;
    const axes: (v: IAutoMovieVector3) => IAutoMovieVector3 = (
      v: IAutoMovieVector3,
    ): IAutoMovieVector3 =>
      HumanFrame.point({ origin: { x: 0, y: 0, z: 0 }, yaw }, v);
    const forward: IAutoMovieVector3 = axes({ x: 0, y: 0, z: 1 });
    const left: IAutoMovieVector3 = axes({ x: 1, y: 0, z: 0 });
    const up: IAutoMovieVector3 = { x: 0, y: 1, z: 0 };
    const down: IAutoMovieVector3 = { x: 0, y: -1, z: 0 };
    const inward: IAutoMovieVector3 = Vector3.scale(
      left,
      side === "left" ? -1 : 1,
    );

    // The held tool: its working point and its line in the hand's frame.
    const held: IAutoMovieMotionHumanHeld.IHeld = AutoMovieMotionHumanHeld(
      context,
      side,
      subject,
    );
    const face: IPlanFace = AutoMovieMotionHumanHeld.point(held, "face");
    const reach: IAutoMovieVector3 = Vector3.subtract(
      face.point,
      AutoMovieMotionHumanHeld.point(held, "grip").point,
    );
    const length: number = Vector3.length(reach);

    // A face no farther from the grip than the closed hand's own half
    // thickness, bounded by the wrist's radius, lies inside the fist and
    // gives the tool no line to lay on the work.
    if (!(length > m.forearmRadius))
      throw new HumanRefusal({
        kind: "affordance",
        axis: "prop",
        value: subject,
        reason: `${subject}'s face lies ${(length * 1000).toFixed(1)} mm from its grip, inside the hand that holds it (${(m.forearmRadius * 1000).toFixed(0)} mm)`,
        fix: "hold a tool whose working face stands off its grip, as createTool's do",
      });
    const line: IAutoMovieVector3 = Vector3.scale(reach, 1 / length);
    const work: HumanToolWork.IWork = HumanToolWork(context, {
      kind,
      on: context.params.on,
      forward,
      length,
    });
    const on: IAutoMovieVector3 = work.on;
    const gripOffset: IAutoMovieVector3 = HumanHand.offset(
      body,
      side,
      "grip",
      "relaxed",
    ).point;
    const contact: IAutoMovieVector3 = Vector3.add(gripOffset, face.point);

    // The working pose: the hand turned the least that lays the tool's line
    // on the work's, with a hammer's face and a saw's teeth turned down. A
    // face direction within about 18 degrees of the line (|cos| >= 0.95)
    // names no side to turn down, so the palm keys the turn instead.
    const keyed: boolean =
      (kind === "hammer" || kind === "saw") &&
      Math.abs(Vector3.dot(face.direction, line)) < 0.95;
    const align: ReturnType<typeof HumanHand.prepareAlignment> =
      HumanHand.prepareAlignment({
        normal: line,
        forward: keyed ? face.direction : PALM,
      });
    const posed: (axis: IAutoMovieVector3) => IWork = (
      axis: IAutoMovieVector3,
    ): IWork => {
      const rotation: IAutoMovieQuaternion = align({
        normal: axis,
        forward: keyed ? down : inward,
      });
      return {
        axis,
        grip: Vector3.subtract(
          on,
          Quaternion.rotateVector(rotation, face.point),
        ),
        rotation,
      };
    };
    const strain: (
      pose: IWork,
      bends: ReturnType<typeof AutoMovieMotionHumanBend.prepare>,
    ) => number = (
      pose: IWork,
      bends: ReturnType<typeof AutoMovieMotionHumanBend.prepare>,
    ): number => {
      const props: IAutoMovieMotionHumanBend.ISolve = {
        body,
        posture: context.entry.posture,
        side,
        point: placeHumanHandSurface(gripOffset, pose.grip, pose.rotation)
          .point,
        rotation: pose.rotation,
      };
      return bends.strain(props, bends.solve({ ...props, fallback: "hang" }));
    };
    const pose: IWork = useToolPose({
      kind,
      posed,
      forward,
      down,
      body,
      context,
      side,
      up,
      strain,
    });

    // The clock: reach, the cycles, return.
    const origin: IAutoMovieMotionHumanArmTarget.IOrigin =
      AutoMovieMotionHumanArm.origin(
        body,
        poseBones(
          body,
          context.entry.pose,
          undefined,
          new Set<AutoMovieHumanoidBone>([`${side}Hand`]),
        ),
        { origin: context.entry.posture.root, yaw },
        side,
        "grip",
      );
    // The reach brings the tool's face onto the work: aimed at the face's
    // own width where the tool declares one, else the timing law's rule for
    // a target of no measured width (`AutoMovieMotionHumanTiming`).
    const travel: number = AutoMovieMotionHumanTiming(
      Vector3.length(
        Vector3.subtract(
          pose.grip,
          AutoMovieMotionHumanArm.point(context.entry.posture, origin),
        ),
      ),
      {
        solid: true,
        width: context
          .prop(subject)
          .prop.affordances?.find(
            (a: IAutoMovieAffordance): boolean => a.id === "face",
          )?.width,
      },
    );
    const clock: IAutoMovieMotionClock = useToolClock({
      kind,
      work,
      travel,
      cycles,
      modifiers,
    });
    const duration: number = clock.duration;
    const ready: number = clock.at("ready");
    const recover: number = clock.at("recover");
    const strokePeriod: number = (recover - ready) / cycles;

    // The turning works: a hammer's head rises about the wrist, the axis
    // across the body; a screwdriver turns about its own line through the
    // work point.
    const turn:
      | ((degrees: number) => Pick<IWork, useToolCycle.PlanTurn>)
      | undefined =
      kind === "hammer"
        ? HumanToolTurn(
            pose,
            left,
            placeHumanHandSurface(gripOffset, pose.grip, pose.rotation).point,
          )
        : kind === "screwdriver"
          ? HumanToolTurn(pose, forward, on)
          : undefined;

    // The hand at a phase of the work, 0 at a contact and periodic in 1.
    const cycle: (phase: number) => Pick<IWork, useToolCycle.PlanCycle> =
      useToolCycle({ kind, turn, pose, m, work, forward, left });
    const edge: ReturnType<typeof cycle> = cycle(0.5);
    /** The complete grip goal on the target-side frame. */
    const target: (
      posture: IAutoMovieMotionHumanPosture,
      seconds: number,
      prepared?: ReturnType<typeof AutoMovieMotionHumanBend.prepare>,
    ) => IAutoMovieMotionHumanArmTarget.ITarget = useToolTarget({
      cycle,
      ready,
      recover,
      edge,
      strokePeriod,
      body,
      side,
      gripOffset,
      entry: context.entry.posture,
    });
    const hand: IAutoMovieMotionHumanArmTarget.Frame = (posture, seconds) =>
      target(posture, seconds);

    const base: IAutoMovieMotionHumanActionPlan =
      AutoMovieMotionHumanBase.under(context, duration);
    /**
     * Compose the unchanged transport around a current or prepared target
     * reader.
     */
    const compose = (
      frame: IAutoMovieMotionHumanArmTarget.Frame,
    ): IAutoMovieMotionHumanActionPlan =>
      composeAutoMovieMotionHumanAction({
        base,
        clock,
        contact: "contact1",
        primitives: [
          AutoMovieMotionHumanArm.move({
            body,
            side,
            from: 0,
            to: duration,
            origin,
            target: frame,
            weight: (seconds: number): number =>
              clock.progress("reaching", "ready", seconds) -
              clock.progress("recover", "end", seconds),
          }),
        ],
      });
    const composed: IAutoMovieMotionHumanActionPlan = compose(hand);
    // The fingers stay closed on the tool as the grip left them.
    const fingers: IAutoMovieMotionHumanPosture["joints"] = HumanGrip.fingers(
      context.entry.pose,
      side,
    );
    const limb: AutoMovieHumanLimb = `${side}Arm`;
    /** Keep the acquired fingers and the rigid contact on the transported hand. */
    const finish = (
      posture: IAutoMovieMotionHumanPosture,
    ): IAutoMovieMotionHumanPosture => ({
      ...posture,
      joints: { ...posture.joints, ...fingers },
      limbs: {
        ...posture.limbs,
        [limb]: { ...posture.limbs[limb]!, contact: { ...contact } },
      },
    });
    const plan: IAutoMovieMotionHumanUseTool.IPlan = {
      ...composed,
      contacts: [...composed.contacts, AutoMovieMotionHumanHeld.grip(held)],
      holds: [AutoMovieMotionHumanHeld.hold(context, held)],
      wields: { prop: subject, side, tip: "face" },
      posture: (
        seconds: number,
        _channels?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[1],
        resolution?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[2],
        projection?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[3],
      ): IAutoMovieMotionHumanPosture => {
        // The task acts at the held face. Re-aim that existing rigid contact
        // when the wrist cannot attain the asked tool attitude.
        return finish(
          composed.posture(seconds, undefined, resolution, projection),
        );
      },
      tool: { offset: face.point, on, kind },
    };

    if (context.carrier === undefined)
      prepareToolPlayback({
        plan,
        body,
        side,
        entry: context.entry.posture,
        ready,
        recover,
        target,
        compose,
        finish,
      });
    return plan;
  }
}
