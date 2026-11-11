import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieMotionTarget,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { HumanActionName } from "../HumanActionName";
import { stand } from "../actions/stand";
import type { IHumanBody } from "../body/IHumanBody";
import { AutoMovieMotionClock } from "../compose/AutoMovieMotionClock";
import { AutoMovieMotionHumanArm } from "../compose/AutoMovieMotionHumanArm";
import { AutoMovieMotionHumanBend } from "../compose/AutoMovieMotionHumanBend";
import { AutoMovieMotionHumanTiming } from "../compose/AutoMovieMotionHumanTiming";
import { AutoMovieMotionManner } from "../compose/AutoMovieMotionManner";
import { composeAutoMovieMotionHumanAction } from "../compose/composeAutoMovieMotionHumanAction";
import type { IHumanActionContext } from "../law/IHumanActionContext";
import type { IHumanActionLaw } from "../law/IHumanActionLaw";
import type { IHumanActionPlan } from "../law/IHumanActionPlan";
import { HumanFrame } from "../posture/HumanFrame";
import { HumanHand } from "../posture/HumanHand";
import type { IHumanPosture } from "../posture/IHumanPosture";
import { poseBones } from "../posture/poseBones";

/**
 * Working with a one-handed tool held in the hand, in cycles over a work
 * point while standing: hammering, sawing, stirring or turning a
 * screwdriver.
 *
 * The tool is rigid in the hand: its working point (a hammer's face, a saw's
 * teeth, a spoon's bowl, a screwdriver's tip) sits at a fixed offset in the
 * hand's frame, `TOOLS` long from the grip (provisional lengths), so the
 * goal is that point on the work and the hand follows from it. A hammer
 * turns about the wrist up to `RAISE` degrees and strikes back down onto the
 * work point once a cycle, the handle level at the strike; a saw pushes and
 * pulls its teeth along the heading over the work point by a stroke of half
 * the forearm; a spoon circles the work point at a third of the forearm; a
 * screwdriver turns about its own axis into the work, the forearm's
 * pronation and supination of 60 degrees each way (inside the functional
 * forearm rotation of Giachino, Benoit and Heaney 2015, J Wrist Surg 4). The
 * hand reaches the working pose in the aimed movement time (McIntosh et al.
 * 2018), works `cycles` cycles of `PERIOD` seconds (provisional), and returns.
 * Experts vary amplitude less (Bril et al. 2010, J Exp Psychol Hum Percept
 * Perform 36:825); the seeded variation is not drawn yet. Events: `ready`,
 * per cycle `contact<n>` (the strike, the stroke's middle, the circle's
 * nearest point, the turn's end), and `recover`.
 *
 * The plan carries the tool's offset in the hand (`IPlan.tool`), so a
 * capture reads the working point from the displayed hand.
 *
 * Not yet: a held prop riding the hand (the grasp sub-issue's frozen
 * offset), two-handed tools (shovel, broom, mop), kneeling or seated work,
 * fatigue (Cote et al. 2002, 2005).
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the rigid-tool goal, each tool's cycle with its source, the timing, the events and what is missing.
 * @evidence contracts/development/design.md#principled-representation A law record of one arm row over a cycle clock; the tool is a closed union of four kinds.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Exposes the name, the cancel table, the parameters, the tool table and the plan with its tool.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The work point is a target; the tool's sizes are shares of the forearm or named lengths.
 */
export namespace useTool {
  /** The action's name. */
  export const name: HumanActionName = "useTool";

  /** Cancel table: work stops between cycles. */
  export const interrupts: IHumanActionLaw["interrupts"] = {
    stand: [
      { window: ["recover", 1], kind: "inertialize", entry: 0, blend: 0.3 },
    ],
    putDown: [
      { window: ["recover", 1], kind: "inertialize", entry: 0, blend: 0.3 },
    ],
  };

  /** A tool kind. */
  export type Kind = "hammer" | "saw" | "stir" | "screwdriver";

  /**
   * Parameters.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its default.
   * @evidence contracts/development/design.md#principled-representation The tool, the work point, the hand and the count.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Five members read by `plan`.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No hand place is typed.
   */
  export interface IParams {
    /** The tool. */
    tool: Kind;

