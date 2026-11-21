import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieAffordance,
  IAutoMovieMotionClock,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanStrikingAdvance,
  IAutoMovieMotionHumanStrikingHeld,
  IAutoMovieMotionHumanSword,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanBound } from "../law/HumanBound";
import { HumanFrame } from "../posture/HumanFrame";
import { HumanHand } from "../posture/HumanHand";
import { poseBones } from "../posture/poseBones";
import { HumanSkill } from "../skill/HumanSkill";
import { StrikingAdvance } from "../striking/StrikingAdvance";
import { StrikingBlade } from "../striking/StrikingBlade";
import { StrikingHeld } from "../striking/StrikingHeld";
import { StrikingQuality } from "../striking/StrikingQuality";
import { StrikingRoll } from "../striking/StrikingRoll";
import { StrikingTarget } from "../striking/StrikingTarget";
import { HumanSwordFollow } from "./HumanSwordFollow";
import { HumanSwordLanding } from "./HumanSwordLanding";
import { HumanSwordTiming } from "./HumanSwordTiming";

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
 * the blade; binds, winds and redirection are not planned; the chambers and
 * the stand-in target are the body's own measures, and `SWING`, `CONE`,
 * `REACH`, `STOPPED` and the cut's speed are provisional.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the effector, how the blade is given, the vocabulary with its source, how a parried attack is declared and what the first pass leaves out.
 * @evidence contracts/development/design.md#principled-representation One law record over the stroke planner; the lines a cut comes from are a closed union with a table of directions.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The cut, the attack's parameters, aim and clock the thrust shares, the tables and constants, and the setup every blade law shares.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No sword kind is named; lengths are shares of the arm and the blade's own length.
 */
export namespace HumanSword {
  /** Where each cut comes from, across the line to the target: `out` and `up` parts of a unit direction. */
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

  /** The blade's turn from its chamber to the cut's contact, degrees (provisional). */
  export const SWING: number = 110;

  /**
   * The middles of a blade's three parts, shares of its length from one
   * end: the fencing masters' division of the blade into the forte by the
   * hilt, the middle and the foible by the point (Angelo 1763, The School of
   * Fencing), the forte parrying and the foible being parried.
   */
  export const THIRDS: readonly [number, number, number] = [
    1 / 6,
    1 / 2,
    5 / 6,
  ];

