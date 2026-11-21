import { AutoMovieGravity, Quaternion } from "@automovie/engine";
import type { IAutoMovieQuaternion } from "@automovie/interface";

import {
  type ArchetypeCourse,
  ArchetypeFrame,
  ArchetypeRefusal,
} from "../core";
import { EquineObstacle } from "./EquineObstacle";
import type { QuadrupedBody } from "./QuadrupedBody";
import type { QuadrupedFooting } from "./QuadrupedFooting";
import { QuadrupedGait } from "./QuadrupedGait";
import { QuadrupedRestFloor } from "./QuadrupedRestFloor";
import type { QuadrupedRideClock } from "./QuadrupedRideClock";
import type { QuadrupedStridePlan } from "./QuadrupedStridePlan";
import type { rideQuadruped } from "./rideQuadruped";

/** Rotations whose lowest Y reads a part's least X, greatest X, least Z and greatest Z. */
const SIDES: readonly IAutoMovieQuaternion[] = [
  Quaternion.fromAxisAngle({ x: 0, y: 0, z: 1 }, 90),
  Quaternion.fromAxisAngle({ x: 0, y: 0, z: 1 }, -90),
  Quaternion.fromAxisAngle({ x: 1, y: 0, z: 0 }, -90),
  Quaternion.fromAxisAngle({ x: 1, y: 0, z: 0 }, 90),
];

