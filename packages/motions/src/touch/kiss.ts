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
import { AutoMovieMotionHumanTiming } from "../compose/AutoMovieMotionHumanTiming";
import { AutoMovieMotionManner } from "../compose/AutoMovieMotionManner";
import { composeAutoMovieMotionHumanAction } from "../compose/composeAutoMovieMotionHumanAction";
import { HumanTrunk } from "../everyday/HumanTrunk";
import type { IHumanActionContext } from "../law/IHumanActionContext";
import type { IHumanActionLaw } from "../law/IHumanActionLaw";
import type { IHumanActionPlan } from "../law/IHumanActionPlan";
import type { IHumanPosture } from "../posture/IHumanPosture";

/**
 * A kiss while standing: the lips brought to a partner's region (a cheek, the
 * forehead, the crown, the lips, the back of a hand) by leaning the body
 * from the hips and flexing the neck, the head turned to one side for a
 * cheek or the lips so the noses stay clear (#3284).
 *
 * The lean and the neck's flexion are solved at plan time so the mouth
 * region of the leaned posture lands on the target as it stands at the
 * kiss's start: a grid of pitch and flexion at 5 degree steps, then 1 degree
 * steps about the best. The head turns 30 degrees for a cheek or the lips
 * (provisional), to the right unless `side` says otherwise; Guntürkün 2003
 * observed a two-to-one rightward bias, which Sedgewick et al. 2019 did not
 * find, so the side is a parameter. The approach is the free-space transport
 * of the mouth's travel, the kiss holds 0.6 s (provisional) and the return
 * takes the approach's time. The feet stay planted; a height difference the
 * lean and the neck cannot close is left as a miss the verdict reports, and a
 * toe rise is not drafted yet.
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
   * The lean and the neck flexion that bring the mouth nearest a point.
   *
   * @param context The body.
   * @param entry The standing posture.
   * @param twist The head's twist, degrees.
   * @param at The point, world.
   * @returns The pitch and the flexion, degrees, and the miss, metres.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the unknowns, the grid and the result's units.
   * @evidence contracts/development/implementation.md#principled-implementation A two-parameter search of the mouth region's distance to the point over the hips' lean and the neck's flexion, coarse at 5 degrees and refined at 1 degree about the best.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Two nested grids over one miss function.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The miss is returned, never hidden; the ranges are the lean's and the neck's working ranges (provisional).
   * @evidence contracts/development/implementation.md#efficient-algorithms 192 coarse and 81 fine forward-kinematics passes at plan time.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses `AutoMovieMotionHumanLean.pivot`, the head share and `HumanTrunk.region`.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function that retains nothing.
   */
  export function solve(
    context: Pick<IHumanActionContext, "body">,
    entry: IHumanPosture,
    twist: number,
    at: IAutoMovieVector3,
  ): { pitch: number; flexion: number; miss: number } {
    const body = context.body;
    const miss = (pitch: number, flexion: number): number =>
      Vector3.length(
        Vector3.subtract(
          HumanTrunk.region(
            body,
            posed(body, entry, pitch, flexion, twist),
            "mouth",
          ).point,
          at,
        ),
      );
    let best: { pitch: number; flexion: number; miss: number } = {
      pitch: 0,
      flexion: 0,
      miss: miss(0, 0),
    };
    for (let pitch: number = -10; pitch <= 45; pitch += 5)
      for (let flexion: number = -30; flexion <= 45; flexion += 5) {
        const m: number = miss(pitch, flexion);
        if (m < best.miss) best = { pitch, flexion, miss: m };
      }
    const coarse: { pitch: number; flexion: number; miss: number } = best;
    for (
      let pitch: number = coarse.pitch - 4;
      pitch <= coarse.pitch + 4;
      pitch++
    )
      for (
        let flexion: number = coarse.flexion - 4;
        flexion <= coarse.flexion + 4;
        flexion++
      ) {
        const m: number = miss(pitch, flexion);
        if (m < best.miss) best = { pitch, flexion, miss: m };
      }
    return best;
  }

  /** A standing posture leaned from the hips with the head flexed and turned. */
  function posed(
    body: IHumanActionContext["body"],
    entry: IHumanPosture,
    pitch: number,
    flexion: number,
    twist: number,
  ): IHumanPosture {
    const leaned: IHumanPosture = AutoMovieMotionHumanLean.pivot(body, entry, {
      pitch,
      roll: 0,
    });
    const head = AutoMovieMotionHumanHead.share(0, flexion);
    const turn = AutoMovieMotionHumanHead.share(2, twist);
    return {
      ...leaned,
      joints: {
        ...leaned.joints,
        neck: [head.neck![0], 0, turn.neck![2]],
        head: [head.head![0], 0, turn.head![2]],
      },
    };
  }

  /**
   * Plan a kiss.
   *
   * @param context The action's context.
   * @returns The plan.
   * @throws {Error} When the hold is negative.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the input, the plan and the refusal; the law's doc gives the solve and the timing.
   * @evidence contracts/development/implementation.md#principled-implementation The lean and the neck solved once against the target at the start, then raised and lowered on the phrase envelope with the head's turn.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Target, solve, clock, two primitives, composition.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The turn and the hold are named provisional constants; an unreachable target leaves a measured miss.
   * @evidence contracts/development/implementation.md#efficient-algorithms One grid solve at plan time.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses the lean, the head share and the joint pulse.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The plan closes over two solved angles and the clock.
   */
  export function plan(
    context: IHumanActionContext<IParams>,
  ): IHumanActionPlan {
    const p: IParams = context.params;
    const body = context.body;
    const hold: number = p.hold ?? HOLD;
    if (!(hold >= 0)) throw new Error("A kiss's hold is not negative");
    const modifiers: AutoMovieMotionManner.IModifiers =
      AutoMovieMotionManner.of(context, p.manner);
    const entry: IHumanPosture = context.entry.posture;
    const target: AutoMovieMotionTarget = {
      kind: "person",
      subject: p.partner,
      region: p.region,
    };
    const turned: boolean = p.region === "mouth" || p.region.startsWith("jaw");
    const twist: number = turned ? (p.side === "left" ? TURN : -TURN) : 0;
    const at: IAutoMovieVector3 = context.aim(target, context.start).point;
    const solved = solve(context, entry, twist, at);
    const travel: number = Vector3.length(
      Vector3.subtract(HumanTrunk.region(body, entry, "mouth").point, at),
    );
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
      base: AutoMovieMotionHumanBase.still(
        clock.duration,
        entry,
        AutoMovieMotionHumanBase.plants(),
      ),
      clock,
      primitives: [
        AutoMovieMotionHumanLean.sway({
          body,
          from: 0,
          to: clock.duration,
          angles: (seconds: number): AutoMovieMotionHumanLean.IAngles => ({
            pitch: solved.pitch * share(seconds),
            roll: 0,
          }),
        }),
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
