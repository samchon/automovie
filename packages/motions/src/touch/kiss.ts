import { Vector3 } from "@automovie/engine";
import type {
  AutoMovieMotionHumanActionName,
  IAutoMovieMotionClock,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanEntryState,
  IAutoMovieMotionHumanKiss,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanRise,
  IAutoMovieMotionManner,
  IAutoMovieMotionTarget,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionClock } from "../compose/AutoMovieMotionClock";
import { AutoMovieMotionHumanBase } from "../compose/AutoMovieMotionHumanBase";
import { AutoMovieMotionHumanHead } from "../compose/AutoMovieMotionHumanHead";
import { AutoMovieMotionHumanInterrupt } from "../compose/AutoMovieMotionHumanInterrupt";
import { AutoMovieMotionHumanJoints } from "../compose/AutoMovieMotionHumanJoints";
import { AutoMovieMotionHumanRise } from "../compose/AutoMovieMotionHumanRise";
import { AutoMovieMotionHumanTiming } from "../compose/AutoMovieMotionHumanTiming";
import { AutoMovieMotionManner } from "../compose/AutoMovieMotionManner";
import { composeAutoMovieMotionHumanAction } from "../compose/composeAutoMovieMotionHumanAction";
import { HumanBalance } from "../everyday/HumanBalance";
import { HumanTrunk } from "../everyday/HumanTrunk";
import { HumanBound } from "../law/HumanBound";
import { prepareHumanPoseResolution } from "../posture/prepareHumanPoseResolution";
import { kissBody } from "./kissBody";
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
  export const name: AutoMovieMotionHumanActionName = "kiss";

  /** Cancel table. */
  export const interrupts: IAutoMovieMotionHumanActionLaw["interrupts"] =
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
    context: Pick<IAutoMovieMotionHumanActionContext, "body">,
    entry: IAutoMovieMotionHumanPosture,
    stance: IAutoMovieMotionHumanRise.Stance,
    twist: number,
    at: IAutoMovieVector3,
    seated: boolean = false,
    behind: number = 0,
  ): IAutoMovieMotionHumanKiss.ISolved {
    const body: IAutoMovieMotionHumanActionContext["body"] = context.body;
    const resolution: ReturnType<typeof prepareHumanPoseResolution> =
      prepareHumanPoseResolution();
    const postureAt: ReturnType<typeof kissPose> = kissPose(body, entry, stance, twist, behind, seated);
    const mouth: ReturnType<typeof HumanTrunk.preparePoint> = HumanTrunk.preparePoint(body, "mouth");
    const miss = (s: Omit<IAutoMovieMotionHumanKiss.ISolved, "miss">): number =>
      Vector3.distance(
          mouth(postureAt(s), resolution),
          at,
        );
    const least = (candidates: Omit<IAutoMovieMotionHumanKiss.ISolved, "miss">[]): IAutoMovieMotionHumanKiss.ISolved => {
      let best: IAutoMovieMotionHumanKiss.ISolved | null = null;
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
    const sagittal = (s: IAutoMovieMotionHumanKiss.ISolved): IAutoMovieMotionHumanKiss.ISolved => {
      const coarse: IAutoMovieMotionHumanKiss.ISolved = least([
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
    let best: IAutoMovieMotionHumanKiss.ISolved = sagittal({
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
    const raised: IAutoMovieMotionHumanKiss.ISolved[] = span(0, RAISE, 1).map(
      (raise: number): IAutoMovieMotionHumanKiss.ISolved => {
        const c = { ...best, raise };
        return { ...c, miss: miss(c) };
      },
    );
    const closest: number = Math.min(...raised.map((c: IAutoMovieMotionHumanKiss.ISolved) => c.miss));
    return sagittal(
      raised.find((c: IAutoMovieMotionHumanKiss.ISolved): boolean => c.miss <= closest + NEAR / 5)!,
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
    context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanKiss.IParams>,
  ): IAutoMovieMotionHumanActionPlan {
    const p: IAutoMovieMotionHumanKiss.IParams = context.params;
    const body = context.body;
    const hold: number = p.hold ?? HOLD;
    HumanBound.least("hold", hold, 0, "s");
    const modifiers: IAutoMovieMotionManner.IModifiers =
      AutoMovieMotionManner.of(context, p.manner);
    const entry: IAutoMovieMotionHumanPosture = context.entry.posture;
    const target: IAutoMovieMotionTarget = {
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
    const stance: IAutoMovieMotionHumanRise.Stance = {
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
      (s: IAutoMovieMotionHumanEntryState.ISupport): boolean => s.kind === "seat",
    );
    // The body at a share of the kiss: risen, leaned from the hips, the hips
    // moved back by `behind` along the heading, and, standing, lowered onto
    // the planted legs: the one model the solve scores (`kissBody`).
    const written = (
      posture: IAutoMovieMotionHumanPosture,
      s: IAutoMovieMotionHumanKiss.ISolved,
      k: number,
      behind: number,
      heels: number = k,
    ): IAutoMovieMotionHumanPosture => kissBody(body, posture, stance, s, k, behind, seated, heels);
    // Standing, the lean carries the centre ahead of the feet, so the hips
    // move back by the static balance's shift at the solved lean
    // (`HumanBalance.shift`, as a bow's do), and the lean is solved again
    // with them there; seated, the seat bears the body. The lean solved
    // again moves the centre, so the two are solved in turn until the
    // shift settles within the balance's own tolerance, the rounds bounded
    // by the halvings of the shift's search range down to it; the last
    // round stands when they do not, its miss left to the verdict.
    let solved: IAutoMovieMotionHumanKiss.ISolved = solve(context, entry, stance, twist, at, seated);
    let behind: number = 0;
    if (!seated) {
      const rounds: number =
        Math.ceil(
          Math.log2((HumanBalance.RANGE * body.measure.hipHeight) / HumanBalance.TOLERANCE),
        ) + 1;
      for (let round: number = 0; round < rounds; ++round) {
        const lean: IAutoMovieMotionHumanKiss.ISolved = solved;
        const next: number = HumanBalance.shift(
          body,
          (back: number): IAutoMovieMotionHumanPosture => written(entry, lean, 1, back),
        );
        const moved: number = Math.abs(next - behind);
        behind = next;
        if (moved <= HumanBalance.TOLERANCE) break;
        solved = solve(context, entry, stance, twist, at, seated, behind);
      }
    }
    const travel: number = Vector3.distance(HumanTrunk.region(body, entry, "mouth").point, at);
    const approach: number = AutoMovieMotionHumanTiming.transport(travel);
    // Risen, the body bears on its forefoot alone: the sway (the lean and
    // the hips' shift) leads the heels by the least time that keeps the
    // extrapolated centre of mass in the flat feet's base, both ways, and
    // the heels take at least the least time that keeps it over the
    // forefoot (`AutoMovieMotionHumanRise.poise`), as the touch's rise does.
    const rises: boolean = !seated && solved.raise > 0;
    const swayed: IAutoMovieMotionHumanPosture = written(entry, solved, 1, behind, 0);
    const poise: number = rises
      ? AutoMovieMotionHumanRise.poise(body, written(entry, solved, 0, behind, 0), swayed, true)
      : 0;
    const rising: number = rises
      ? AutoMovieMotionHumanRise.poise(body, swayed, written(entry, solved, 1, behind, 1), false)
      : 0;
    const timed: IAutoMovieMotionClock = AutoMovieMotionManner.time(
      AutoMovieMotionClock.phrase({
        prepare: Math.max(approach, rising),
        attack: 0,
        hold,
        retract: Math.max(approach, rising),
      }),
      modifiers,
    );
    const clock: IAutoMovieMotionClock = AutoMovieMotionClock.of(
      timed.duration + 2 * poise,
      [
        ...timed.instants.map((i) => ({ ...i, seconds: i.seconds + poise })),
        { name: "contact", seconds: poise + timed.at("ready") },
        { name: "part", seconds: poise + timed.at("relax") },
        ...(poise === 0
          ? []
          : [
              { name: "poised", seconds: poise },
              { name: "unpoised", seconds: poise + timed.duration },
            ]),
      ],
    );
    const share = (seconds: number): number =>
      clock.envelope(["start", "ready"], ["relax", "end"], seconds);
    const sway = (seconds: number): number =>
      poise === 0 ? share(seconds) : clock.envelope(["start", "poised"], ["unpoised", "end"], seconds);
    const heels = (seconds: number): number =>
      poise === 0 ? share(seconds) : clock.envelope(["poised", "ready"], ["relax", "unpoised"], seconds);
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
          write: (posture: IAutoMovieMotionHumanPosture, seconds: number): IAutoMovieMotionHumanPosture =>
            written(posture, solved, sway(seconds), behind, heels(seconds)),
        },
        ...(solved.raise > 0
          ? AutoMovieMotionHumanRise.legs({
              body,
              stance,
              from: 0,
              to: clock.duration,
              degrees: (seconds: number): number =>
                solved.raise * heels(seconds),
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
