import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanLimb,
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  AutoMovieMotionHumanActionName,
  IAutoMovieMotionClock,
  IAutoMovieMotionClockPhase,
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

import { AutoMovieMotionClock } from "../compose/AutoMovieMotionClock";
import { AutoMovieMotionHumanArm } from "../compose/AutoMovieMotionHumanArm";
import { AutoMovieMotionHumanBase } from "../compose/AutoMovieMotionHumanBase";
import { AutoMovieMotionHumanBend } from "../compose/AutoMovieMotionHumanBend";
import { AutoMovieMotionHumanHeld } from "../compose/AutoMovieMotionHumanHeld";
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

/**
 * Working with a one-handed tool held in the hand, in cycles over a work
 * point while standing: hammering, sawing, stirring or turning a
 * screwdriver.
 *
 * The tool is the prop the hand holds (`prop`, taken up before, as
 * `pickUp` does), rigid in the hand from the instant its grip closed, so its
 * working point is its own `face` contact at a fixed offset in the hand's
 * frame (`AutoMovieMotionHumanHeld`), and the goal is that point on the
 * work, the hand following from it. The tool's line runs from its `grip` to
 * its `face` (`createTool`'s contacts). The work fixes that line (a hammer's
 * level at the strike, a spoon's upright, a screwdriver's along the heading,
 * a saw's sloping down to the cut), and the hand turns the least that lays
 * the held tool on it: a hammer's face and a saw's teeth turned down onto
 * the work, a screwdriver and a spoon with the palm inward, as a saw and a
 * screwdriver run on with the forearm. The saw's slope is the one of
 * `SLOPES` the arm holds with the least strain
 * ({@link AutoMovieMotionHumanBend.strain}). A hammer turns about the wrist
 * up to `RAISE` degrees and strikes back down onto the work point once a
 * cycle; a saw pushes and pulls its teeth along its line over the work point
 * by a stroke of half the forearm; a spoon circles inside the vessel it
 * stirs (`HumanToolWork`); a screwdriver turns about its own axis into the
 * work, the forearm's pronation and supination of 60 degrees each way
 * (inside the functional forearm rotation of Giachino, Benoit and Heaney
 * 2015, J Wrist Surg 4). The hand reaches the working pose in the aimed
 * movement time (McIntosh et al. 2018), works `cycles` cycles of `PERIODS`
 * seconds (provisional), and returns, its fingers kept closed on the tool
 * as the grip left them. Experts vary amplitude less (Bril et al. 2010, J
 * Exp Psychol Hum Percept Perform 36:825); the seeded variation is not drawn
 * yet. Events: `ready`, per cycle `contact<n>` (the strike, the stroke's
 * middle, the circle's nearest point, the turn's end), and `recover`.
 *
 * The plan carries the tool's working point in the hand (`IPlan.tool`), so a
 * capture reads it from the displayed hand; the tool stays held after.
 *
 * Not yet: two-handed tools (shovel, broom, mop), kneeling or seated work,
 * fatigue (Cote et al. 2002, 2005).
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the held-tool goal, each tool's cycle with its source, the timing, the events and what is missing.
 * @evidence contracts/development/design.md#principled-representation A law record of one arm row over a cycle clock on a held prop; the work is a closed union of four kinds.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Exposes the name, the cancel table, the parameters, the cycle table and the plan with its tool.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The work point is a target and the tool's reach is its own contacts; no tool length is typed.
 */
export namespace useTool {
  /** The action's name. */
  export const name: AutoMovieMotionHumanActionName = "useTool";

  /** Cancel table: work stops between cycles. */
  export const interrupts: IAutoMovieMotionHumanActionLaw["interrupts"] = {
    stand: [
      { window: ["recover", 1], kind: "inertialize", entry: 0, blend: 0.3 },
    ],
    putDown: [
      { window: ["recover", 1], kind: "inertialize", entry: 0, blend: 0.3 },
    ],
  };

  /** May be performed over a carrier, such as seated or while another action carries the body: it claims only the parts it moves. */
  export const overlay: boolean = true;

  /** Each work's cycle, seconds (provisional). */
  export const PERIODS: Readonly<Record<IAutoMovieMotionHumanToolWork.Kind, number>> = {
    hammer: 0.6,
    saw: 0.8,
    stir: 1.0,
    screwdriver: 0.7,
  };

