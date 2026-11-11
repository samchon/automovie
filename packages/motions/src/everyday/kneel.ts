import { Vector3, minimumJerk } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import type { HumanActionName } from "../HumanActionName";
import { stand } from "../actions/stand";
import type { IHumanBody } from "../body/IHumanBody";
import { AutoMovieMotionClock } from "../compose/AutoMovieMotionClock";
import { AutoMovieMotionHumanArm } from "../compose/AutoMovieMotionHumanArm";
import { AutoMovieMotionHumanLeg } from "../compose/AutoMovieMotionHumanLeg";
import { AutoMovieMotionManner } from "../compose/AutoMovieMotionManner";
import type { IAutoMovieMotionHumanPrimitive } from "../compose/IAutoMovieMotionHumanPrimitive";
import { composeAutoMovieMotionHumanAction } from "../compose/composeAutoMovieMotionHumanAction";
import type { IHumanActionContext } from "../law/IHumanActionContext";
import type { IHumanActionLaw } from "../law/IHumanActionLaw";
import type { IHumanActionPlan } from "../law/IHumanActionPlan";
import type { IHumanContactWindow } from "../law/IHumanContactWindow";
import { HumanFoot } from "../posture/HumanFoot";
import { HumanFrame } from "../posture/HumanFrame";
import type { IHumanPosture } from "../posture/IHumanPosture";
import { hipJoints } from "../posture/hipJoints";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import { crouch } from "./crouch";

/**
 * Kneeling from standing: on one knee (half kneel), on both knees upright,
 * or sitting back on the heels, held, then rising the way it went down.
 *
 * The goals are floor points. The kneeling leg steps back onto the ball of
 * its foot, then the hips lower until its knee touches the floor straight
 * under its hip joint with the thigh upright, the shin lying back along the
 * floor to the foot, whose toes stay on the floor as it pivots about their
 * joint to the tucked toes of kneeling. The front foot stays planted with
 * its shank upright, so the hips stand behind its knee by what the thigh's
 * length leaves after the height difference; every place follows from the
 * leg's two lengths and the knee's radius over the floor. For both knees the
 * front leg then swings back and its knee lands beside the first, and for
 * sitting back the hips lower toward the heels until the knees flex
 * `SIT` degrees, the high-flexion band measured in kneeling (141.6 degrees,
 * Acker et al. 2011, J Arthroplasty 26:319; up to 157 +- 6 in deep postures,
 * Hemmerich et al. 2006, J Orthop Res 24:770). Pollard, Porter and Redfern
 * (2011, J Appl Biomech 27:233) give the four kneeling postures. The hands
 * rest on the thighs as the body settles.
 *
 * Each phase moves on minimum-jerk progress; its length is provisional,
 * scaled by the square root of the hip height (Alexander 1984) and by the
 * manner's tempo. The root is lowered wherever a planted leg could not reach
 * its foot. Events: `stepBack` at the start, `kneeContact`, `secondKnee` for
 * both knees, `seatOnHeels` for sitting back, `settled`, and when it rises
 * `kneeOff` and `stood`.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the goals, how every place follows from the body, the sources, the timing and the events, with provisional values marked.
 * @evidence contracts/development/design.md#principled-representation A law record composed of one body row over key states and two hand rows on one clock.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Exposes the name, the cancel table, the parameters, the constants and the plan.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No world coordinate is typed; every place is read from the body's measure.
 */
export namespace kneel {
  /** The action's name. */
  export const name: HumanActionName = "kneel";

  /** Cancel table: the body stands, crouches or handles a low thing once it has settled. */
  export const interrupts: IHumanActionLaw["interrupts"] = {
    stand: [{ window: ["settled", 1], kind: "inertialize", entry: 0, blend: 0.3 }],
    crouch: [{ window: ["settled", 1], kind: "inertialize", entry: 0, blend: 0.3 }],
    pickUp: [{ window: ["settled", 1], kind: "inertialize", entry: 0, blend: 0.3 }],
    putDown: [{ window: ["settled", 1], kind: "inertialize", entry: 0, blend: 0.3 }],
  };

