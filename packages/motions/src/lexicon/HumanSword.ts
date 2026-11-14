import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieMotionTarget,
  IAutoMovieAffordance,
  IAutoMovieVector3,
} from "@automovie/interface";
import type { tags } from "typia";

import { AutoMovieMotionClock } from "../compose/AutoMovieMotionClock";
import { HumanBound } from "../law/HumanBound";
import type { IHumanActionContext } from "../law/IHumanActionContext";
import type { IHumanActionLaw } from "../law/IHumanActionLaw";
import type { IHumanActionPlan } from "../law/IHumanActionPlan";
import { HumanFrame } from "../posture/HumanFrame";
import { HumanHand } from "../posture/HumanHand";
import type { IHumanPosture } from "../posture/IHumanPosture";
import { HumanSkill } from "../skill/HumanSkill";
import { StrikingAdvance } from "../striking/StrikingAdvance";
import { StrikingBlade } from "../striking/StrikingBlade";
import { StrikingHeld } from "../striking/StrikingHeld";
import { StrikingRoll } from "../striking/StrikingRoll";
import { StrikingSkill } from "../striking/StrikingSkill";
import { StrikingTarget } from "../striking/StrikingTarget";
import { HumanSwordLanding } from "./HumanSwordLanding";

/**
 * Blade work with the blade as the effector: the cut on the eight lines,
 * and what every blade action shares. `HumanSwordThrust` holds the thrust,
 * `HumanSwordGuard` the guards and `HumanSwordParry` the parry.
 *
 * The blade is a prop the hand already holds (`HumanObject.prop` of a sword,
 * then `pickUp` by its grip); the law reads its point and edge from the
 * prop's `point` and `edge` affordances as the hand holds them and aims
 * those. With no blade named the hand itself is aimed, and with no target a
 * place at the blade's reach ahead stands in, so every action also plays as a
 * solo drill.
 *
 * Cuts are named by the side they come from (Meyer's cutting diagram, 1570:
 * descending, rising, horizontal and vertical lines; #3202, decision 8).
 * `HumanBlade` names rows of these in a tradition's words.
 *
 * A cut or a thrust that a parry is to meet is declared `parried`: it stops
 * short of its target at its decisive instant, where the parry's blade meets
 * it. The outcome is the author's, never the geometry's.
 *
 * First pass: the target is read once, at the start; a body does not stop
 * the blade; binds, winds and redirection are not planned; every pose
 * constant is provisional, from the treatises' figures.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the effector, how the blade is given, the vocabulary with its source, how a parried attack is declared and what the first pass leaves out.
 * @evidence contracts/development/design.md#principled-representation One law record over the stroke planner; the lines a cut comes from are a closed union with a table of directions.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The cut, the attack's parameters, aim and clock the thrust shares, the tables and constants, and the setup and cancel table every blade law shares.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No sword kind is named; lengths are shares of the arm and the blade's own length.
 */
export namespace HumanSword {
  /** What every blade action takes. */
  export interface IWield {
    /** The held blade's prop subject id; the bare hand when absent. */
    blade?: string;

    /** The hand that holds it; `right` when absent. */
    hand?: HumanHand.Side;

    /** How many hands are on the grip; 2 for a blade whose grip declares a two-hand grasp, else 1. */
    hands?: 1 | 2;

    /** The affordance ids of the held thing's working point and of its edge, for an implement that is no blade (a bat's `barrel`, a racket's `face`, a club's `head`); `point` and `edge` when absent. */
    tip?: string;

    /** See `tip`. */
    edge?: string;
  }

  /** Where a cut comes from, as the performer sees it: `forehand` is the blade hand's side. */
  export type Line =
    | "above"
    | "aboveForehand"
    | "forehand"
    | "belowForehand"
    | "below"
    | "belowBackhand"
    | "backhand"
    | "aboveBackhand";

  /** A direction or a place by its parts: away from the midline on the blade hand's side, up, and forward. */
  export interface IParts {
    /** Toward the blade hand's side. */
    out: number;

    /** Up. */
    up: number;

    /** Forward. */
    forward: number;
  }

  /** Where each cut comes from, across the line to the target: `out` and `up` parts of a unit direction. */
  export const LINES: Readonly<Record<Line, readonly [number, number]>> = {
    above: [0, 1],
    aboveForehand: [Math.SQRT1_2, Math.SQRT1_2],
    forehand: [1, 0],
    belowForehand: [Math.SQRT1_2, -Math.SQRT1_2],
    below: [0, -1],
    belowBackhand: [-Math.SQRT1_2, -Math.SQRT1_2],
    backhand: [-1, 0],
    aboveBackhand: [-Math.SQRT1_2, Math.SQRT1_2],
  };

