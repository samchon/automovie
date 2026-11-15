import { HUMAN_ATTRIBUTE_EFFECTS } from "../ensemble/HUMAN_ATTRIBUTE_EFFECTS";
import { HumanAttribute } from "../ensemble/HumanAttribute";
import type { IHumanFormation } from "../ensemble/IHumanFormation";
import type { IHumanActionContext } from "../law/IHumanActionContext";
import type { IHumanActionPlan } from "../law/IHumanActionPlan";
import { HumanSkill } from "../skill/HumanSkill";
import type { IWalkGait } from "./IWalkGait";
import type { IWalkParams } from "./IWalkParams";
import { walkCadence } from "./walkCadence";
import { walkStation } from "./walkStation";
import { walkTempo } from "./walkTempo";

/**
 * A stepping plan's timing, the last step of `walk.locomote`: the steps
 * taken a little unevenly in time, or entrained to a beat track when the
 * walker locks to one, and kept on a moving station by speed matching when
 * the gait draws its own tempo.
 *
 * A stride time varies by 3 % in a novice down to 1 % in an expert (the 1
 * to 3 % of healthy adults, Hausdorff; the mapping onto skill is
 * provisional), which each step's own draw carries as the square root of two
 * times that, two independent steps making a stride (`walkTempo`). On a beat
 * track a locked walker lands each strike by its phase correction toward its
 * beat (`walkCadence`, `walkTempo.entrained`). A cadenced gait keeps its
 * count; any other keeps its station by matching the slot's speed
 * (`walkStation`).
 *
 * @param context The walk's context, its station resolved.
 * @param planned The stepping plan on its own clock.
 * @param gait The gait.
 * @returns The plan on its film clock.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the three timings, their sources and when each applies.
 * @evidence contracts/development/implementation.md#principled-implementation A time warp of the plan's own clock in each case, so footprints and path stay the plan's: Wing and Kristofferson's timing variability, the linear phase-correction model and first-order speed matching.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure The beat or the drawn tempo first, then the station, each one call of its owner; split from `walk` by responsibility.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The variability's mapping onto skill is named provisional; no step is snapped onto a beat or a slot.
 * @evidence contracts/development/implementation.md#efficient-algorithms Linear in the plan's strikes, plus the station's readings when it has one.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each owner builds its warp once per plan.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The returned plan holds its warps for as long as it is held.
 */
export function walkClock(
  context: IHumanActionContext<Omit<IWalkParams, "pace">>,
  planned: IHumanActionPlan,
  gait: IWalkGait,
): IHumanActionPlan {
  const entrained: number[] | null =
    context.params.cadence === undefined
      ? null
      : walkCadence.strikes(
          context,
          context.params.cadence,
          walkTempo.strikes(planned),
        );
  const tempo: IHumanActionPlan =
    entrained !== null
      ? walkTempo.entrained(
          planned,
          entrained.map((s: number): number => s - context.start),
        )
      : walkTempo(
          planned,
          (index: number): number =>
            Math.SQRT2 *
            HumanSkill.quantity(context.skill, "timing", 0.03, 0.01) *
            (gait.unevenness ?? 1) *
            HumanSkill.normal(context.random("stride"), 2 * index),
          gait.limp,
        );

  // A gait that draws its own tempo keeps its station by matching the slot's speed; a cadenced one keeps its count.
  const station: IHumanFormation.IStation | undefined = context.params.station;
  return station === undefined || gait.called === true
    ? tempo
    : walkStation(
        tempo,
        walkStation.point(context, station),
        context.start,
        walkStation.rests(context, station),
      );
}

/**
 * Companions of {@link walkClock}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what the member reads.
 * @evidence contracts/development/design.md#principled-representation A factor on the speed, from the attribute table.
 * @evidence contracts/development/design.md#minimal-and-owned-surface `weary`, which `walk.locomote` reads.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The factor's values are the table's, not restated.
 */
export namespace walkClock {
  /**
   * The factor a member's fatigue puts on a walk's speed
   * (`HUMAN_ATTRIBUTE_EFFECTS.fatigue.pace`, fresh when absent): 1 for a
   * cadenced gait, which keeps its count, so only a gait that draws its own
   * tempo slows.
   *
   * @param context The walk's context.
   * @param gait The gait.
   * @returns The factor.
   */
  export function weary(context: IHumanActionContext, gait: IWalkGait): number {
    return gait.called === true
      ? 1
      : HumanAttribute.effect(
          HUMAN_ATTRIBUTE_EFFECTS.fatigue.pace,
          context.attributes?.fatigue,
          0,
        );
  }
}