  /** The slopes below the horizontal a saw's blade is tried at, degrees; the arm's least strain picks one (provisional band about the crosscut's 45). */
  export const SLOPES: readonly number[] = [20, 30, 40, 50, 60];

  /** The hammer's raise about the wrist, degrees (provisional). */
  export const RAISE: number = 60;

  /** The screwdriver's turn each way, degrees (Giachino et al. 2015's functional band). */
  export const TURN: number = 60;

  /** The hand's palm in its own rest axes, the direction `HumanHand.rotation` turns onto the asked palm. */
  const PALM: IAutoMovieVector3 = { x: 0, y: -1, z: 0 };

  /** A working pose: the tool's unit line toward its working point, the grip's place and the hand's rotation. */
  interface IWork {
    axis: IAutoMovieVector3;
    grip: IAutoMovieVector3;
    rotation: IAutoMovieQuaternion;
  }

  /**
   * Plan a tool's use.
   *
   * @param context The action's context.
   * @returns The plan with its tool.
   * @throws {HumanRefusal} When the cycle count is not a positive integer, the hand does not hold the tool, the tool has no `grip` or `face` or the two coincide, or a stir's work point is no vessel the spoon reaches into.
   *
   * @evidence contracts/development/common.md#meaningful-documentation The namespace states the tool's frames, the working goals, the cycle timing and the sources; the parameters and the refusals name each admitted input.
   * @evidence contracts/development/implementation.md#principled-implementation The goal is the held tool's working point on the work: the hand's rotation is the least turn that lays the tool's line on the work's (`HumanHand.prepareAlignment`), the grip follows rigidly from it, each cycle moves that pose by its kind's periodic law, and the face's offset from the wrist is the limb's contact, so a wrist that cannot reach the asked attitude is re-aimed to keep the face on the work.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Hold and work, the working pose, the clock, the cycle law, then the arm stroke with the kept grip.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The tool's reach is its own contacts and the work point the author's target; the saw's slope is chosen by the arm's own strain.
   * @evidence contracts/development/implementation.md#efficient-algorithms One alignment preparation, one strain-ranked elbow solve per saw slope tried (five), one entry hand read; per second one cycle pose and one elbow hint.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The working pose, the turn's axis and the pose at a contact's half cycle are computed once for the plan, since none depends on the second.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The plan holds the tool's geometry, the clock and the kept fingers for its lifetime; nothing grows with the seconds evaluated.
   */
  export function plan(context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanUseTool.IParams>): IAutoMovieMotionHumanUseTool.IPlan {
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
    // Four cycles when the author names none (provisional).
    const cycles: number = context.params.cycles ?? 4;
    HumanBound.whole("cycles", cycles);
    const modifiers: IAutoMovieMotionManner.IModifiers =
      AutoMovieMotionManner.of(context, context.params.manner);
    const yaw: number = context.entry.posture.yaw;
    const axes: (v: IAutoMovieVector3) => IAutoMovieVector3 = (v: IAutoMovieVector3): IAutoMovieVector3 =>
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
    const held: IAutoMovieMotionHumanHeld.IHeld = AutoMovieMotionHumanHeld.of(
      context,
      side,
      subject,
    );
    const face: { point: IAutoMovieVector3; direction: IAutoMovieVector3 } =
      AutoMovieMotionHumanHeld.point(held, "face");
    const reach: IAutoMovieVector3 = Vector3.subtract(
      face.point,
      AutoMovieMotionHumanHeld.point(held, "grip").point,
    );
    const length: number = Vector3.length(reach);

    // A face within a centimetre of the grip gives the tool no line to lay
    // on the work (provisional floor).
    if (!(length >= 0.01))
      throw new HumanRefusal({
        kind: "affordance",
        axis: "prop",
        value: subject,
        reason: `${subject}'s face lies ${(length * 1000).toFixed(1)} mm from its grip, too near to work with`,
        fix: "hold a tool whose working face stands off its grip, as createTool's do",
      });
    const line: IAutoMovieVector3 = Vector3.scale(reach, 1 / length);
    const work: HumanToolWork.IWork = HumanToolWork.of(context, {
      kind,
      on: context.params.on,
      forward,
      length,
    });
    const on: IAutoMovieVector3 = work.on;
    const gripOffset: IAutoMovieVector3 = HumanHand.offset(body, side, "grip", "relaxed").point;
    const contact: IAutoMovieVector3 = Vector3.add(gripOffset, face.point);

    // The working pose: the hand turned the least that lays the tool's line
    // on the work's, with a hammer's face and a saw's teeth turned down. A
    // face direction within about 18 degrees of the line (|cos| >= 0.95)
    // names no side to turn down, so the palm keys the turn instead.
    const keyed: boolean =
      (kind === "hammer" || kind === "saw") &&
      Math.abs(Vector3.dot(face.direction, line)) < 0.95;
    const align: ReturnType<typeof HumanHand.prepareAlignment> = HumanHand.prepareAlignment(
      { normal: line, forward: keyed ? face.direction : PALM },
    );
    const posed: (axis: IAutoMovieVector3) => IWork = (axis: IAutoMovieVector3): IWork => {
      const rotation: IAutoMovieQuaternion = align({ normal: axis, forward: keyed ? down : inward });
      return {
        axis,
        grip: Vector3.subtract(
          on,
          Quaternion.rotateVector(rotation, face.point),
        ),
        rotation,
      };
    };
    const strain: (pose: IWork, bends: ReturnType<typeof AutoMovieMotionHumanBend.prepare>) => number = (
      pose: IWork, bends: ReturnType<typeof AutoMovieMotionHumanBend.prepare>,
    ): number => {
      const props: IAutoMovieMotionHumanBend.ISolve = {
        body,
        posture: context.entry.posture,
        side,
        point: placeHumanHandSurface(gripOffset, pose.grip, pose.rotation).point,
        rotation: pose.rotation,
      };
      return bends.strain(
        props,
        bends.solve({ ...props, fallback: "hang" }),
      );
    };
    const pose: IWork = ((): IWork => {
      switch (kind) {
        case "hammer":
        case "screwdriver":
          return posed(forward);
        case "stir":
          return posed(down);
        case "saw": {
          const bends: ReturnType<typeof AutoMovieMotionHumanBend.prepare> =
            AutoMovieMotionHumanBend.prepare({ body, posture: context.entry.posture, side });
          const poses: IWork[] = SLOPES.map((degrees: number): IWork => {
            const slope: number = (degrees * Math.PI) / 180;
            return posed(
              Vector3.subtract(
                Vector3.scale(forward, Math.cos(slope)),
                Vector3.scale(up, Math.sin(slope)),
              ),
            );
          });
          const strains: number[] = poses.map((candidate: IWork): number => strain(candidate, bends));
          return poses[strains.indexOf(Math.min(...strains))]!;
        }
      }
    })();

    // The clock: reach, the cycles, return.
    const origin: IAutoMovieMotionHumanArmTarget.IOrigin =
      AutoMovieMotionHumanArm.origin(
        body,
        poseBones(body, context.entry.pose, undefined,
          new Set<AutoMovieHumanoidBone>([`${side}Hand`])),
        { origin: context.entry.posture.root, yaw },
        side,
        "grip",
      );
    const travel: number = AutoMovieMotionHumanTiming.aimed(
      Vector3.length(
        Vector3.subtract(
          pose.grip,
          AutoMovieMotionHumanArm.point(context.entry.posture, origin),
        ),
      ),
      // The grip stops within 0.03 m of its place (provisional target width).
      0.03,
    );
    const period: number = PERIODS[kind];
    const phases: IAutoMovieMotionClockPhase[] = [
      { name: "reaching", seconds: travel },
    ];
    for (let k: number = 1; k <= cycles; k++)
      phases.push(
        { name: k === 1 ? "ready" : `cycle${k}`, seconds: period / 2 },
        { name: `contact${k}`, seconds: period / 2 },
      );
    phases.push({ name: "recover", seconds: travel });
    const clock: IAutoMovieMotionClock = AutoMovieMotionManner.time(
      AutoMovieMotionClock.sequence(phases),
      modifiers,
      { holds: [] },
    );
    const duration: number = clock.duration;
    const ready: number = clock.at("ready");
    const recover: number = clock.at("recover");
    const strokePeriod: number = (recover - ready) / cycles;

    // The turning works: a hammer's head rises about the wrist, the axis
    // across the body; a screwdriver turns about its own line through the
    // work point.
    const turn: ((degrees: number) => Pick<IWork, "grip" | "rotation">) | undefined =
      kind === "hammer"
        ? HumanToolTurn(pose, left, placeHumanHandSurface(gripOffset, pose.grip, pose.rotation).point)
        : kind === "screwdriver"
          ? HumanToolTurn(pose, forward, on)
          : undefined;

    // The hand at a phase of the work, 0 at a contact and periodic in 1.
    const cycle: (phase: number) => Pick<IWork, "grip" | "rotation"> = (
      phase: number,
    ): { grip: IAutoMovieVector3; rotation: IAutoMovieQuaternion } => {
      switch (kind) {
        case "hammer": {
          // The head rises about the wrist and comes down on the work.
          const c: number = 0.5 - 0.5 * Math.cos(2 * Math.PI * phase);
          return turn!(-RAISE * c);
        }
        case "saw":
          // The teeth run a quarter of the forearm either way of the work
          // point, a stroke of half the forearm (provisional).
          return {
            grip: Vector3.add(
              pose.grip,
              Vector3.scale(
                pose.axis,
                0.25 * m.forearm * Math.sin(2 * Math.PI * phase),
              ),
            ),
            rotation: pose.rotation,
          };
        case "stir": {
          const r: number = work.radius;
          const a: number = 2 * Math.PI * phase;
          return {
            grip: Vector3.add(
              pose.grip,
              Vector3.add(
                Vector3.scale(forward, -r * Math.cos(a) + r),
                Vector3.scale(left, r * Math.sin(a)),
              ),
            ),
            rotation: pose.rotation,
          };
        }
        case "screwdriver":
          return turn!(TURN * Math.sin(2 * Math.PI * phase));
      }
    };
    const edge: ReturnType<typeof cycle> = cycle(0.5);
    const hand: (posture: IAutoMovieMotionHumanPosture, seconds: number) => IAutoMovieMotionHumanArmTarget.ITarget = (
      posture: IAutoMovieMotionHumanPosture,
      seconds: number,
    ): IAutoMovieMotionHumanArmTarget.ITarget => {
      // Half a cycle from a contact at the ready instant and at the
      // recovery, so the reach and the return meet the cycle where it is.
      const phase: number =
        seconds <= ready || seconds >= recover
          ? 0.5
          : ((seconds - ready) / strokePeriod + 0.5) % 1;
      const at: ReturnType<typeof cycle> = seconds <= ready || seconds >= recover
        ? edge : cycle(phase);
      return {
        surface: "grip",
        shape: "relaxed",
        point: at.grip,
        rotation: at.rotation,
        bend: AutoMovieMotionHumanBend.solve({
          body,
          posture,
          side,
          point: placeHumanHandSurface(gripOffset, at.grip, at.rotation).point,
          rotation: at.rotation,
          fallback: "hang",
        }),
      };
    };

    const base: IAutoMovieMotionHumanActionPlan = AutoMovieMotionHumanBase.under(
      context,
      duration,
    );
    const composed: IAutoMovieMotionHumanActionPlan = composeAutoMovieMotionHumanAction({
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
          target: hand,
          weight: (seconds: number): number =>
            clock.progress("reaching", "ready", seconds) -
            clock.progress("recover", "end", seconds),
        }),
      ],
    });
    // The fingers stay closed on the tool as the grip left them.
    const fingers: IAutoMovieMotionHumanPosture["joints"] = HumanGrip.fingers(
      context.entry.pose,
      side,
    );
    return {
      ...composed,
      contacts: [...composed.contacts, AutoMovieMotionHumanHeld.grip(held)],
      holds: [AutoMovieMotionHumanHeld.hold(context, held)],
      wields: { prop: subject, side, tip: "face" },
      posture: (seconds: number, _channels?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[1],
        resolution?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[2],
        projection?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[3]): IAutoMovieMotionHumanPosture => {
        const posture: IAutoMovieMotionHumanPosture = composed.posture(seconds, undefined, resolution, projection);
        const limb: AutoMovieHumanLimb = `${side}Arm`;

        // The task acts at the held face. Re-aim that existing rigid contact
        // when the wrist cannot attain the asked tool attitude.
        return {
          ...posture,
          joints: { ...posture.joints, ...fingers },
          limbs: { ...posture.limbs, [limb]: { ...posture.limbs[limb]!, contact: { ...contact } } },
        };
      },
      tool: { offset: face.point, on, kind },
    };
  }
}