  /** On one knee, on both knees upright, or sitting back on the heels. */
  export type Kind = "one" | "both" | "sitBack";

  /**
   * Parameters.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its meaning and its default.
   * @evidence contracts/development/design.md#principled-representation A closed kind, a side, a hold and whether to rise.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Five optional members, all read by `plan`.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No place or angle is typed by the author.
   */
  export interface IParams {
    /** The kneeling posture; `one` when absent. */
    kind?: Kind;

    /** The knee that goes down first; `right` when absent. */
    knee?: "left" | "right";

    /** Seconds held kneeling; 1.5 when absent. */
    hold?: number;

    /** Whether the body rises again at the end; `true` when absent. */
    rise?: boolean;

    /** How it is performed. */
    manner?: AutoMovieMotionManner.IManner;
  }

  /** The foot's pitch on its tucked toes, degrees toes down (provisional, inside the toes' 80 degree extension). */
  export const TUCK: number = 60;

  /** The foot's pitch on its ball as it lands behind, degrees toes down (provisional). */
  export const BALL: number = 20;

  /** Knee flexion sitting back on the heels, degrees (Acker et al. 2011; inside the range table's 150). */
  export const SIT: number = 145;

  /** Seconds of each phase for a 0.93 m hip height (provisional). */
  export const PHASES: Readonly<
    Record<"step" | "lower" | "second" | "sit", number>
  > = { step: 0.7, lower: 1.0, second: 0.9, sit: 0.8 };

  /** The swinging ankle's greatest rise over its straight path, as a share of the shank (provisional). */
  export const CLEARANCE: number = 0.15;