  /** The blade's turn from its chamber to the cut's contact, degrees (provisional). */
  export const SWING: number = 110;

  /** The share of the blade's length from the hand at which a cut lands and a parry receives (provisional: the centre of percussion and the strong are not measured on the archetypes). */
  export const LANDS: Readonly<Record<"cut" | "parry", number>> = {
    cut: 0.7,
    parry: 0.3,
  };

  /** How far a thrusting blade's line may leave the line from the shoulder to the target, degrees, so the hand that holds it as it took it can drive it (provisional). */
  export const CONE: number = 40;

  /** The share of the arm's length a target may lie from the shoulder, less the blade, before an advance is taken (provisional). */
  export const REACH: number = 0.9;

  /** The share of its path a parried attack is stopped at (provisional). */
  export const STOPPED: number = 0.85;

  /** The gap between two blades' centre lines where they meet, metres: two half thicknesses of the archetypes' 5 mm blades. */
  export const GAP: number = 0.005;

  /**
   * The sword point's peak speed in an attack, metres a second, novice and
   * elite: 2.6 and 3.2 in the lunge (Chen et al. 2017, PLoS ONE, a scoping
   * review of fencing biomechanics, as #3202 records it). A cut's edge speed
   * is provisional: 6 and 10, under the 9.89 m/s 95th percentile of a knife
   * slash (Bleetman, Watson and Horsfall 2003, as #3348 records it).
   */
  export const SPEED: Readonly<
    Record<"thrust" | "cut", readonly [number, number]>
  > = { thrust: [2.6, 3.2], cut: [6, 10] };

  /** Parameters of a cut or a thrust. */
  export interface IAttack extends IWield {
    /** What it is aimed at; a place at the blade's reach ahead when absent. */
    target?: AutoMovieMotionTarget;

    /** How the body goes with it; when absent, the least of none, a step and a lunge that brings the target inside the arm. */
    advance?: StrikingBlade.Advance;

    /** Whether it lands or is stopped short for a parry to meet; `lands` when absent. */
    outcome?: "lands" | "parried";

    /** A feint: the share of the stroke shown before it is withdrawn, in (0, 1); it then neither lands nor is parried. */
    feint?: number & tags.ExclusiveMinimum<0> & tags.ExclusiveMaximum<1>;
  }

  /** Parameters of a cut. */
  export interface ICut extends IAttack {
    /** Where the cut comes from; `above` when absent. */
    from?: Line;
  }

  /** The performer's axes and the held blade, read once per plan. */
  export interface ISetup {
    /** The held blade in the hand's frame. */
    tool: StrikingHeld.ITool;

    /** Where the other hand holds the grip, or null for one hand. */
    support: StrikingBlade.ISupport | null;

    /** The upper arm and the forearm together, metres. */
    arm: number;

    /** The blade hand's shoulder joint at the entry, world metres. */
    shoulder: IAutoMovieVector3;

    /** A direction by its parts as a world vector, about a heading in degrees; the entry's heading when absent. */
    world: (parts: IParts, yaw?: number) => IAutoMovieVector3;

    /** A quantity between its novice and elite values at the performer's speed skill. */
    skill: (pair: readonly [number, number]) => number;
  }

  /**
   * Read the held blade and the performer's axes at an action's entry.
   *
   * @param context The action's context.
   * @returns The setup.
   */
  export const setup = (context: IHumanActionContext<IWield>): ISetup => {
    const p: IWield = context.params;
    const side: HumanHand.Side = p.hand ?? "right";
    const tool: StrikingHeld.ITool = StrikingHeld.of(
      context,
      side,
      p.blade,
      p.tip === undefined
        ? undefined
        : { tip: p.tip, ...(p.edge === undefined ? {} : { edge: p.edge }) },
    );
    const twoHanded: boolean =
      p.blade !== undefined &&
      (context.prop(p.blade).prop.affordances ?? []).some(
        (a: IAutoMovieAffordance): boolean =>
          a.kind === "handle" && a.grip === "two-hand",
      );
    const sign: number = side === "left" ? 1 : -1;
    return {
      tool,
      support:
        (p.hands ?? (twoHanded ? 2 : 1)) === 2
          ? {
              offset: { x: -0.6 * context.body.measure.hand, y: 0, z: 0 },
              handle: "axis",
            }
          : null,
      arm: context.body.measure.upperArm + context.body.measure.forearm,
      shoulder: StrikingBlade.shoulder(context, side, "none", {
        x: 0,
        y: 0,
        z: 1,
      }),
      world: (
        parts: IParts,
        yaw: number = context.entry.posture.yaw,
      ): IAutoMovieVector3 =>
        HumanFrame.point(
          { origin: { x: 0, y: 0, z: 0 }, yaw },
          { x: sign * parts.out, y: parts.up, z: parts.forward },
        ),
      skill: (pair: readonly [number, number]): number =>
        HumanSkill.quantity(context.skill, "speed", pair[0], pair[1]),
    };
  };

