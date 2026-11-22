import type { IAutoMovieVector3 } from "@automovie/interface";

import { type ArchetypeCourse, ArchetypeRefusal } from "../core";
import { EquineObstacle } from "./EquineObstacle";
import type { QuadrupedBody } from "./QuadrupedBody";
import type { QuadrupedFooting } from "./QuadrupedFooting";
import { QuadrupedGait } from "./QuadrupedGait";
import type { QuadrupedRideClock } from "./QuadrupedRideClock";
import type { QuadrupedStridePlan } from "./QuadrupedStridePlan";
import type { rideQuadruped } from "./rideQuadruped";
import { spotEquineTakeoff } from "./spotEquineTakeoff";

/**
 * One horse jump over the obstacles authored in the course's footing, and the scripted baulk that stops before them.
 *
 * The jump keeps the canter's own footfalls up to the takeoff stride. In that stride the trailing hind lands `GAP` of a stride after the first hind, so both hinds push off together, and the non-leading fore lands `FORE` after the final hind liftoff; between the two the hoof clock holds still (`QuadrupedRideClock.IHold`) while the body flies a ballistic arc at the course's constant ground speed. The limbs keep their posture on the trunk while the clock holds. The flight's length is the least that lifts the actual displayed body, in that posture, over each rail and ditch by the authored clearance: the centre of mass's path is concave, so each part only needs the clearance at the two ends of its window over the obstacle, which gives the flight in closed form (`leastEquineFlight`). The canter stride and takeoff spot that need the shortest flight are taken, the approach's strides lengthening or shortening within the gait's declared timing spread to reach that spot, read on the posture at the middle of a nominal flight (`LONGEST`), and planEquineFlight then measures the flown, tucked and pitched body through the whole flight and settles the flight on the least that clears.
 *
 * The push-off and the landing are resolved by the trunk's plan (`EquinePitch`): the centre of mass rises from rest to the takeoff velocity while the hinds push, flies its parabola while the trunk turns nose-down at the measured rate, and sinks to rest over the first fore stance, so the body's height, pitch and their rates are continuous through both. Every swing in the flight is carried in the flying body's frame from its own liftoff (`EquineFlightClock.swing`).
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the stride changes, the hold, the flight law, the selection rule and the pitched push-off and landing.
 * @evidence contracts/development/design.md#principled-representation Obstacles are intervals of course distance with a top height, read from the authored poles and plane gaps; the flight is two film seconds and a hold.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Read by `EquineFootwork` for a leg's technique and by `rideQuadruped` for the moved landings, the hold, the body height and the cues.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No authored trajectory is replayed; the arc follows from the obstacle and the displayed body.
 */
export namespace EquineJump {
  /** The highest admitted obstacle top above the ground, metres: FEI Jumping Rules, "no obstacle may exceed 1.70 m in height" (FEI 2020 jumping rule update, https://usef.org/forms-pubs/-z5NhC_-qkc/important-fei-rule-updates-2020). */
  export const HEIGHT: number = 1.7;

  /** The widest admitted rail spread, metres: the FEI's 2.00 m spread limit for spread obstacles (same source). */
  export const SPREAD: number = 2;

  /** The widest admitted dry ditch, metres: the FEI water jump's 4.00 m maximum, the widest open obstacle the rules ask a horse to clear (same source), provisional for a dry ditch. */
  export const DITCH: number = 4;

  /** Stride share between the first and the trailing hind landing at takeoff, so the hinds push off together: authored, provisional, no measured interval having been read. */
  export const GAP: number = 0.05;

  /** Stride share between final hind liftoff and the non-leading fore landing, outside the held flight: authored, provisional. */
  export const FORE: number = 0.05;

  /** The nominal flight whose middle posture a candidate's closed form reads, seconds: the longest aerial time Clayton, St George, Sinclair and Hobbs 2021 (J Equine Vet Sci 104:103698, Table 1) measured over Olympic fences, 0.73 s over the 1.50 m by 1.80 m spread (verticals to 1.60 m, 0.54 to 0.69 s), fences near the admitted `HEIGHT`. Its middle shows the trunk level and the limbs tucked as a real flight's. */
  export const LONGEST: number = 0.73;

  /** Takeoff spots tried on each side of a candidate stride's own, evenly across the approach's admitted adjustment: authored, a resolution; the rounds then measure the chosen spot. */
  export const SPOTS: number = 10;

  /** Rounds in which the ride measures its flown body over the obstacles and adjusts the held flight: a shortfall extends it, a surplus shortens it by half, so the closed form's flight, read with untucked fores at one held instant, settles on the least clearing flight of the displayed tucked body. A flight still short after them refuses. */
  export const ROUNDS: number = 10;