    /** The work point: a nail, a cut line's middle, a pot's centre, a screw. */
    on: AutoMovieMotionTarget;

    /** The working hand; `right` when absent. */
    hand?: HumanHand.Side;

    /** How many cycles; 4 when absent. */
    cycles?: number;

    /** How it is performed. */
    manner?: AutoMovieMotionManner.IManner;
  }

  /** Each tool's working point from the grip in metres and its cycle in seconds (provisional). */
  export const TOOLS: Readonly<
    Record<Kind, { length: number; period: number }>
  > = {
    hammer: { length: 0.3, period: 0.6 },
    saw: { length: 0.3, period: 0.8 },
    stir: { length: 0.22, period: 1.0 },
    screwdriver: { length: 0.2, period: 0.7 },
  };

  /** The hammer's raise about the wrist, degrees (provisional). */
  export const RAISE: number = 60;

  /** The screwdriver's turn each way, degrees (Giachino et al. 2015's functional band). */
  export const TURN: number = 60;

  /** A tool's plan: the working point's offset in the hand's frame and the work point. */
  export interface IPlan extends IHumanActionPlan {
    /** The tool. */
    tool: {
      /** The working point from the grip socket, in the hand's frame, metres. */
      offset: IAutoMovieVector3;

      /** The work point, world metres. */
      on: IAutoMovieVector3;

      /** The tool kind. */
      kind: Kind;
    };
  }

