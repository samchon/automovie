import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieAffordance,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanStrikingAdvance,
  IAutoMovieMotionHumanStrikingHeld,
  IAutoMovieMotionHumanSword,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanBound } from "../../law/internal/HumanBound";
import { HumanFrame } from "../../posture/internal/HumanFrame";
import { HumanHand } from "../../posture/internal/HumanHand";
import { poseBones } from "../../posture/internal/poseBones";
import { HumanSkill } from "../../skill/internal/HumanSkill";
import { StrikingAdvance } from "../../striking/internal/StrikingAdvance";
import { StrikingBlade } from "../../striking/internal/StrikingBlade";
import { StrikingHeld } from "../../striking/internal/StrikingHeld";
import { StrikingQuality } from "../../striking/internal/StrikingQuality";
import { StrikingTarget } from "../../striking/internal/StrikingTarget";
import { HumanSwordCutAt } from "./HumanSwordCutAt";
import { HumanSwordTiming } from "./HumanSwordTiming";

/*
 * Blade work with the blade as the effector: the cut on the eight lines, and
 * what every blade action shares. `HumanSwordThrust` holds the thrust,
 * `HumanSwordGuard` the guards and `HumanSwordParry` the parry.
 *
 * The blade is a prop the hand already holds (`AutoMovieMotionHumanObject.prop` of a sword,
 * then `pickUp` by its grip); the law reads its point and edge from the prop's
 * `point` and `edge` affordances as the hand holds them and aims those. With no
 * blade named the hand itself is aimed, and with no target a place at the
 * blade's reach ahead stands in, so every action also plays as a solo drill.
 *
 * Cuts are named by the side they come from (Meyer's cutting diagram, 1570:
 * descending, rising, horizontal and vertical lines; decision 8). `HumanBlade`
 * names rows of these in a tradition's words.
 *
 * A cut or a thrust that a parry is to meet is declared `parried`: it stops
 * short of its target at its decisive instant, where the parry's blade meets
 * it. The outcome is the author's, never the geometry's.
 *
 * First pass: the target is read once, at the start; a body does not stop the
 * blade; binds, winds and redirection are not planned; the chambers and the
 * stand-in target are the body's own measures, and `SWING`, `CONE`, `REACH` and
 * the cut's speed are provisional.
 */
export namespace HumanSword {
  /*
   * Where each cut comes from, across the line to the target: `out` and `up`
   * parts of a unit direction.
   */
  export const LINES: Readonly<
    Record<IAutoMovieMotionHumanSword.Line, readonly [number, number]>
  > = {
    above: [0, 1],
    aboveForehand: [Math.SQRT1_2, Math.SQRT1_2],
    forehand: [1, 0],
    belowForehand: [Math.SQRT1_2, -Math.SQRT1_2],
    below: [0, -1],
    belowBackhand: [-Math.SQRT1_2, -Math.SQRT1_2],
    backhand: [-1, 0],
    aboveBackhand: [-Math.SQRT1_2, Math.SQRT1_2],
  };

  /*
   * The blade's turn from its chamber to the cut's contact, degrees
   * (provisional).
   */
  export const SWING: number = 110;

  /*
   * The middles of a blade's three parts, shares of its length from one end:
   * the fencing masters' division of the blade into the forte by the hilt, the
   * middle and the foible by the point (Angelo 1763, The School of Fencing),
   * the forte parrying and the foible being parried.
   */
  export const THIRDS: readonly [number, number, number] = [
    1 / 6,
    1 / 2,
    5 / 6,
  ];

  /*
   * Where a cut lands, as a share of the held thing's edge from its end by the
   * hand (`StrikingHeld.ITool.span`): the centre of percussion of a uniform bar
   * swung about that end, two thirds of it, where the blow leaves no shock in
   * the hand (`I / (m d)` with `I = m L^2 / 3` and `d = L / 2`); and where a
   * parry first receives, as a share of the blade's length from the hand: the
   * forte's middle (`THIRDS`). A thing that declares no edge lands a cut with
   * its working point.
   */
  export const LANDS: Readonly<Record<LANDSEntryItem, number>> = {
    cut: 2 / 3,
    parry: THIRDS[0],
  };

  /*
   * How far a thrusting blade's line may leave the line from the shoulder to
   * the target, degrees, so the hand that holds it as it took it can drive it
   * (provisional).
   */
  export const CONE: number = 40;

  /*
   * The share of the arm's length a target may lie from the shoulder, less the
   * blade, before an advance is taken (provisional).
   */
  export const REACH: number = 0.9;

  /*
   * The gap between two blades' centre lines where they meet, metres: two half
   * thicknesses of the archetypes' 5 mm blades.
   */
  export const GAP: number = 0.005;