  /** Seconds of surplus flight a settled jump may keep: the 5 ms between the flight samples `EquineObstacle.shortfall` reads, finer than which the measurement does not resolve. */
  export const SETTLE: number = 0.005;

  /**
   * Jump the obstacles on this leg.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the clearance's unit.
   * @evidence contracts/development/design.md#principled-representation One authored margin in metres.
   * @evidence contracts/development/design.md#minimal-and-owned-surface A member of `Technique`.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
   */
  export interface IJump {
    /** The discriminator. */
    kind: "jump";
    /** Metres the lowest displayed part keeps above each obstacle, at least 0: authored. */
    clearance: number;
  }

  /**
   * Stop before the obstacle and settle: the leg ends at a halt with a pause.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the leg must end with.
   * @evidence contracts/development/design.md#principled-representation A marker on a leg the course already brings to rest.
   * @evidence contracts/development/design.md#minimal-and-owned-surface A member of `Technique`.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
   */
  export interface IBaulk {
    /** The discriminator. */
    kind: "baulk";
  }

  /**
   * A jump or a baulk on one leg.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Lists the two.
   * @evidence contracts/development/design.md#principled-representation A discriminated union.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Part of `EquineFootwork.Technique`.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
   */
  export type Technique = IJump | IBaulk;

  /**
   * An admitted jump before its flight is planned.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the leg, the margin and the obstacles.
   * @evidence contracts/development/design.md#principled-representation The leg's index and course interval, and the obstacles in order.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Passed from `admit` to `plan`.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
   */
  export interface IRequest {
    /** Zero-based leg index. */
    index: number;
    /** Course distance of the leg's start, metres. */
    start: number;
    /** Course distance of the leg's end, metres. */
    end: number;
    /** Authored clearance, metres. */
    clearance: number;
    /** The obstacles, ordered along the leg. */
    obstacles: readonly EquineObstacle.IObstacle[];
  }

  /**
   * One trial assembly of the ride, on which a takeoff candidate is measured.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the ride hands the planner.
   * @evidence contracts/development/design.md#principled-representation The stride plan, its clock, the rest centre of mass and a sampler of the displayed parts and placement, with the flight once one is known.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Built by `rideQuadruped` for each candidate.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
   */
  export interface ITrial {
    /** The stride plan. */
    strides: QuadrupedStridePlan.IPlan;
    /** The clock it was built on. */
    clock: QuadrupedRideClock.IClock;
    /** The animal's rest centre of mass, model metres. */
    centre: IAutoMovieVector3;
    /**
     * The displayed model parts, in model space, and the root's world placement at a film second.
     *
     * @evidence contracts/development/common.md#meaningful-documentation States the frames.
     * @evidence contracts/development/implementation.md#principled-implementation The trial ride's own pose at that second.
     * @evidence contracts/development/implementation.md#clear-and-simple-structure One pose sample.
     * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The trial skips only the footing check its unflown body would fail.
     * @evidence contracts/development/implementation.md#efficient-algorithms One pose sample per call.
     * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses the ride's pose function.
     * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns a fresh model.
     */
    sample: (seconds: number) => EquineObstacle.ISample;
  }

  /**
   * The planned flight.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the moved landings, the hold and the flight's film seconds.
   * @evidence contracts/development/design.md#principled-representation The stride-plan and clock inputs that realise it, and its two events in film seconds.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Read by `rideQuadruped`.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
   */
  export interface IFlight {
    /** The takeoff stride's moved landings. */
    moved: readonly QuadrupedStridePlan.IMoved[];
    /** The hoof-clock hold inside the flight. */
    hold: QuadrupedRideClock.IHold;
    /** The approach's stride adjustment that brings the takeoff to its spot, spread over the leg before the push-off; absent when the strides keep their clock. */
    stretch?: QuadrupedRideClock.IHold;
    /** The phase the hold stands at. */
    phase: number;
    /** Phase of final hind liftoff. */
    takeoff: number;
    /** Phase of the first fore landing. */
    landing: number;
    /** Phase of the approach cue, one stride before takeoff. */
    approach: number;
    /** Phase of the recovery cue, the leading fore's second landing after the flight. */
    recovery: number;
    /** Phase the push-off begins: the trailing hind's takeoff landing, both hinds then down. */
    push: number;
    /** Phase the landing is absorbed: the end of the first fore's stance. */
    absorb: number;
  }

  /**
   * A planned flight's hoof-clock holds: the approach's stride adjustment, when it has one, and the flight's own.
   *
   * @param flight The planned flight.
   * @returns The holds in film order.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the order.
   * @evidence contracts/development/implementation.md#principled-implementation The adjustment ends at the push-off, before the flight's hold.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One list.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No case to special-case.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns a fresh list.
   */
  export function holds(flight: IFlight): QuadrupedRideClock.IHold[] {
    return flight.stretch === undefined
      ? [flight.hold]
      : [flight.stretch, flight.hold];
  }