/**
 * One horse jump over the obstacles authored in the course's footing, and the scripted baulk that stops before them.
 *
 * The jump keeps the canter's own footfalls up to the takeoff stride. In that stride the trailing hind lands `GAP` of a stride after the first hind, so both hinds push off together, and the non-leading fore lands `FORE` after the final hind liftoff; between the two the hoof clock holds still (`QuadrupedRideClock.IHold`) while the body flies a ballistic arc at the course's constant ground speed. Every swing in that flight is carried with the body, so the limbs keep their mid-swing posture relative to the trunk. The flight's length is the least that lifts the actual displayed body, in that posture, over each rail and ditch by the authored clearance: the parabola is concave, so each part only needs the clearance at the two ends of its window over the obstacle, which gives the flight in closed form (`plan`). The canter stride whose takeoff needs the shortest flight is taken, and planEquineFlight then measures the flown body through the whole flight and lengthens it where the posture shifts from the held instant.
 *
 * Takeoff and landing do not resolve the push-off and the landing impact: the body's vertical velocity changes at final hind liftoff and at first fore landing, while its position is continuous.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the stride changes, the hold, the flight law, the selection rule and the unresolved push-off.
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
   * @evidence contracts/development/design.md#principled-representation The stride plan, its clock and a sampler of the displayed parts and placement, with the flight's arc once one is known.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Built by `rideQuadruped` for each candidate.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
   */
  export interface ITrial {
    /** The stride plan. */
    strides: QuadrupedStridePlan.IPlan;
    /** The clock it was built on. */
    clock: QuadrupedRideClock.IClock;
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
   * @param trial Assemble the ride with moved landings and no hold.
   * @returns The flight.
   * @throws {ArchetypeRefusal} When no canter stride on the leg can take off before the obstacle and land within the leg at constant speed.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the inputs and the refusal.
   * @evidence contracts/development/implementation.md#principled-implementation For a candidate stride, the body flies b(s) = g/(2v²)(s − s_T)(s_T + vT − s) over course distance s. A part whose lowest point is y and whose extent along the path is [z⁻, z⁺] overlaps an obstacle [a, b] of top h while the root is in [a − z⁺, b − z⁻], and needs b ≥ h + clearance − y there. The arc is concave, so each window end e needs vT ≥ (e − s_T) + 2v²R/(g(e − s_T)); the largest such T over parts, obstacles and ends is the least flight. Parts are read from the displayed model at the held phase, the posture the whole hold keeps.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Build candidates, measure each in closed form, keep the shortest flight.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A candidate whose body already overlaps an obstacle at takeoff, or that lands past the leg, is discarded, never adjusted.
   * @evidence contracts/development/implementation.md#efficient-algorithms One trial assembly and one model sample per candidate stride, then O(P·O) per candidate for P parts and O obstacles.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The trial assembly is the ride's own; the extents reuse the exact primitive floor reader.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns one record.
   */
  export function plan(
    archetype: string,
    request: IRequest,
    plan: ArchetypeCourse.IPlan,
    trial: (moved: readonly QuadrupedStridePlan.IMoved[]) => ITrial,
  ): IFlight {
    const first: ITrial = trial([]);
    let best: IBest | undefined;
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
      const measured: ITrial = trial(candidate.moved);
      const seconds: number | undefined = flight(measured, candidate);
      if (seconds === undefined) continue;
      if (best === undefined || seconds < best.seconds)
        best = {
          seconds,
          flight: {
            moved: candidate.moved,
            hold: {
              start: measured.strides.secondsAt(candidate.hold),
              duration:
                seconds -
                (measured.strides.secondsAt(candidate.landing) -
                  measured.strides.secondsAt(candidate.takeoff)),
            },
            phase: candidate.hold,
            takeoff: candidate.takeoff,
            landing: candidate.landing,
            approach: candidate.approach,
            recovery: candidate.recovery,
            push: candidate.push,
            absorb: candidate.absorb,
          },
        };
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

    /** The flight seconds that clear every obstacle from one candidate, if it can. */
    function flight(
      measured: ITrial,
      candidate: ICandidate,
    ): number | undefined {
      const lift: number = measured.strides.secondsAt(candidate.takeoff);
      const touch: number = measured.strides.secondsAt(candidate.landing);
      const state: ArchetypeCourse.IState = plan.at(lift);
      const v: number = state.speed;
      if (
        !(v > 0) ||
        [candidate.approach, candidate.recovery].some(
          (phase: number): boolean =>
            plan.at(measured.strides.secondsAt(phase)).speed !== v,
        )
      )
        return undefined;
      let least: number = touch - lift;
      for (const part of measured.sample(
        measured.strides.secondsAt(candidate.hold),
      ).parts) {
        if (
          part.geometry.type !== "primitive" ||
          part.geometry.shape.type === "plane"
        )
          continue;
        const low: number = QuadrupedRestFloor(part);
        const [, , rearmost, negatedForemost]: readonly number[] = SIDES.map(
          (rotation: IAutoMovieQuaternion): number =>
            QuadrupedRestFloor({
              ...part,
              transform: ArchetypeFrame.compose(
                {
                  rotation,
                  translation: { x: 0, y: 0, z: 0 },
                  scale: ArchetypeFrame.UNIT,
                },
                part.transform!,
              ),
            }),
        );
        for (const obstacle of request.obstacles) {
          const need: number = obstacle.top + request.clearance - low;
          // The root overlaps the obstacle from its start less the part's foremost model Z to its end less the rearmost.
          for (const end of [
            obstacle.from + negatedForemost!,
            obstacle.to - rearmost!,
          ]) {
            const ahead: number = end - state.distance;
            if (!(ahead > 0)) return undefined;
            least = Math.max(
              least,
              (ahead +
                (need > 0
                  ? (2 * v * v * need) / (AutoMovieGravity.STANDARD * ahead)
                  : 0)) /
                v,
            );
          }
        }
      }

      // After the hold every later event moves on by the held seconds at the same speed.
      const recovery: number =
        plan.at(measured.strides.secondsAt(candidate.recovery)).distance +
        v * (least - (touch - lift));
      return recovery <= request.end && plan.at(plan.when(recovery)).speed === v
        ? least
        : undefined;
    }
  }

  /** The shortest flight found so far and its plan. */
  interface IBest {
    /** The planned flight. */
    flight: IFlight;
    /** Its seconds from final hind liftoff to first fore landing. */
    seconds: number;
  }

  /** One candidate takeoff stride's moved landings and event phases. */
  interface ICandidate {
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
