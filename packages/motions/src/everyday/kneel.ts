import { Vector3, minimumJerk } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import type { HumanActionName } from "../HumanActionName";
import { stand } from "../actions/stand";
import type { IHumanBody } from "../body/IHumanBody";
import { AutoMovieMotionClock } from "../compose/AutoMovieMotionClock";
import { AutoMovieMotionHumanArm } from "../compose/AutoMovieMotionHumanArm";
import { AutoMovieMotionHumanCourse } from "../compose/AutoMovieMotionHumanCourse";
import { AutoMovieMotionHumanLean } from "../compose/AutoMovieMotionHumanLean";
import { AutoMovieMotionHumanLeg } from "../compose/AutoMovieMotionHumanLeg";
import { AutoMovieMotionManner } from "../compose/AutoMovieMotionManner";
import type { IAutoMovieMotionHumanPrimitive } from "../compose/IAutoMovieMotionHumanPrimitive";
import { composeAutoMovieMotionHumanAction } from "../compose/composeAutoMovieMotionHumanAction";
import { HumanBound } from "../law/HumanBound";
import type { HumanUnit } from "../law/HumanUnit";
import type { IHumanActionContext } from "../law/IHumanActionContext";
import type { IHumanActionLaw } from "../law/IHumanActionLaw";
import type { IHumanActionPlan } from "../law/IHumanActionPlan";
import type { IHumanContactWindow } from "../law/IHumanContactWindow";
import { HumanFoot } from "../posture/HumanFoot";
import type { IHumanPosture } from "../posture/IHumanPosture";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import { HumanBalance } from "./HumanBalance";
import { crouch } from "./crouch";
import { kneelKeys } from "./kneelKeys";