  /**
   * Admit a jump or a baulk on its leg.
   *
   * @param archetype The source archetype name.
   * @param index The leg's index.
   * @param leg The leg.
   * @param technique The technique.
   * @param plan The admitted course plan.
   * @param footing The authored footing.
   * @returns The jump request, or undefined for an admitted baulk.
   * @throws {ArchetypeRefusal} For a leg that is not a level forward straight, a jump without obstacles or beyond the FEI's height, spread or ditch width, a negative clearance, or a baulk that does not end at a halt with a pause.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the refusals.
   * @evidence contracts/development/implementation.md#principled-implementation Intersect each pole's horizontal segment with the leg's line; its course interval is its radius over the sine of the crossing angle about the crossing, and its top the pole's higher end plus its radius above the leg's ground. A ditch is an interval of the line no authored plane covers, between covered ones.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Check the leg, read the rails, read the ditches, check the bounds.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No obstacle is scaled or skipped to fit a bound.
   * @evidence contracts/development/implementation.md#efficient-algorithms O(K + S log S) for K poles and S planes.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reads the plan's leg span and placement.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns one record.
   */
  export function admit(
    archetype: string,
    index: number,
    leg: rideQuadruped.ILeg,
    technique: Technique,
    plan: ArchetypeCourse.IPlan,
    footing: QuadrupedFooting.IScene | undefined,
  ): IRequest | undefined {
    if (
      leg.kind !== "straight" ||
      leg.reverse === true ||
      (leg.rise ?? 0) !== 0
    )
      refuse("A jump or a baulk needs a level forward straight leg");
    const span: ArchetypeCourse.ILegSpan = plan.legSpans[index]!;
    if (technique.kind === "baulk") {
      if (
        leg.pause === undefined ||
        plan.at(plan.when(span.from + span.span)).speed !== 0
      )
        refuse("A baulk must bring the horse to a halt and pause there");
      return undefined;
    }
    if (!(Number.isFinite(technique.clearance) && technique.clearance >= 0))
      refuse("The clearance must be a nonnegative number of metres");
    const obstacles: EquineObstacle.IObstacle[] = EquineObstacle.read(
      plan,
      span,
      footing,
    );
    if (obstacles.length === 0)
      refuse("A jump needs an authored pole or ditch across the leg");
    const rails: readonly EquineObstacle.IObstacle[] = obstacles.filter(
      (o: EquineObstacle.IObstacle): boolean => o.top > 0,
    );
    if (rails.some((o: EquineObstacle.IObstacle): boolean => o.top > HEIGHT))
      refuse(`An obstacle may not exceed ${HEIGHT} m`);
    if (
      rails.length > 0 &&
      rails[rails.length - 1]!.to - rails[0]!.from > SPREAD
    )
      refuse(`A spread may not exceed ${SPREAD} m`);
    if (
      obstacles.some(
        (o: EquineObstacle.IObstacle): boolean =>
          o.top === 0 && o.to - o.from > DITCH,
      )
    )
      refuse(`A ditch may not exceed ${DITCH} m`);
    return {
      index,
      start: span.from,
      end: span.from + span.span,
      clearance: technique.clearance,
      obstacles,
    };

    /** Report the leg that cannot carry the technique. */
    function refuse(reason: string): never {
      throw new ArchetypeRefusal({
        kind: "parameter",
        archetype,
        axis: `legs[${index}].equineFootwork`,
        value: technique,
        feasible: null,
        reason,
        fix: "Approach the obstacle at the canter on a level straight leg.",
      });
    }
  }