  /** The cancel table of a blade action: anything may follow from the named instant on, the grip kept. */
  export const follows = (instant: string): IHumanActionLaw["interrupts"] => ({
    any: [
      {
        window: [instant, 1],
        kind: "inertialize",
        entry: 0,
        blend: 0.15,
        keep: ["grip"],
      },
    ],
  });

  /** What an attack's target and advance give its geometry. */
  export interface IAim {
    /** The point aimed at, world metres. */
    target: IAutoMovieVector3;

    /** The horizontal unit line from the root to the target. */
    line: IAutoMovieVector3;

    /** That line's heading, degrees. */
    yaw: number;

    /** The advance taken. */
    advance: StrikingBlade.Advance;

    /** The blade hand's shoulder at the decisive instant, world metres. */
    reach: IAutoMovieVector3;

    /** The body as the advance leaves it at the decisive instant. */
    posture: IHumanPosture;
  }

  /** Read an attack's target, line and advance: the target named or a place at the blade's reach, and with no advance named the least that reaches. */
  export const aim = (
    context: IHumanActionContext<IAttack>,
    s: ISetup,
    place: IParts,
    span: number,
  ): IAim => {
    const p: IAttack = context.params;
    const root: IAutoMovieVector3 = context.entry.posture.root;
    const given: IAutoMovieVector3 | undefined =
      p.target === undefined
        ? undefined
        : context.aim(p.target, context.start).point;
    const line: IAutoMovieVector3 = StrikingTarget.line(
      root,
      given ?? Vector3.add(root, s.world({ out: 0, up: 0, forward: 1 })),
      context.entry.posture.yaw,
    );
    const yaw: number = StrikingTarget.heading(line);

    // With no advance named, the least one that reaches: none, step, lunge.
    const within = (candidate: StrikingBlade.Advance): boolean =>
      given === undefined ||
      Vector3.length(
        Vector3.subtract(
          given,
          StrikingBlade.shoulder(context, s.tool.side, candidate, line),
        ),
      ) -
        span <=
        REACH * s.arm;
    const advance: StrikingBlade.Advance =
      p.advance ?? (["none", "step"] as const).find(within) ?? "lunge";
    const reach: IAutoMovieVector3 = StrikingBlade.shoulder(
      context,
      s.tool.side,
      advance,
      line,
    );
    return {
      target:
        given ??
        Vector3.add(
          reach,
          s.world(
            {
              out: place.out * s.arm,
              up: place.up * s.arm,
              forward: place.forward * s.arm + s.tool.length,
            },
            yaw,
          ),
        ),
      line,
      yaw,
      advance,
      reach,
      posture:
        advance === "none"
          ? context.entry.posture
          : StrikingAdvance.stood(
              context,
              s.tool.side,
              line,
              StrikingAdvance.travel(context, advance),
              null,
            ),
    };
  };

  /** The clock of an attack: its attack lasts as a minimum-jerk unit of the path's length at the peak speed. `carried` is the part of that length an advancing body covers: the body arrives at rest (a whole unit) while an arrested point arrives at its peak (half a unit), so the two speeds peak apart and the attack is timed on the greatest of their sum. */
  export const timed = (
    context: IHumanActionContext<IAttack>,
    length: number,
    speed: number,
    follow: number,
    carried: number = 0,
  ): AutoMovieMotionClock.IClock => {
    const rate = (u: number): number => 30 * u * u * (1 - u) * (1 - u);
    let peak: number = 1.875 * length;
    for (let i: number = 1; carried > 0 && i <= 50; i++)
      peak = Math.max(
        peak,
        (length - carried) * rate(i / 100) + carried * rate(i / 50),
      );
    const attack: number = HumanSkill.jitter(
      context.skill,
      context.random("attack"),
      Math.max(0.12, peak / speed),
    );
    const recovery: number = StrikingSkill.recovery(context.skill);
    return AutoMovieMotionClock.phrase({
      prepare: 0.3 * recovery,
      attack,
      follow: follow * attack,
      hold: 0.08,
      retract: 0.4 * recovery,
    });
  };