  /** Where a cut lands, as a share of the held thing's edge from its end by the hand (`StrikingHeld.ITool.span`): the centre of percussion of a uniform bar swung about that end, two thirds of it, where the blow leaves no shock in the hand (`I / (m d)` with `I = m L^2 / 3` and `d = L / 2`); and where a parry first receives, as a share of the blade's length from the hand: the forte's middle (`THIRDS`). A thing that declares no edge lands a cut with its working point. */
  export const LANDS: Readonly<Record<"cut" | "parry", number>> = {
    cut: 2 / 3,
    parry: THIRDS[0],
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

  /**
   * Read the held blade and the performer's axes at an action's entry.
   *
   * @param context The action's context.
   * @returns The setup.
   */
  export const setup = (
    context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanSword.IWield>,
  ): IAutoMovieMotionHumanSword.ISetup => {
    const p: IAutoMovieMotionHumanSword.IWield = context.params;
    const side: AutoMovieHumanSide = p.hand ?? "right";
    const tool: IAutoMovieMotionHumanStrikingHeld.ITool = StrikingHeld.of(
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

  /** Read an attack's target, line and advance: the target named, or with none a stand-in opponent of the performer's own measure whose sternum lies straight ahead at the arm's `REACH` and the landing part's span from the shoulder, the centre of the fencing target; and with no advance named the least that reaches. */
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

  /** The bisections of an advance's travel down to the least that reaches: the full travel's 2^-20, under a micrometre. */
  const TRAVEL_BISECTIONS: number = 20;

  /** The clock of an attack (`HumanSwordTiming.timed`). */
  export const timed: typeof HumanSwordTiming.timed = HumanSwordTiming.timed;

  /** The blade hand's grip frame as the entry pose holds it, world: where a stroke leaves from and returns to. */
  export const held = (
    context: Pick<IAutoMovieMotionHumanActionContext, "body" | "entry">,
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

  /** The share of its path an attack runs: all of it, a feint's shown share, or a parried attack's stop. */
  export const stopped = (
    params: IAutoMovieMotionHumanSword.IAttack,
  ): number => {
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
   * @evidence contracts/development/implementation.md#principled-implementation The contact pose puts the landing part (`LANDS.cut` along the held thing's edge, or its working point when it declares no edge) on the target with the edge along the travel, the blade's lean back and its turn about the travel chosen by the arm's fit (`HumanSwordLanding`); the stroke is that pose turned back by `SWING` about the axis square to blade and travel, the hilt going from a chamber by the shoulder to the contact on one progress, so the edge leads through the whole arc. A cut is not arrested: the edge passes the target at the peak speed of one minimum-jerk unit, its middle (Flash and Hogan 1985), so the follow-through lasts as long as the attack and carries the edge past the target as far and through as wide a turn as it came.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The aim, the contact pose, the chamber and the path, then the shared stroke planner.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts `SWING` and the leans and turns of the blade at contact are provisional values named in code and documentation, the chamber is the arm's own segments; an unreachable target is refused, never shortened.
   * @evidence contracts/development/implementation.md#efficient-algorithms The landing's fits (`HumanSwordLanding`), ending at the first the arm holds exactly; each posture costs the stroke planner's two elbow searches.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Planned once per instance; nothing is shared between instances.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The plan closes over its constants and the entry state, released with the plan.
   */
  export const cut: IAutoMovieMotionHumanActionLaw<IAutoMovieMotionHumanSword.ICut> =
    {
      name: "swordCut",
      interrupts: StrikingHeld.follows("strokeEnd"),
      plan: (
        context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanSword.ICut>,
      ): IAutoMovieMotionHumanActionPlan => {
        const s: IAutoMovieMotionHumanSword.ISetup = setup(context);
        // What lands is the held thing's own striking part: `LANDS.cut` along
        // its edge from the hand's end, or its working point when it declares
        // no edge.
        const back: number =
          s.tool.span === null
            ? 0
            : s.tool.span[1] - LANDS.cut * (s.tool.span[1] - s.tool.span[0]);
        const a: IAutoMovieMotionHumanSword.IAim = aim(
          context,
          s,
          s.tool.length - back,
        );
        const [out, up]: readonly [number, number] =
          LINES[context.params.from ?? "above"];
        const origin: IAutoMovieVector3 = s.world(
          { out, up, forward: 0 },
          a.yaw,
        );
        const travel: IAutoMovieVector3 = Vector3.scale(origin, -1);

        // The contact pose: the landing part on the target, the edge leading
        // along the travel, the blade's lean and turn as the arm holds them.
        const landed: IAutoMovieMotionHumanStrikingHeld.IHandFrame =
          HumanSwordLanding.frame(context, {
            tool: s.tool,
            back,
            target: a.target,
            reach: a.reach,
            travel,
            cone: CONE,
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
        // The chamber: the upper arm along the line of attack and the forearm
        // square to it, raised toward where the cut comes from.
        const chamber: IAutoMovieVector3 = Vector3.add(
          s.shoulder,
          Vector3.add(
            Vector3.scale(a.line, context.body.measure.upperArm),
            Vector3.scale(origin, context.body.measure.forearm),
          ),
        );
        const path = (
          progress: number,
        ): IAutoMovieMotionHumanStrikingHeld.IHandFrame => ({
          rotation: Quaternion.multiply(
            Quaternion.fromAxisAngle(about, -SWING * (1 - progress)),
            landed.rotation,
          ),
          // Past the target the edge goes on the way it came, the second
          // half of the unit mirroring the first.
          point:
            progress <= 1
              ? Vector3.lerp(chamber, landed.point, progress)
              : Vector3.add(
                  landed.point,
                  Vector3.scale(
                    Vector3.subtract(landed.point, chamber),
                    progress - 1,
                  ),
                ),
        });
        const entered: IAutoMovieMotionHumanStrikingHeld.IHandFrame = held(
          context,
          s.tool.side,
        );
        const clock: IAutoMovieMotionClock = timed(
          context,
          ((SWING * Math.PI) / 180) * (s.tool.length - back) +
            Vector3.length(Vector3.subtract(landed.point, chamber)),
          s.skill(SPEED.cut),
          1,
          0,
          HumanSwordTiming.travel(s.tool, entered, path(0)),
          HumanSwordTiming.travel(s.tool, path(2), entered),
        );

        // The landing follows a target that moves after the start.
        const follow: HumanSwordFollow.IFollower = HumanSwordFollow(
          context,
          a.target,
          clock.at("stroke"),
        );
        const planned: IAutoMovieMotionHumanActionPlan = StrikingBlade.plan(
          context,
          {
            tool: s.tool,
            clock,
            path,
            back,
            follow: follow.at,
            support: s.support,
            advance: a.advance,
            travel: a.travel,
            line: a.line,
            stay: false,
            stop: stopped(context.params),
          },
        );

        // Observations read while the schedule was being resolved are
        // dropped once the performance settles. The plan is extended in
        // place, so any getter it carries is not read early.
        const settled: IAutoMovieMotionHumanActionPlan["settle"] =
          planned.settle;
        planned.settle = (): void => {
          follow.settle();
          settled?.call(planned);
        };
        return planned;
      },
    };
}
