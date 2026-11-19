import type {
  AutoMovieMotionHumanActionKey,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanAquatic,
} from "@automovie/interface";

import { HumanBound } from "../law/HumanBound";
import { AquaticCrew } from "./AquaticCrew";
import { AquaticPool } from "./AquaticPool";
import { AquaticTeam } from "./AquaticTeam";

/**
 * Sequences in a pool or on a small craft. The planner owns the actor's clock;
 * every moving hull or grip is sampled from the performance at that same second.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the motion families and the relationship between actor and prop clocks.
 * @evidence contracts/development/design.md#principled-representation Pool, team and small-craft branches own their distinct support and outcome rules.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The single law dispatches the typed kinds into the selected planner.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Existing swimming and prop readers remain their respective owners.
 */
export namespace aquatic {
  /** The registered action key. */
  export const name: AutoMovieMotionHumanActionKey = "aquatic";

  /** Only the recovered ending is an authored interruption window. */
  export const interrupts: IAutoMovieMotionHumanActionLaw["interrupts"] = {
    any: [{ window: ["relax", 1], kind: "inertialize", entry: 0 }],
  };

  /** Plan the selected aquatic sequence from the entered body and scene. */
  export function plan(
    context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanAquatic.IParams>,
  ): IAutoMovieMotionHumanActionPlan {
    const water: number = context.params.water ?? 0;
    HumanBound.within("phase", context.params.phase ?? 0, 0, 1);
    switch (context.params.kind) {
      case "crawlStartTurn":
      case "breaststrokeStartTurn":
        return AquaticPool.race(context, water, context.params.kind);
      case "springboardDive":
        return AquaticPool.dive(context, water);
      case "waterPolo":
        return AquaticTeam.polo(context, water);
      case "artisticSwim":
        return AquaticTeam.artistic(context, water);
      case "doubleScull":
      case "canoeStroke":
      case "kayakStroke":
      case "sailTack":
      case "sailAbort":
        return AquaticCrew.plan(context, context.params.kind);
    }
  }
}
