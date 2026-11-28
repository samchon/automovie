import type {
  AutoMovieMotionHumanActionKey,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanAquatic,
} from "@automovie/interface";

import { HumanBound } from "../../law/internal/HumanBound";
import { AquaticDistress } from "./AquaticDistress";
import { AquaticDive } from "./AquaticDive";
import { AquaticEdgeExit } from "./AquaticEdgeExit";
import { AquaticExit } from "./AquaticExit";
import { AquaticFin } from "./AquaticFin";
import { AquaticLiftOut } from "./AquaticLiftOut";
import { AquaticPaddle } from "./AquaticPaddle";
import { AquaticPolo } from "./AquaticPolo";
import { AquaticPool } from "./AquaticPool";
import { AquaticRescue } from "./AquaticRescue";
import { AquaticSail } from "./AquaticSail";
import { AquaticScull } from "./AquaticScull";
import { AquaticTeam } from "./AquaticTeam";

/**
 * Plans aquatic sequences with performer and prop reads on the film clock.
 */
export namespace aquatic {
  /**
   * Registered action key for the aquatic chain and performance.
   */
  export const name: AutoMovieMotionHumanActionKey = "aquatic";

  /**
   * Inertialize when leaving from `relax` through the end of the planned action.
   *
   * A motion without a `relax` cue cannot open this interruption window.
   */
  export const interrupts: IAutoMovieMotionHumanActionLaw["interrupts"] = {
    any: [
      { window: { start: "relax", end: 1 }, kind: "inertialize", entry: 0 },
    ],
  };

  /**
   * Plan a pool, paired rescue, swimming, or small-craft sequence.
   *
   * The action uses elapsed seconds from its scheduled start. Named performer
   * and prop reads use the matching film seconds. `water` is the horizontal
   * world height in metres and defaults to zero. An omitted `phase` starts
   * at zero. The range for an authored phase is [0, 1].
   *
   * A rescuer and the towed performer name each other in `partner` and the
   * same world destination in `at`. A direct deck exit uses the `edge` on
   * the named support and its material `deckFace` when available. Fin actions
   * require the named prop's `blade` width and depth.
   *
   * @param context Entered pose, body, film start, parameters, and scene readers.
   * @returns The sequence's duration, posture reader, cues and contact data.
   * @throws {AutoMovieMotionHumanRefusal} For an out-of-range phase or
   *   a branch-specific staging, contact, or reach refusal.
   */
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
