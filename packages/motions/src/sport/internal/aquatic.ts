import type {
  AutoMovieMotionHumanActionKey,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanAquatic,
} from "@automovie/interface";

import { HumanBound } from "../../law/HumanBound";
import { AquaticDistress } from "../AquaticDistress";
import { AquaticDive } from "../AquaticDive";
import { AquaticEdgeExit } from "../AquaticEdgeExit";
import { AquaticExit } from "../AquaticExit";
import { AquaticFin } from "../AquaticFin";
import { AquaticLiftOut } from "../AquaticLiftOut";
import { AquaticPaddle } from "../AquaticPaddle";
import { AquaticPolo } from "../AquaticPolo";
import { AquaticPool } from "../AquaticPool";
import { AquaticRescue } from "../AquaticRescue";
import { AquaticSail } from "../AquaticSail";
import { AquaticScull } from "../AquaticScull";
import { AquaticTeam } from "../AquaticTeam";

/**
 * Sequences in a pool or on a small craft. The planner owns the actor's clock;
 * every moving hull or grip is sampled from the performance at that same
 * second.
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
        return AquaticDive.dive(context, water);
      case "waterPolo":
        return AquaticPolo.plan(context, water);
      case "artisticSwim":
        return AquaticTeam.artistic(context, water);
      case "doubleScull":
        return context.params.station === undefined
          ? AquaticPaddle.plan(context, context.params.kind)
          : AquaticScull.plan(context, context.params.station);
      case "canoeStroke":
      case "kayakStroke":
        return AquaticPaddle.plan(context, context.params.kind);
      case "sailTack":
      case "sailAbort":
        return AquaticSail.plan(context, context.params.kind === "sailAbort");
      case "waterExit":
        return AquaticExit.plan(context, water);
      case "distress":
        return AquaticDistress.plan(context, water);
      case "rescueTow":
        return AquaticRescue.rescuer(context, water);
      case "towed":
        return AquaticRescue.towed(context, water);
      case "edgeExit":
        return AquaticEdgeExit.plan(context, water);
      case "liftOut":
        return AquaticLiftOut.rescuer(context, water);
      case "liftedOut":
        return AquaticLiftOut.lifted(context, water);
      case "finSwim":
      case "duckDive":
      case "snorkel":
        return AquaticFin.plan(context, water, context.params.kind);
    }
  }
}