  /*
   * The sword point's peak speed in an attack, metres a second, novice and
   * elite: 2.6 and 3.2 in the lunge (Chen et al. 2017, PLoS ONE, a scoping
   * review of fencing biomechanics, as the research records it). A cut's edge
   * speed is provisional: 6 and 10, under the 9.89 m/s 95th percentile of a
   * knife slash (Bleetman, Watson and Horsfall 2003, as the research records
   * it). A row whose implement has a measured speed of its own cuts at that
   * instead (`cutAt`).
   */
  export const SPEED: Readonly<
    Record<SPEEDEntryItem, readonly [number, number]>
  > = { thrust: [2.6, 3.2], cut: [6, 10] };

  /*
   * Read the held blade and the performer's axes at an action's entry.
   * Parameter context: The action's context.
   * Returns: The setup.
   */
  export const setup = (
    context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanSword.IWield>,
  ): IAutoMovieMotionHumanSword.ISetup => {
    const p: IAutoMovieMotionHumanSword.IWield = context.params;
    const side: AutoMovieHumanSide = p.hand ?? "right";
    const tool: IAutoMovieMotionHumanStrikingHeld.ITool = StrikingHeld(
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
              // The two hands side by side on the grip, one hand's breadth
              // apart (`StrikingQuality.fist`).
              offset: {
                x: -2 * StrikingQuality.fist(context.body.measure.hand),
                y: 0,
                z: 0,
              },
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
        parts: IAutoMovieMotionHumanSword.IParts,
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

  /*
   * Read an attack's target, line and advance: the target named, or with none a
   * stand-in opponent of the performer's own measure whose sternum lies
   * straight ahead at the arm's `REACH` and the landing part's span from the
   * shoulder, the centre of the fencing target; and with no advance named the
   * least that reaches.
   */
  export const aim = (
    context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanSword.IAttack>,
    s: IAutoMovieMotionHumanSword.ISetup,
    span: number,
  ): IAutoMovieMotionHumanSword.IAim => {
    const p: IAutoMovieMotionHumanSword.IAttack = context.params;
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

    // The arm reaches a target `span` nearer than the held thing's landing
    // part: the target lies within reach where it is no farther from the
    // shoulder than `REACH` of the arm and that span together.
    const within = (
      candidate: IAutoMovieMotionHumanStrikingAdvance.Advance,
      travel: number = StrikingAdvance.travel(context, candidate),
    ): boolean =>
      given === undefined ||
      Vector3.length(
        Vector3.subtract(
          given,
          StrikingBlade.shoulder(context, s.tool.side, candidate, line, travel),
        ),
      ) -
        span <=
        REACH * s.arm;

    // With no advance named, the least one that reaches: none, step, lunge.
    const advance: IAutoMovieMotionHumanStrikingAdvance.Advance =
      p.advance ??
      (["none", "step"] as const).find(
        (candidate: IAutoMovieMotionHumanStrikingAdvance.Advance): boolean =>
          within(candidate),
      ) ??
      "lunge";

    // An advance carries the body no farther than brings the target within
    // that reach: a lunge with a long blade at a near target is a short one.
    // The least travel that reaches is bisected on the advance's own posture;
    // one that reaches nothing at its full travel keeps it, and the arm's
    // reach then refuses.
    const full: number = StrikingAdvance.travel(context, advance);
    let travel: number = full;
    if (given !== undefined && advance !== "none" && within(advance, full)) {
      let lo: number = 0;
      let hi: number = full;
      if (within(advance, 0)) hi = 0;
      else
        for (let i: number = 0; i < TRAVEL_BISECTIONS; i++) {
          const mid: number = (lo + hi) / 2;
          if (within(advance, mid)) hi = mid;
          else lo = mid;
        }
      travel = hi;
    }
    const reach: IAutoMovieVector3 = StrikingBlade.shoulder(
      context,
      s.tool.side,
      advance,
      line,
      travel,
    );
    const m: IAutoMovieMotionHumanActionContext["body"]["measure"] =
      context.body.measure;
    const drop: number = m.chestHeight - m.shoulderHeight;
    const far: number = REACH * s.arm + span;
    return {
      target:
        given ??
        Vector3.add(
          reach,
          s.world(
            {
              out: 0,
              up: drop,
              forward: Math.sqrt(Math.max(0, far * far - drop * drop)),
            },
            yaw,
          ),
        ),
      line,
      yaw,
      advance,
      travel,
      reach,
      posture:
        advance === "none"
          ? context.entry.posture
          : StrikingAdvance.stood(context, s.tool.side, line, travel, null),
    };
  };

  /*
   * The clock of an attack (`HumanSwordTiming.timed`).
   */
  export const timed: typeof HumanSwordTiming.timed = HumanSwordTiming.timed;

  /*
   * The blade hand's grip frame as the entry pose holds it, world: where a
   * stroke leaves from and returns to.
   */
  export const held = (
    context: Pick<IAutoMovieMotionHumanActionContext, HeldContext>,
    side: AutoMovieHumanSide,
  ): IAutoMovieMotionHumanStrikingHeld.IHandFrame => {
    const bones: ReturnType<typeof poseBones> = poseBones(
      context.body,
      context.entry.pose,
    );
    return {
      point: HumanHand.frame(context.body, bones, side, "grip").point,
      rotation: bones.get(`${side}Hand`)!.worldRotation,
    };
  };

  /*
   * The share of its path an attack runs: all of it, a feint's shown share, or,
   * parried, as far as the parry meets it: a parry closes its line with the
   * hand a forearm ahead of the shoulders (`HumanSwordParry`'s guard), across
   * the attack's horizontal `line`, and takes the attacking blade on its weak
   * (`THIRDS[0]` back from the point), so the attack stops where the weak,
   * going from `from` at the path's start to `to` at its end, crosses that
   * frontal plane a forearm before `target`: `u = (s0 - forearm) / (s0 - s1)`
   * for the weak's heights `s0`, `s1` before the target along `-line`, all of
   * the path where it never crosses; the defender is measured as the attacker,
   * as `aim`'s stand-in opponent is.
   */
  export const stopped = (
    context: Pick<
      IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanSword.IAttack>,
      StoppedContext
    >,
    from: IAutoMovieVector3,
    to: IAutoMovieVector3,
    target: IAutoMovieVector3,
    line: IAutoMovieVector3,
  ): number => {
    const params: IAutoMovieMotionHumanSword.IAttack = context.params;
    if (params.feint !== undefined)
      return HumanBound.within("feint", params.feint, 0, 1, "", "both");
    if (params.outcome !== "parried") return 1;
    const guard: number = context.body.measure.forearm;
    const s0: number = -Vector3.dot(Vector3.subtract(from, target), line);
    const s1: number = -Vector3.dot(Vector3.subtract(to, target), line);
    if (s0 <= guard) return 0;
    return s1 < guard ? Math.min(1, (s0 - guard) / (s0 - s1)) : 1;
  };

  /*
   * Whether a parried attack's blade is taken by its parry (`IAttack.taken`),
   * so it has no return and ends where it was stopped; never a feint's.
   */
  export const taken = (params: IAutoMovieMotionHumanSword.IAttack): boolean =>
    params.taken === true &&
    params.outcome === "parried" &&
    params.feint === undefined;

  /*
   * Where a held blade's weak lies, `THIRDS[0]` of its length back from its
   * point, for a hand frame.
   */
  export const weak = (
    tool: IAutoMovieMotionHumanStrikingHeld.ITool,
    frame: IAutoMovieMotionHumanStrikingHeld.IHandFrame,
  ): IAutoMovieVector3 =>
    Vector3.add(
      frame.point,
      Quaternion.rotateVector(
        frame.rotation,
        Vector3.subtract(
          tool.tip,
          Vector3.scale(tool.axis, THIRDS[0] * tool.length),
        ),
      ),
    );

  /*
   * What an author can change when a target is out of reach.
   */
  export const FIX: string =
    "name an advance (a step or a lunge), stand closer, or aim at a nearer target";

  /*
   * HumanSwordCutAt, read through this namespace.
   */
  export const cutAt: typeof HumanSwordCutAt = HumanSwordCutAt;

  /*
   * The cut at a blade's edge speed, 6 m/s at novice to 10 m/s at elite
   * (`SPEED.cut`, provisional): `cutAt` of that band.
   */
  export const cut: IAutoMovieMotionHumanActionLaw<IAutoMovieMotionHumanSword.ICut> =
    cutAt(SPEED.cut);

  /*
   * The bisections of an advance's travel down to the least that reaches: the
   * full travel's 2^-20, under a micrometre.
   */
  const TRAVEL_BISECTIONS: number = 20;
}

/*
 * The alternatives of `StoppedContext`'s site.
 */
type StoppedContext = "body" | "params";

/*
 * The alternatives of `HeldContext`'s site.
 */
type HeldContext = "body" | "entry";

/*
 * The alternatives of `SPEEDEntryItem`'s site.
 */
type SPEEDEntryItem = "thrust" | "cut";

/*
 * The alternatives of `LANDSEntryItem`'s site.
 */
type LANDSEntryItem = "cut" | "parry";