/**
 * Kneeling from standing: on one knee (half kneel), on both knees upright,
 * or sitting back on the heels, held, then rising the way it went down.
 *
 * The goals are floor points, solved by {@link kneelKeys}. The kneeling leg
 * steps back onto its tucked toes while the hips run a course along the
 * heading that keeps the extrapolated centre of mass between the feet
 * ({@link AutoMovieMotionHumanCourse}; Hof, Gazendam and Sinke 2005): it goes
 * from where it stands to the middle between the two feet as the foot
 * travels, so the hips trail the foot and arrive after it lands. Through the
 * step the hips ride as high as the less extended leg reaches its foot, the
 * reach going from the standing leg's to `REACH` of its length, a reverse
 * lunge, and the pelvis tips forward by what keeps the leg behind inside the
 * hip's extension range (`kneelKeys.lean`). Then the hips lower until the knee touches the floor straight under
 * its hip joint with the thigh upright, the shin lying back along the floor
 * to the foot. For both knees the front leg then swings back and its knee
 * lands beside the first, and for sitting back the hips turn about the knees
 * toward the heels until the knees flex `kneelKeys.SIT` degrees. Pollard,
 * Porter and Redfern (2011, J Appl Biomech 27:233) give the four kneeling
 * postures. The hands rest on the thighs as the body settles.
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
    stand: [
      { window: ["settled", 1], kind: "inertialize", entry: 0, blend: 0.3 },
    ],
    crouch: [
      { window: ["settled", 1], kind: "inertialize", entry: 0, blend: 0.3 },
    ],
    pickUp: [
      { window: ["settled", 1], kind: "inertialize", entry: 0, blend: 0.3 },
    ],
    putDown: [
      { window: ["settled", 1], kind: "inertialize", entry: 0, blend: 0.3 },
    ],
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
    hold?: number & import("typia").tags.Minimum<0> & HumanUnit<"s">;

    /** Whether the body rises again at the end; `true` when absent. */
    rise?: boolean;

    /** How it is performed. */
    manner?: AutoMovieMotionManner.IManner;
  }

  /** How far of its full length the stepping leg extends to reach its foot behind (provisional). */
  export const REACH: number = 0.98;

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
   * @throws {HumanRefusal} When the hold is negative.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the plan and its refusal; the namespace gives the law.
   * @evidence contracts/development/implementation.md#principled-implementation Key states joined by minimum-jerk phases; on its feet the hips follow the balance course and the legs' reach, sitting back they turn about the knees; a foot whose toes' joint does not move pivots on it, one that moves swings on an arc.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Key states, a phase list, one body row and two hand rows.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The constants are named and provisional; the root is lowered only where a planted leg cannot reach.
   * @evidence contracts/development/implementation.md#efficient-algorithms One key solve and a balance course down and up per plan, about a hundred posture solves each; each posture costs one lowering and two arm solves.
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
    const hold: number = context.params.hold ?? 1.5;
    const rise: boolean = context.params.rise ?? true;
    HumanBound.least("hold", hold, 0, "s");
    const modifiers: AutoMovieMotionManner.IModifiers =
      AutoMovieMotionManner.of(context, context.params.manner);
    const probe: IHumanActionPlan = stand.plan({
      ...context,
      params: { seconds: 1 },
    });
    const standing: IHumanPosture = probe.posture(0);
    const yaw: number = standing.yaw;
    const solved: kneelKeys.IKeys = kneelKeys.solve(body, standing, kind, k);
    const keys: kneelKeys.IKey[] = solved.keys;
    const length: number = m.thigh + m.shank;
    const kneeling: number = Vector3.dot(
      Vector3.subtract(keys[2]!.root, standing.root),
      solved.forward,
    );

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
      a: kneelKeys.IFoot,
      b: kneelKeys.IFoot,
      u: number,
    ): { placement: HumanFoot.IPlacement; planted: boolean; toes: number } => {
      const moves: boolean =
        Vector3.length(Vector3.subtract(a.at, b.at)) > 1e-4;
      const placed = (foot: kneelKeys.IFoot): HumanFoot.IPlacement =>
        HumanFoot.pivot(body, side, "mtp", foot.at, foot.heading, foot.pitch);
      const toes: number = a.toes + (b.toes - a.toes) * u;
      if (!moves)
        return {
          placement: placed({ ...a, pitch: a.pitch + (b.pitch - a.pitch) * u }),
          planted: true,
          toes,
        };
      return {
        placement: AutoMovieMotionHumanLeg.arc(
          placed(a),
          placed(b),
          CLEARANCE * m.shank,
          u,
        ),
        planted: u <= 0 || u >= 1,
        toes,
      };
    };

    // The body at a second. While it stands on its feet (the step and the
    // lowering, and their way back) the hips run a course along the heading
    // and ride as high as the less extended leg reaches its foot, down to the
    // kneeling height as the knee comes to the floor. `along` asks the hips'
    // place for the course's solve.
    const courses: ((seconds: number) => number)[] = [];
    const heights: { landed?: number } = {};
    const write = (
      posture: IHumanPosture,
      seconds: number,
      along?: number,
    ): IHumanPosture => {
      const { phase, u } = at(seconds);
      const a: kneelKeys.IKey = keys[phase.from]!;
      const b: kneelKeys.IKey = keys[phase.to]!;
      const feet = {
        left: footAt("left", a.feet.left, b.feet.left, u),
        right: footAt("right", a.feet.right, b.feet.right, u),
      };
      const pair: number = phase.from + phase.to;
      let root: IAutoMovieVector3;
      let pitch: number = 0;
      if (phase.from !== phase.to && pair <= 3) {
        const step: number = pair === 3 ? 1 : phase.from === 0 ? u : 1 - u;
        const low: number = pair === 1 ? 0 : phase.from === 1 ? u : 1 - u;
        const course: number = (
          courses[phase.from < phase.to ? 0 : 1] ?? ((): number => 0)
        )(seconds);
        const s: number =
          along ??
          (pair === 3
            ? course + (kneeling - course) * low ** 4
            : phase.from === 1
              ? course * (1 - u ** 4)
              : course);
        const flat: IAutoMovieVector3 = Vector3.add(
          standing.root,
          Vector3.scale(solved.forward, s),
        );
        const reach: number =
          (solved.extension + (REACH - solved.extension) * step) * length;
        const high: number = Math.min(
          ...(["left", "right"] as const).map((side): number => {
            const ankle: IAutoMovieVector3 = feet[side].placement.ankle;
            const hip: IAutoMovieVector3 = Vector3.add(flat, solved.rest[side]);
            const d: number = Math.hypot(ankle.x - hip.x, ankle.z - hip.z);
            return (
              ankle.y +
              Math.sqrt(Math.max(0, reach * reach - d * d)) -
              solved.rest[side].y
            );
          }),
        );
        // Once the foot has landed the hips never ride above the straight
        // way between the neighbouring states' heights.
        const landed: number | undefined = heights.landed;
        const cap: number =
          landed === undefined || (pair === 1 && phase.from === 0)
            ? Infinity
            : pair === 3
              ? landed + (keys[2]!.root.y - landed) * low
              : landed + (standing.root.y - landed) * u;
        root = { ...flat, y: Math.min(high, cap) };
        pitch = kneelKeys.lean(
          body,
          {
            left: Vector3.add(root, solved.rest.left),
            right: Vector3.add(root, solved.rest.right),
          },
          {
            left: feet.left.placement.ankle,
            right: feet.right.placement.ankle,
          },
          solved.forward,
        );
      } else if (kind === "sitBack" && Math.max(phase.from, phase.to) === 4) {
        root = kneelKeys.turn(solved.pivot, a.root, b.root, u);
      } else root = Vector3.lerp(a.root, b.root, u);
      const placed: IHumanPosture = AutoMovieMotionHumanLean.tip(
        body,
        { ...posture, root, yaw },
        pitch,
        0,
      );
      const limbs: IHumanPosture["limbs"] = { ...posture.limbs };
      const joints: IHumanPosture["joints"] = { ...posture.joints };
      for (const side of ["left", "right"] as const) {
        limbs[`${side}Leg`] = AutoMovieMotionHumanLeg.goal(
          body,
          placed,
          side,
          feet[side].placement,
          feet[side].planted,
        );
        joints[`${side}Toes`] = [feet[side].toes, 0, 0];
      }
      return resolveHumanPosture.lower(body, { ...placed, joints, limbs });
    };

    // The courses: going down, the extrapolated centre of mass goes from
    // where it stands to the middle between the feet as the foot travels;
    // coming up it is back over the standing foot while the knee leaves the
    // floor, before the foot behind lifts. The landing height is read from
    // the step's own course first.
    const centre = (posture: IHumanPosture): number =>
      Vector3.dot(HumanBalance.support(body, posture).centre, solved.forward);
    const stood: number = centre(standing);
    const middle: number =
      (["left", "right"] as const)
        .map((side): number => {
          const foot: kneelKeys.IFoot = keys[1]!.feet[side];
          return Vector3.dot(
            HumanFoot.point(
              body,
              side,
              "sole",
              HumanFoot.pivot(
                body,
                side,
                "mtp",
                foot.at,
                foot.heading,
                foot.pitch,
              ),
              foot.toes,
            ),
            solved.forward,
          );
        })
        .reduce((x: number, y: number): number => x + y, 0) / 2;
    const course = (from: number, to: number, start: number) =>
      AutoMovieMotionHumanCourse.solve({
        body,
        yaw,
        posture: (seconds: number, along: number): IHumanPosture =>
          write(standing, seconds, along),
        target: (seconds: number): number => {
          const { phase, u } = at(seconds);
          const share: number =
            phase.from < phase.to
              ? phase.from === 0
                ? u
                : 1
              : phase.from === 2
                ? 1 - u
                : 0;
          return stood + (middle - stood) * share;
        },
        from,
        to,
        start,
      });
    const landing: number = clock.at(phases[1]!.name);
    heights.landed = write(
      standing,
      landing,
      course(0, landing, 0)(landing),
    ).root.y;
    courses[0] = course(0, clock.at(phases[2]!.name), 0);
    const off: IPhase | undefined = phases.find(
      (p: IPhase) => p.from === 2 && p.to === 1,
    );
    if (off !== undefined)
      courses[1] = course(clock.at(off.name), duration, kneeling);

    const kneelBody: IAutoMovieMotionHumanPrimitive = {
      channels: ["root", "trunk", "leftLeg", "rightLeg"],
      from: 0,
      to: duration,
      write: (posture: IHumanPosture, seconds: number): IHumanPosture =>
        write(posture, seconds),
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
        const still: boolean =
          Vector3.length(
            Vector3.subtract(
              keys[phase.from]!.feet[side].at,
              keys[phase.to]!.feet[side].at,
            ),
          ) <= 1e-4;
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