  /**
   * Plan a kneel.
   *
   * @param context The action's context.
   * @returns The plan.
   * @throws {Error} When the hold is negative.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the plan and its refusal; the namespace gives the law.
   * @evidence contracts/development/implementation.md#principled-implementation Key states solved from the leg lengths and the knee's radius, joined by minimum-jerk phases; a foot whose toes' joint does not move pivots on it, one that moves swings on an arc.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Key states, a phase list, one body row and two hand rows.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The constants are named and provisional; the root is lowered only where a planted leg cannot reach.
   * @evidence contracts/development/implementation.md#efficient-algorithms Two 40-step bisections per plan; each posture costs one lowering and two arm solves.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Key states are computed once.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The plan closes over its key states and the base.
   */
  export function plan(
    context: IHumanActionContext<IParams>,
  ): IHumanActionPlan {
    const body: IHumanBody = context.body;
    const m = body.measure;
    const kind: Kind = context.params.kind ?? "one";
    const k: "left" | "right" = context.params.knee ?? "right";
    const f: "left" | "right" = k === "left" ? "right" : "left";
    const hold: number = context.params.hold ?? 1.5;
    const rise: boolean = context.params.rise ?? true;
    if (!(hold >= 0)) throw new Error("A kneel's hold is not negative");
    const modifiers: AutoMovieMotionManner.IModifiers = AutoMovieMotionManner.of(
      context,
      context.params.manner,
    );
    const probe: IHumanActionPlan = stand.plan({
      ...context,
      params: { seconds: 1 },
    });
    const standing: IHumanPosture = probe.posture(0);
    const yaw: number = standing.yaw;
    const up: IAutoMovieVector3 = { x: 0, y: 1, z: 0 };
    const forward: IAutoMovieVector3 = HumanFrame.point(
      { origin: { x: 0, y: 0, z: 0 }, yaw },
      { x: 0, y: 0, z: 1 },
    );

    // Standing feet as toes' joints on the floor with their headings.
    const flat = (side: "left" | "right"): HumanFoot.IPlacement => {
      const goal: IHumanPosture.IGoal = standing.limbs[`${side}Leg`]!;
      return {
        ankle: goal.point,
        rotation: goal.rotation ?? HumanFrame.turn(yaw),
      };
    };
    const foot0: Record<"left" | "right", IFoot> = {
      left: {
        at: HumanFoot.point(body, "left", "mtp", flat("left")),
        heading: HumanFoot.heading(flat("left").rotation),
        pitch: 0,
      },
      right: {
        at: HumanFoot.point(body, "right", "mtp", flat("right")),
        heading: HumanFoot.heading(flat("right").rotation),
        pitch: 0,
      },
    };
    const ankleOf = (side: "left" | "right", foot: IFoot): IAutoMovieVector3 =>
      HumanFoot.pivot(body, side, "mtp", foot.at, foot.heading, foot.pitch)
        .ankle;

    // The kneeling height: the knee joint a shank radius over the floor, the
    // hip joint a thigh above it (provisional knee radius).
    const knee: number = m.shankRadius;
    const hipY: number = knee + m.thigh;
    const frontAnkle: IAutoMovieVector3 = flat(f).ankle;
    const above: number = hipY - (frontAnkle.y + m.shank);
    const behind: number = Math.sqrt(
      Math.max(0, m.thigh * m.thigh - above * above),
    );
    const rest = hipJoints(body, { x: 0, y: 0, z: 0 }, HumanFrame.turn(yaw));
    const standingHips = hipJoints(body, standing.root, HumanFrame.turn(yaw));
    const hipK: IAutoMovieVector3 = {
      ...Vector3.add(
        standingHips[k],
        Vector3.scale(
          forward,
          Vector3.dot(
            Vector3.subtract(frontAnkle, standingHips[k]),
            forward,
          ) - behind,
        ),
      ),
      y: hipY,
    };
    const rootKneel: IAutoMovieVector3 = Vector3.subtract(hipK, rest[k]);

    // A tucked foot behind a knee: the toes' joint as far back as puts the
    // ankle a shank from the knee.
    const tucked = (
      side: "left" | "right",
      kneeAt: IAutoMovieVector3,
    ): IFoot => {
      const foot = (d: number): IFoot => ({
        at: {
          ...Vector3.subtract(kneeAt, Vector3.scale(forward, d)),
          y: foot0[side].at.y,
        },
        heading: foot0[side].heading,
        pitch: -TUCK,
      });
      let lo: number = 0;
      let hi: number = m.shank + m.footLength;
      for (let i: number = 0; i < 40; i++) {
        const mid: number = (lo + hi) / 2;
        if (
          Vector3.length(Vector3.subtract(ankleOf(side, foot(mid)), kneeAt)) <
          m.shank
        )
          lo = mid;
        else hi = mid;
      }
      return foot((lo + hi) / 2);
    };
    const kneeK: IAutoMovieVector3 = Vector3.subtract(
      hipK,
      Vector3.scale(up, m.thigh),
    );
    const backFoot: IFoot = tucked(k, kneeK);
    const kneeF: IAutoMovieVector3 = {
      ...Vector3.add(rootKneel, rest[f]),
      y: knee,
    };
    const secondFoot: IFoot = tucked(f, kneeF);

    // Sitting back: each thigh turns back about its knee until the knee
    // flexes SIT degrees, the hips coming down toward the heels.
    const shankDir: IAutoMovieVector3 = Vector3.normalize(
      Vector3.subtract(ankleOf(k, backFoot), kneeK),
    );
    const across: IAutoMovieVector3 = Vector3.normalize(
      Vector3.cross(shankDir, up),
    );
    const normal: IAutoMovieVector3 = Vector3.normalize(
      Vector3.cross(across, shankDir),
    );
    const open: number = ((180 - SIT) * Math.PI) / 180;
    const hipSit: IAutoMovieVector3 = Vector3.add(
      kneeK,
      Vector3.scale(
        Vector3.add(
          Vector3.scale(shankDir, Math.cos(open)),
          Vector3.scale(normal, Math.sin(open)),
        ),
        m.thigh,
      ),
    );
    const rootSit: IAutoMovieVector3 = Vector3.subtract(hipSit, rest[k]);

    // Key states, from standing down.
    const stepped: IKey = {
      root: Vector3.lerp(standing.root, rootKneel, 0.4),
      feet: {
        [f]: { ...foot0[f], planted: true },
        [k]: { ...backFoot, pitch: -BALL, planted: true },
      } as IKey["feet"],
    };
    const keys: IKey[] = [
      {
        root: standing.root,
        feet: {
          left: { ...foot0.left, planted: true },
          right: { ...foot0.right, planted: true },
        },
      },
      stepped,
      {
        root: rootKneel,
        feet: {
          [f]: { ...foot0[f], planted: true },
          [k]: { ...backFoot, planted: true },
        } as IKey["feet"],
      },
    ];
    if (kind !== "one")
      keys.push({
        root: rootKneel,
        feet: {
          [f]: { ...secondFoot, planted: true },
          [k]: { ...backFoot, planted: true },
        } as IKey["feet"],
      });
    if (kind === "sitBack")
      keys.push({ ...keys.at(-1)!, root: rootSit });

    // Phases: down through the keys, a hold, and back up when rising.
    const scale: number = Math.sqrt(m.hipHeight / 0.93);
    const downNames: readonly [string, number][] = [
      ["stepBack", PHASES.step],
      ["lowering", PHASES.lower],
      ["kneeContact", PHASES.second],
      ["secondKnee", PHASES.sit],
    ];
    const phases: IPhase[] = [];
    for (let i: number = 0; i + 1 < keys.length; i++)
      phases.push({
        name: downNames[i]![0],
        seconds: downNames[i]![1] * scale,
        from: i,
        to: i + 1,
      });
    const bottom: number = keys.length - 1;
    const marks: string[] =
      kind === "one"
        ? ["kneeContact"]
        : kind === "both"
          ? ["secondKnee"]
          : ["seatOnHeels"];
    for (const mark of marks)
      phases.push({ name: mark, seconds: 0, from: bottom, to: bottom });
    phases.push({ name: "settled", seconds: hold, from: bottom, to: bottom });
    if (rise) {
      const upNames: readonly string[] =
        kind === "one"
          ? ["kneeOff", "stepForward"]
          : kind === "both"
            ? ["kneeOff", "frontUp", "stepForward"]
            : ["seatOff", "kneeOff", "frontUp", "stepForward"];
      for (let i: number = bottom; i > 0; i--)
        phases.push({
          name: upNames[bottom - i]!,
          seconds: phases[i - 1]!.seconds,
          from: i,
          to: i - 1,
        });
      phases.push({ name: "stood", seconds: 0, from: 0, to: 0 });
    }
    const clock: AutoMovieMotionClock.IClock = AutoMovieMotionManner.time(
      AutoMovieMotionClock.sequence(
        phases.map((p: IPhase) => ({ name: p.name, seconds: p.seconds })),
      ),
      modifiers,
      { holds: ["settled"] },
    );
    const duration: number = clock.duration;
    const at = (seconds: number): { phase: IPhase; u: number } => {
      let index: number = 0;
      for (let i: number = 0; i < phases.length; i++)
        if (seconds >= clock.at(phases[i]!.name) - 1e-9) index = i;
      const phase: IPhase = phases[index]!;
      const next: string =
        index + 1 < phases.length ? phases[index + 1]!.name : "end";
      return {
        phase,
        u: minimumJerk(clock.linear(phase.name, next, seconds)).s,
      };
    };

    // A foot between two keys: pivoting on its toes' joint when that stays,
    // swinging on an arc when it moves.
    const footAt = (
      side: "left" | "right",
      a: IFoot & { planted: boolean },
      b: IFoot & { planted: boolean },
      u: number,
    ): { placement: HumanFoot.IPlacement; planted: boolean; toes: number } => {
      const moves: boolean = Vector3.length(Vector3.subtract(a.at, b.at)) > 1e-4;
      const placed = (foot: IFoot): HumanFoot.IPlacement =>
        HumanFoot.pivot(body, side, "mtp", foot.at, foot.heading, foot.pitch);
      const pitch: number = a.pitch + (b.pitch - a.pitch) * u;
      if (!moves)
        return {
          placement: placed({ ...a, pitch }),
          planted: a.planted && b.planted,
          toes: Math.max(0, -pitch),
        };
      return {
        placement: AutoMovieMotionHumanLeg.arc(
          placed(a),
          placed(b),
          CLEARANCE * m.shank,
          u,
        ),
        planted: u <= 0 || u >= 1,
        toes: Math.max(0, -pitch),
      };
    };

    const kneelBody: IAutoMovieMotionHumanPrimitive = {
      channels: ["root", "leftLeg", "rightLeg"],
      from: 0,
      to: duration,
      write: (posture: IHumanPosture, seconds: number): IHumanPosture => {
        const { phase, u } = at(seconds);
        const a: IKey = keys[phase.from]!;
        const b: IKey = keys[phase.to]!;
        const root: IAutoMovieVector3 = Vector3.lerp(a.root, b.root, u);
        const placed: IHumanPosture = { ...posture, root, yaw };
        const limbs: IHumanPosture["limbs"] = { ...posture.limbs };
        const joints: IHumanPosture["joints"] = { ...posture.joints };
        for (const side of ["left", "right"] as const) {
          const foot = footAt(side, a.feet[side], b.feet[side], u);
          limbs[`${side}Leg`] = AutoMovieMotionHumanLeg.goal(
            body,
            placed,
            side,
            foot.placement,
            foot.planted,
          );
          joints[`${side}Toes`] = [foot.toes, 0, 0];
        }
        return resolveHumanPosture.lower(body, { ...placed, joints, limbs });
      },
    };

    // The hands come onto the thighs while the hips lower and leave them as
    // the body starts to rise.
    const firstUp: IPhase | undefined =
      phases[phases.findIndex((p: IPhase) => p.name === "settled") + 1];
    const lowered = (seconds: number): number =>
      clock.progress("lowering", phases[2]!.name, seconds) *
      (firstUp === undefined
        ? 1
        : 1 - clock.progress(firstUp.name, "end", seconds));
    const hand = (side: "left" | "right"): IAutoMovieMotionHumanPrimitive =>
      crouch.brace(
        body,
        side,
        AutoMovieMotionHumanArm.angles(context.entry.pose, side),
        duration,
        lowered,
      );

    // Plant windows from the phases' feet.
    const contacts: IHumanContactWindow[] = [];
    for (const side of ["left", "right"] as const) {
      let open: number | undefined;
      for (const phase of phases) {
        const a = keys[phase.from]!.feet[side];
        const b = keys[phase.to]!.feet[side];
        const still: boolean =
          Vector3.length(Vector3.subtract(a.at, b.at)) <= 1e-4 &&
          a.planted &&
          b.planted;
        const t: number = clock.at(phase.name) / duration;
        if (still && open === undefined) open = t;
        if (!still && open !== undefined) {
          contacts.push(plant(side, open, t));
          open = undefined;
        }
      }
      if (open !== undefined) contacts.push(plant(side, open, 1));
    }

    const base: IHumanActionPlan = stand.plan({
      ...context,
      params: { seconds: duration },
    });
    return composeAutoMovieMotionHumanAction({
      base: { ...base, contacts },
      clock,
      contact: marks[0]!,
      primitives: [kneelBody, hand("left"), hand("right")],
    });
  }

  /** A foot's place on the floor: its toes' joint, heading and pitch. */
  interface IFoot {
    at: IAutoMovieVector3;
    heading: number;
    pitch: number;
  }

  /** A key state: the root and both feet. */
  interface IKey {
    root: IAutoMovieVector3;
    feet: Record<"left" | "right", IFoot & { planted: boolean }>;
  }

  /** A phase between two key states. */
  interface IPhase {
    name: string;
    seconds: number;
    from: number;
    to: number;
  }

  /** A ground plant window. */
  const plant = (
    side: "left" | "right",
    from: number,
    to: number,
  ): IHumanContactWindow => ({
    part: side === "left" ? "leftFoot" : "rightFoot",
    kind: "plant",
    from,
    to,
    support: { kind: "ground" },
  });
}