  /**
   * Plan a tool's use.
   *
   * @param context The action's context.
   * @returns The plan with its tool.
   * @throws {Error} When the cycle count is not a positive integer.
   */
  export function plan(context: IHumanActionContext<IParams>): IPlan {
    const body: IHumanBody = context.body;
    const m = body.measure;
    const kind: Kind = context.params.tool;
    const side: HumanHand.Side = context.params.hand ?? "right";
    const cycles: number = context.params.cycles ?? 4;
    if (!(Number.isInteger(cycles) && cycles > 0))
      throw new Error("A tool works a positive whole number of cycles");
    const modifiers: AutoMovieMotionManner.IModifiers =
      AutoMovieMotionManner.of(context, context.params.manner);
    const on: IAutoMovieVector3 = context.aim(
      context.params.on,
      context.start,
    ).point;
    const yaw: number = context.entry.posture.yaw;
    const axes = (v: IAutoMovieVector3): IAutoMovieVector3 =>
      HumanFrame.point({ origin: { x: 0, y: 0, z: 0 }, yaw }, v);
    const forward: IAutoMovieVector3 = axes({ x: 0, y: 0, z: 1 });
    const left: IAutoMovieVector3 = axes({ x: 1, y: 0, z: 0 });
    const up: IAutoMovieVector3 = { x: 0, y: 1, z: 0 };
    const inward: IAutoMovieVector3 = Vector3.scale(
      left,
      side === "left" ? -1 : 1,
    );
    const length: number = TOOLS[kind].length;

    // The working pose: where the grip is and how the hand is turned when the
    // working point is on the work, and the tool's axis from the grip.
    const work = ((): {
      grip: IAutoMovieVector3;
      rotation: IAutoMovieQuaternion;
    } => {
      switch (kind) {
        case "hammer":
          return {
            grip: Vector3.subtract(on, Vector3.scale(forward, length)),
            rotation: HumanHand.rotation(side, {
              fingers: Vector3.scale(up, -1),
              palm: inward,
            }),
          };
        case "saw":
          return {
            grip: Vector3.add(
              Vector3.subtract(on, Vector3.scale(forward, length)),
              Vector3.scale(up, 0.08),
            ),
            rotation: HumanHand.rotation(side, {
              fingers: Vector3.scale(up, -1),
              palm: inward,
            }),
          };
        case "stir":
          return {
            grip: Vector3.add(on, Vector3.scale(up, length)),
            rotation: HumanHand.rotation(side, {
              fingers: inward,
              palm: Vector3.scale(forward, -1),
            }),
          };
        case "screwdriver":
          return {
            grip: Vector3.subtract(on, Vector3.scale(forward, length)),
            rotation: HumanHand.rotation(side, {
              fingers: Vector3.scale(up, -1),
              palm: inward,
            }),
          };
      }
    })();
    const offset: IAutoMovieVector3 = Quaternion.rotateVector(
      Quaternion.inverse(work.rotation),
      Vector3.subtract(on, work.grip),
    );

    // The clock: reach, the cycles, return.
    const origin: AutoMovieMotionHumanArm.IOrigin =
      AutoMovieMotionHumanArm.origin(
        body,
        poseBones(body, context.entry.pose),
        { origin: context.entry.posture.root, yaw },
        side,
        "grip",
      );
    const reach: number = AutoMovieMotionHumanTiming.aimed(
      Vector3.length(
        Vector3.subtract(
          work.grip,
          AutoMovieMotionHumanArm.point(context.entry.posture, origin),
        ),
      ),
      0.03,
    );
    const period: number = TOOLS[kind].period;
    const phases: AutoMovieMotionClock.IPhase[] = [
      { name: "reaching", seconds: reach },
    ];
    for (let k: number = 1; k <= cycles; k++)
      phases.push(
        { name: k === 1 ? "ready" : `cycle${k}`, seconds: period / 2 },
        { name: `contact${k}`, seconds: period / 2 },
      );
    phases.push({ name: "recover", seconds: reach });
    const clock: AutoMovieMotionClock.IClock = AutoMovieMotionManner.time(
      AutoMovieMotionClock.sequence(phases),
      modifiers,
      { holds: [] },
    );
    const duration: number = clock.duration;
    const ready: number = clock.at("ready");
    const recover: number = clock.at("recover");

    // The hand at a phase of the work, 0 at a contact and periodic in 1.
    const cycle = (
      phase: number,
    ): { grip: IAutoMovieVector3; rotation: IAutoMovieQuaternion } => {
      const turn = (
        axis: IAutoMovieVector3,
        degrees: number,
        about: IAutoMovieVector3,
      ) => {
        const q: IAutoMovieQuaternion = Quaternion.fromAxisAngle(axis, degrees);
        return {
          grip: Vector3.add(
            about,
            Quaternion.rotateVector(q, Vector3.subtract(work.grip, about)),
          ),
          rotation: Quaternion.multiply(q, work.rotation),
        };
      };
      const c: number = 0.5 - 0.5 * Math.cos(2 * Math.PI * phase);
      switch (kind) {
        case "hammer":
          // The head rises about the wrist and comes down on the work.
          return turn(left, -RAISE * c, work.grip);
        case "saw":
          return {
            grip: Vector3.add(
              work.grip,
              Vector3.scale(
                forward,
                0.25 * m.forearm * Math.sin(2 * Math.PI * phase),
              ),
            ),
            rotation: work.rotation,
          };
        case "stir": {
          const r: number = m.forearm / 3;
          const a: number = 2 * Math.PI * phase;
          return {
            grip: Vector3.add(
              work.grip,
              Vector3.add(
                Vector3.scale(forward, -r * Math.cos(a) + r),
                Vector3.scale(left, r * Math.sin(a)),
              ),
            ),
            rotation: work.rotation,
          };
        }
        case "screwdriver":
          return turn(forward, TURN * Math.sin(2 * Math.PI * phase), on);
      }
    };
    const hand = (
      posture: IHumanPosture,
      seconds: number,
    ): AutoMovieMotionHumanArm.ITarget => {
      // Half a cycle from a contact at the ready instant and at the
      // recovery, so the reach and the return meet the cycle where it is.
      const phase: number =
        seconds <= ready || seconds >= recover
          ? 0.5
          : ((seconds - ready) / ((recover - ready) / cycles) + 0.5) % 1;
      const at = cycle(phase);
      return {
        surface: "grip",
        shape: "relaxed",
        curl: 45,
        point: at.grip,
        rotation: at.rotation,
        bend: AutoMovieMotionHumanBend.solve({
          body,
          posture,
          side,
          point: HumanHand.place(
            body,
            side,
            "grip",
            at.grip,
            at.rotation,
            "relaxed",
          ).point,
          rotation: at.rotation,
          fallback: "hang",
        }),
      };
    };

    const base: IHumanActionPlan = stand.plan({
      ...context,
      params: { seconds: duration },
    });
    return {
      ...composeAutoMovieMotionHumanAction({
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
      }),
      tool: { offset, on, kind },
    };
  }
}
