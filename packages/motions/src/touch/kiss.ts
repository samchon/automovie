import { Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanoidRegion,
  AutoMovieMotionTarget,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { HumanActionName } from "../HumanActionName";
import { AutoMovieMotionClock } from "../compose/AutoMovieMotionClock";
import { AutoMovieMotionHumanBase } from "../compose/AutoMovieMotionHumanBase";
import { AutoMovieMotionHumanHead } from "../compose/AutoMovieMotionHumanHead";
import { AutoMovieMotionHumanInterrupt } from "../compose/AutoMovieMotionHumanInterrupt";
import { AutoMovieMotionHumanJoints } from "../compose/AutoMovieMotionHumanJoints";
import { AutoMovieMotionHumanLean } from "../compose/AutoMovieMotionHumanLean";
import { AutoMovieMotionHumanLeg } from "../compose/AutoMovieMotionHumanLeg";
import { AutoMovieMotionHumanRise } from "../compose/AutoMovieMotionHumanRise";
import { AutoMovieMotionHumanTiming } from "../compose/AutoMovieMotionHumanTiming";
import { AutoMovieMotionManner } from "../compose/AutoMovieMotionManner";
import { composeAutoMovieMotionHumanAction } from "../compose/composeAutoMovieMotionHumanAction";
import { HumanBalance } from "../everyday/HumanBalance";
import { HumanTrunk } from "../everyday/HumanTrunk";
import { HumanBound } from "../law/HumanBound";
import type { IHumanActionContext } from "../law/IHumanActionContext";
import type { IHumanActionLaw } from "../law/IHumanActionLaw";
import type { IHumanActionPlan } from "../law/IHumanActionPlan";
import type { IHumanEntryState } from "../law/IHumanEntryState";
import type { IHumanPosture } from "../posture/IHumanPosture";
import { prepareHumanPoseResolution } from "../posture/prepareHumanPoseResolution";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import { kissPose } from "./kissPose";

/**
 * A kiss while standing: the lips brought to a partner's region (a cheek, the
 * forehead, the crown, the lips, the back of a hand) by leaning the body
 * from the hips and flexing the neck, the head turned to one side for a
 * cheek or the lips so the noses stay clear (#3284).
 *
 * The lean and the neck's flexion are solved at plan time so the mouth
 * region of the leaned posture lands on the target as it stands at the
 * kiss's start: a grid of pitch and flexion at 5 degree steps, then 1 degree
 * steps about the best, then a lean of up to 10 degrees to the side the
 * target lies on, and, when the mouth is still short, a rise onto the toes
 * of up to 35 degrees of heel (both provisional). The head turns 30 degrees
 * for a cheek or the lips (provisional), to the right unless `side` says
 * otherwise; Guntürkün 2003 observed a two-to-one rightward bias, which
 * Sedgewick et al. 2019 did not find, so the side is a parameter. The
 * approach is the free-space transport
 * of the mouth's travel, the kiss holds 0.6 s (provisional) and the return
 * takes the approach's time. Standing, the hips move back by the static
 * balance's shift at the solved lean (`HumanBalance.shift`, as a bow's do),
 * so the centre stays over the feet, and the lean is solved again with them
 * there. The feet stay where they stand; a difference
 * the lean, the neck and the toes cannot close is left as a miss the verdict
 * reports, and a step in is not drafted yet.
 *
 * Events: the phrase instants, with `contact` at `ready` and `part` at
 * `relax`.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the movement, the solve, the sources of the turn side, the provisional values, what is not drafted and the events.
 * @evidence contracts/development/design.md#principled-representation A law record composed of a lean, a head pulse and a held base.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The name, the cancel table, the parameters and the plan.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Reuses the lean, the head share and the trunk's region placement.
 */
export namespace kiss {
  /** The action's name. */
  export const name: HumanActionName = "kiss";

  /** Cancel table. */
  export const interrupts: IHumanActionLaw["interrupts"] =
    AutoMovieMotionHumanInterrupt.table({
      stand: ["fromRelax", "smooth"],
      touch: ["fromRelax", "smooth"],
      walk: ["fromRelax", "smooth"],
      flinch: ["anytime", "reflex"],
    });

  /** The head's turn for a cheek or the lips, degrees (provisional). */
  export const TURN: number = 30;

  /** The kiss's hold, seconds (provisional). */
  export const HOLD: number = 0.6;

  /** The most the body leans to a side, degrees (provisional). */
  export const ROLL: number = 10;

  /** The most the heels rise, degrees (provisional). */
  export const RAISE: number = 35;

  /** The miss under which the heels stay down, metres (provisional). */
  export const NEAR: number = 0.005;

  /**
   * Parameters.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its meaning and default.
   * @evidence contracts/development/design.md#principled-representation The partner and region as the target union's person case, the turn side as a closed union.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The values the plan reads.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Reuses the interface's regions.
   */
  export interface IParams {
    /** The partner. */
    partner: string;

    /** The partner's region. */
    region: AutoMovieHumanoidRegion;

    /** Which way the head turns for a cheek or the lips; `right` when absent. */
    side?: "left" | "right";

    /** Seconds the lips stay; `HOLD` when absent. */
    hold?: number;

    /** How it is performed. */
    manner?: AutoMovieMotionManner.IManner;
  }

  /**
   * A solved kiss: how the body brings the mouth to the point.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its meaning and unit.
   * @evidence contracts/development/design.md#principled-representation The four angles the plan raises on its envelope and the distance they leave.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Five members, all read by the plan or the verdicts.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The miss is a member, so an unreachable target is reported and not hidden.
   */
  export interface ISolved {
    /** The lean forward from the hips, degrees. */
    pitch: number;

    /** The lean toward the body's right from the hips, degrees. */
    roll: number;

    /** The neck's and the head's flexion, degrees. */
    flexion: number;

    /** The heels' raise, degrees. */
    raise: number;

    /** The mouth's distance to the point, metres. */
    miss: number;
  }

  /**
   * The lean, the neck flexion and the heel raise that bring the mouth
   * nearest a point.
   *
   * @param context The body.
   * @param entry The standing posture.
   * @param stance Both feet as they stand.
   * @param twist The head's twist, degrees.
   * @param at The point, world.
   * @param seated Whether a seat bears the body: no heel is raised then, the lean from the seat being all.
   * @param behind How far the hips stand back along the heading for balance, metres; none when absent.
   * @returns The angles, degrees, and the miss, metres.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the unknowns, the grid and the result's units.
   * @evidence contracts/development/implementation.md#principled-implementation The mouth's distance to the point is minimised one freedom at a time: the forward lean and the neck on a grid, coarse at 5 degrees and refined at 1 degree, then the lean to the side at 1 degree steps, then, only when a miss over `NEAR` remains and a stance bears the body, the least heel raise that closes it; the lean and the neck are fitted again after each.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One miss function, a sagittal grid and two line searches.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The miss is returned, never hidden; the ranges are the lean's, the neck's and the ankle's working ranges (provisional).
   * @evidence contracts/development/implementation.md#efficient-algorithms Every original sagittal-grid and line-search candidate retains its actual raw heading/rise/pivot and authored mouth FK. Only canonical mouth demand and primitive fixed head-twist constants prepare once; point-only observation omits unused directions, with speedup unmeasured.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The original lean/rise/head/trunk owners remain. Borrowed entry/stance fields or getters are never frozen by identity or raise equality; every candidate reads them independently. A genuine mouth reader shares only fixed canonical region/rig demand, and the exact FK workspace checks current scalar dependencies.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The search owns one lazy exact reader, fixed mouth-name producer and primitive head constants until return or throw. Each current posture/map/displacement ends with its observation; only selected angles and miss escape, with no raw offset, rise-group answer or candidate history retained.
   */
  export function solve(
    context: Pick<IHumanActionContext, "body">,
    entry: IHumanPosture,
    stance: AutoMovieMotionHumanRise.Stance,
    twist: number,
    at: IAutoMovieVector3,
    seated: boolean = false,
    behind: number = 0,
  ): ISolved {
    const body: IHumanActionContext["body"] = context.body;
    const resolution: ReturnType<typeof prepareHumanPoseResolution> =
      prepareHumanPoseResolution();
    const postureAt: ReturnType<typeof kissPose> = kissPose(body, entry, stance, twist, behind);
    const mouth: ReturnType<typeof HumanTrunk.preparePoint> = HumanTrunk.preparePoint(body, "mouth");
    const miss = (s: Omit<ISolved, "miss">): number =>
      Vector3.distance(
          mouth(postureAt(s), resolution),
          at,
        );
    const least = (candidates: Omit<ISolved, "miss">[]): ISolved => {
      let best: ISolved | null = null;
      for (const c of candidates) {
        const m: number = miss(c);
        if (best === null || m < best.miss) best = { ...c, miss: m };
      }
      return best!;
    };
    const span = (from: number, to: number, step: number): number[] => {
      const out: number[] = [];
      for (let v: number = from; v <= to; v += step) out.push(v);
      return out;
    };
    const sagittal = (s: ISolved): ISolved => {
      const coarse: ISolved = least([
        s,
        ...span(-10, 45, 5).flatMap((pitch: number) =>
          span(-30, 45, 5).map((flexion: number) => ({ ...s, pitch, flexion })),
        ),
      ]);
      return least([
        coarse,
        ...span(coarse.pitch - 4, coarse.pitch + 4, 1).flatMap(
          (pitch: number) =>
            span(coarse.flexion - 4, coarse.flexion + 4, 1).map(
              (flexion: number) => ({ ...coarse, pitch, flexion }),
            ),
        ),
      ]);
    };
    let best: ISolved = sagittal({
      pitch: 0,
      roll: 0,
      flexion: 0,
      raise: 0,
      miss: Infinity,
    });
    best = sagittal(
      least(span(-ROLL, ROLL, 1).map((roll: number) => ({ ...best, roll }))),
    );
    // A seated body has no heels to raise: the lean from the seat is all.
    if (best.miss <= NEAR || seated) return best;
    const raised: ISolved[] = span(0, RAISE, 1).map(
      (raise: number): ISolved => {
        const c = { ...best, raise };
        return { ...c, miss: miss(c) };
      },
    );
    const closest: number = Math.min(...raised.map((c: ISolved) => c.miss));
    return sagittal(
      raised.find((c: ISolved): boolean => c.miss <= closest + NEAR / 5)!,
    );
  }

  /**
   * Plan a kiss.
   *
   * @param context The action's context.
   * @returns The plan.
   * @throws {HumanRefusal} When the hold is negative.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the input, the plan and the refusal; the law's doc gives the solve and the timing.
   * @evidence contracts/development/implementation.md#principled-implementation The lean and the neck solved against the target at the start, standing with the hips moved back by the static balance's shift at the solved lean and solved again there, then raised and lowered on the phrase envelope with the head's turn.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Target, solve, balance, solve, clock, the body's primitive, the legs' when the heels rise, the head's, composition.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The turn and the hold are named provisional constants; an unreachable target leaves a measured miss.
   * @evidence contracts/development/implementation.md#efficient-algorithms One grid solve at plan time.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses the lean, the rise, the planted legs' lowering, `HumanBalance.shift`, the head share and the joint pulse.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The plan closes over the solved angles, the stance and the clock.
   */
  export function plan(
    context: IHumanActionContext<IParams>,
  ): IHumanActionPlan {
    const p: IParams = context.params;
    const body = context.body;
    const hold: number = p.hold ?? HOLD;
    HumanBound.least("hold", hold, 0, "s");
    const modifiers: AutoMovieMotionManner.IModifiers =
      AutoMovieMotionManner.of(context, p.manner);
    const entry: IHumanPosture = context.entry.posture;
    const target: AutoMovieMotionTarget = {
      kind: "person",
      subject: p.partner,
      region: p.region,
    };
    // A cheek, a jaw or the lips turn the head; the other regions do not.
    const turned: boolean =
      p.region === "mouth" ||
      p.region.startsWith("cheek") ||
      p.region.startsWith("jaw");
    const twist: number = turned ? (p.side === "left" ? TURN : -TURN) : 0;
    const at: IAutoMovieVector3 = context.aim(target, context.start).point;
    const stance: AutoMovieMotionHumanRise.Stance = {
      left: {
        ankle: context.entry.feet.left.ankle,
        rotation: context.entry.feet.left.rotation,
      },
      right: {
        ankle: context.entry.feet.right.ankle,
        rotation: context.entry.feet.right.rotation,
      },
    };
    // Seated, the seat bears the body: the lean pivots about the hips over
    // it and the legs keep their place, so neither the heels rise nor the
    // root is lowered onto the feet.
    const seated: boolean = context.entry.supports.some(
      (s: IHumanEntryState.ISupport): boolean => s.kind === "seat",
    );
    const forward: IAutoMovieVector3 = {
      x: Math.sin((entry.yaw * Math.PI) / 180),
      y: 0,
      z: Math.cos((entry.yaw * Math.PI) / 180),
    };
    // The body at a share of the kiss: risen, leaned from the hips, the hips
    // moved back by `behind` along the heading, and, standing, lowered onto
    // the planted legs.
    const written = (
      posture: IHumanPosture,
      s: ISolved,
      k: number,
      behind: number,
    ): IHumanPosture => {
      const leaned: IHumanPosture = AutoMovieMotionHumanLean.pivot(
        body,
        {
          ...posture,
          root: Vector3.add(
            Vector3.add(
              posture.root,
              AutoMovieMotionHumanRise.lift(body, stance, s.raise * k),
            ),
            Vector3.scale(forward, -behind * k),
          ),
        },
        { pitch: s.pitch * k, roll: s.roll * k },
      );
      if (seated) return leaned;
      const goal = (side: "left" | "right") =>
        AutoMovieMotionHumanLeg.goal(
          body,
          leaned,
          side,
          AutoMovieMotionHumanRise.foot(body, side, stance[side], s.raise * k),
          true,
        );
      return {
        ...leaned,
        root: resolveHumanPosture.lower(body, {
          ...leaned,
          limbs: {
            ...leaned.limbs,
            leftLeg: goal("left"),
            rightLeg: goal("right"),
          },
        }).root,
      };
    };
    // Standing, the lean carries the centre ahead of the feet, so the hips
    // move back by the static balance's shift at the solved lean
    // (`HumanBalance.shift`, as a bow's do), and the lean is solved again
    // with them there; seated, the seat bears the body.
    const first: ISolved = solve(context, entry, stance, twist, at, seated);
    const behind: number = seated
      ? 0
      : HumanBalance.shift(
          body,
          (back: number): IHumanPosture => written(entry, first, 1, back),
        );
    const solved: ISolved =
      behind === 0
        ? first
        : solve(context, entry, stance, twist, at, seated, behind);
    const travel: number = Vector3.distance(HumanTrunk.region(body, entry, "mouth").point, at);
    const approach: number = AutoMovieMotionHumanTiming.transport(travel);
    const timed: AutoMovieMotionClock.IClock = AutoMovieMotionManner.time(
      AutoMovieMotionClock.phrase({
        prepare: approach,
        attack: 0,
        hold,
        retract: approach,
      }),
      modifiers,
    );
    const clock: AutoMovieMotionClock.IClock = AutoMovieMotionClock.of(
      timed.duration,
      [
        ...timed.instants,
        { name: "contact", seconds: timed.at("ready") },
        { name: "part", seconds: timed.at("relax") },
      ],
    );
    const share = (seconds: number): number =>
      clock.envelope(["start", "ready"], ["relax", "end"], seconds);
    const head = AutoMovieMotionHumanHead.share(0, solved.flexion);
    const turn = AutoMovieMotionHumanHead.share(2, twist);
    return composeAutoMovieMotionHumanAction({
      base: AutoMovieMotionHumanBase.under(context, clock.duration),
      clock,
      primitives: [
        {
          channels: ["root", "trunk"],
          from: 0,
          to: clock.duration,
          write: (posture: IHumanPosture, seconds: number): IHumanPosture =>
            written(posture, solved, share(seconds), behind),
        },
        ...(solved.raise > 0
          ? AutoMovieMotionHumanRise.legs({
              body,
              stance,
              from: 0,
              to: clock.duration,
              degrees: (seconds: number): number =>
                solved.raise * share(seconds),
            })
          : []),
        AutoMovieMotionHumanJoints.pulse(
          clock,
          ["start", "ready"],
          ["relax", "end"],
          {
            neck: [head.neck![0], 0, turn.neck![2]],
            head: [head.head![0], 0, turn.head![2]],
          },
        ),
      ],
      contact: "contact",
    });
  }
}