  /** The share of its path an attack runs: all of it, a feint's shown share, or a parried attack's stop. */
  export const stopped = (params: IAttack): number => {
    if (params.feint !== undefined)
      return HumanBound.within("feint", params.feint, 0, 1, "", "both");
    return params.outcome === "parried" ? STOPPED : 1;
  };

  /** What an author can change when a target is out of reach. */
  export const FIX: string =
    "name an advance (a step or a lunge), stand closer, or aim at a nearer target";

  /**
   * Cut along one of the eight lines: the blade's landing part passes through the target at the decisive instant (`stroke`), edge leading. A target beyond the arm with the chosen advance is refused on `target`.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the decisive instant, what lands and the refusal.
   * @evidence contracts/development/implementation.md#principled-implementation The contact pose puts the landing part (`LANDS.cut` of the blade from the hand) on the target with the edge along the travel, the blade's lean back and its turn about the travel chosen by the arm's fit (`HumanSwordLanding`); the stroke is that pose turned back by `SWING` about the axis square to blade and travel, the hilt going from a chamber by the shoulder to the contact on one progress, so the edge leads through the whole arc.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The aim, the contact pose, the chamber and the path, then the shared stroke planner.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts `SWING`, the leans and turns of the blade at contact and the chamber's place are provisional values named in code and documentation; an unreachable target is refused, never shortened.
   * @evidence contracts/development/implementation.md#efficient-algorithms The landing's fits (`HumanSwordLanding`), ending at the first the arm holds exactly; each posture costs the stroke planner's two elbow searches.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Planned once per instance; nothing is shared between instances.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The plan closes over its constants and the entry state, released with the plan.
   */
  export const cut: IHumanActionLaw<ICut> = {
    name: "swordCut",
    interrupts: follows("strokeEnd"),
    plan: (context: IHumanActionContext<ICut>): IHumanActionPlan => {
      const s: ISetup = setup(context);
      const a: IAim = aim(
        context,
        s,
        { out: 0, up: -0.1, forward: 0.6 },
        LANDS.cut * s.tool.length,
      );
      const [out, up]: readonly [number, number] =
        LINES[context.params.from ?? "above"];
      const origin: IAutoMovieVector3 = s.world({ out, up, forward: 0 }, a.yaw);
      const travel: IAutoMovieVector3 = Vector3.scale(origin, -1);
      const back: number = (1 - LANDS.cut) * s.tool.length;

      // The contact pose: the landing part on the target, the edge leading
      // along the travel, the blade's lean and turn as the arm holds them.
      const landed: StrikingHeld.IHandFrame = HumanSwordLanding.frame(context, {
        tool: s.tool,
        back,
        target: a.target,
        reach: a.reach,
        travel,
        posture: a.posture,
      });
      if (context.params.target !== undefined)
        StrikingRoll.reachable(context, s.tool, landed, back, a.posture, FIX);
      const axis: IAutoMovieVector3 = Quaternion.rotateVector(
        landed.rotation,
        s.tool.axis,
      );
      const about: IAutoMovieVector3 = Vector3.normalize(
        Vector3.cross(axis, travel),
      );
      const chamber: IAutoMovieVector3 = Vector3.add(
        s.shoulder,
        Vector3.scale(
          Vector3.add(Vector3.scale(origin, 0.35), Vector3.scale(a.line, 0.25)),
          s.arm,
        ),
      );
      const path = (progress: number): StrikingHeld.IHandFrame => ({
        rotation: Quaternion.multiply(
          Quaternion.fromAxisAngle(about, -SWING * (1 - progress)),
          landed.rotation,
        ),
        point:
          progress <= 1
            ? Vector3.lerp(chamber, landed.point, progress)
            : Vector3.add(
                landed.point,
                Vector3.scale(travel, (progress - 1) * 0.3 * s.arm),
              ),
      });
      return StrikingBlade.plan(context, {
        tool: s.tool,
        clock: timed(
          context,
          ((SWING * Math.PI) / 180) * (s.tool.length - back) +
            Vector3.length(Vector3.subtract(landed.point, chamber)),
          s.skill(SPEED.cut),
          0.6,
        ),
        path,
        back,
        support: s.support,
        advance: a.advance,
        line: a.line,
        stay: false,
        stop: stopped(context.params),
      });
    },
  };
}