  /**
   * Plan the flight: choose the takeoff stride and the hold that clear every obstacle.
   *
   * @param archetype The source archetype name.
   * @param request The admitted jump.
   * @param plan The course plan.
   * @param species The ride's species.
   * @param trial Assemble the ride with moved landings, without a hold or with a flight's.
   * @returns The flight.
   * @throws {ArchetypeRefusal} When no canter stride on the leg can take off before the obstacle and land within the leg at constant speed.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the inputs and the refusal.
   * @evidence contracts/development/implementation.md#principled-implementation Each candidate stride's best takeoff spot and least flight come from `spotEquineTakeoff`; the least over all candidates is kept.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Build candidates, spot each, keep the shortest flight.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A candidate whose body already overlaps an obstacle at takeoff, or that lands past the leg, is discarded, never adjusted.
   * @evidence contracts/development/implementation.md#efficient-algorithms One trial assembly, then `spotEquineTakeoff` once per candidate stride.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The trial assembly is the ride's own.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns one record.
   */
  export function plan(
    archetype: string,
    request: IRequest,
    plan: ArchetypeCourse.IPlan,
    trial: (
      moved: readonly QuadrupedStridePlan.IMoved[],
      flight: IFlight | undefined,
    ) => ITrial,
  ): IFlight {
    const first: ITrial = trial([], undefined);
    let best: ISpot | undefined;
    for (
      let n: number = 1;
      n + 2 <= first.strides.total &&
      first.strides.secondsAt(n) < plan.when(request.end);
      n++
    ) {
      const stride: QuadrupedStridePlan.IStride = first.strides.strideOf(n);
      if (
        !QuadrupedGait.LEADED.includes(stride.gait) ||
        [n - 1, n + 1, n + 2].some((k: number): boolean => {
          const other: QuadrupedStridePlan.IStride = first.strides.strideOf(k);
          return other.gait !== stride.gait || other.lead !== stride.lead;
        })
      )
        continue;
      const candidate: ICandidate | undefined = takeoff(first, n, stride);
      if (
        candidate === undefined ||
        plan.at(first.strides.secondsAt(candidate.approach)).distance <
          request.start
      )
        continue;
      const spot: ISpot | undefined = spotEquineTakeoff(
        request,
        plan,
        trial,
        candidate,
        stride.gait,
      );
      if (
        spot !== undefined &&
        (best === undefined || spot.seconds < best.seconds)
      )
        best = spot;
    }
    if (best === undefined || !(best.flight.hold.duration > 0))
      throw new ArchetypeRefusal({
        kind: "parameter",
        archetype,
        axis: `legs[${request.index}].equineFootwork`,
        value: request.obstacles,
        feasible: null,
        reason:
          "no canter stride on the leg takes off clear of the obstacle and lands within the leg at constant speed",
        fix: "Lengthen the approach at a constant canter and leave room to land.",
      });
    return best.flight;
  }

  /**
   * One candidate's best takeoff spot: its flight and that flight's seconds.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the two members.
   * @evidence contracts/development/design.md#principled-representation The planned flight and its seconds from final hind liftoff to first fore landing.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Returned by `spotEquineTakeoff` and compared by `plan`.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
   */
  export interface ISpot {
    /** The planned flight. */
    flight: IFlight;
    /** Its seconds from final hind liftoff to first fore landing. */
    seconds: number;
  }

  /**
   * One candidate takeoff stride's moved landings and event phases.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States each phase.
   * @evidence contracts/development/design.md#principled-representation Stride-plan phases and the moved landings.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Built by `plan` and read by `spotEquineTakeoff` and `leastEquineFlight`.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
   */
  export interface ICandidate {
    /** The moved landings. */
    moved: readonly QuadrupedStridePlan.IMoved[];
    /** Phase of final hind liftoff. */
    takeoff: number;
    /** Phase of the first fore landing. */
    landing: number;
    /** Phase the hold stands at. */
    hold: number;
    /** Phase of the approach cue. */
    approach: number;
    /** Phase of the recovery cue. */
    recovery: number;
    /** Phase the push-off begins. */
    push: number;
    /** Phase the landing is absorbed. */
    absorb: number;
  }

  /** The takeoff stride's moved landings and event phases, when its order permits a flight. */
  function takeoff(
    trial: ITrial,
    n: number,
    stride: QuadrupedStridePlan.IStride,
  ): ICandidate | undefined {
    const strides: QuadrupedStridePlan.IPlan = trial.strides;
    const lead: QuadrupedBody.Limb =
      stride.lead === "left" ? "leftFore" : "rightFore";
    const other: QuadrupedBody.Limb =
      stride.lead === "left" ? "rightFore" : "leftFore";
    const start: number = strides.landing(lead, n);
    const next = (limb: QuadrupedBody.Limb): number =>
      strides.latest(limb, start) + 1;
    const hinds: readonly QuadrupedBody.Limb[] = ["leftHind", "rightHind"];
    const [leading, trailing]: readonly QuadrupedBody.Limb[] = [...hinds].sort(
      (a: QuadrupedBody.Limb, b: QuadrupedBody.Limb): number =>
        strides.landing(a, next(a)) - strides.landing(b, next(b)),
    );
    const first: number = strides.landing(leading!, next(leading!));
    const timing: QuadrupedGait.ITiming = trial.clock.timing(
      stride.gait,
      strides.secondsAt(first),
    );
    const takeoff: number = first + GAP + (timing.hindDuty ?? timing.duty);
    const landing: number = takeoff + FORE;
    if (!(landing < strides.landing(lead, n + 1))) return undefined;
    return {
      moved: [
        { limb: trailing!, index: next(trailing!), phase: first + GAP },
        { limb: other, index: next(other), phase: landing },
      ],
      takeoff,
      landing,
      hold: takeoff + FORE / 2,
      approach: strides.landing(lead, n - 1),
      recovery: strides.landing(lead, n + 2),
      push: first + GAP,
      absorb: landing + timing.duty,
    };
  }
}
