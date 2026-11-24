import type {
  IAutoMovieMotionEvent,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanAquatic,
  IAutoMovieMotionHumanBody,
} from "@automovie/interface";
import { HumanRefusal, aquatic } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { humanFixtureBody } from "../../../internal/fixtures/humanFixtureBody";
import { motionActionContext } from "../../../internal/motionActionContext";
import { nclose } from "../../../internal/nclose";

/**
 * `aquatic.plan` dispatches a water action to its family's plan, each of which
 * first admits its scene: a small craft its moving hull, a rescue its partner,
 * an exit or a lift its pool edge, fin swimming its worn fin, and a start or a
 * dive a block or board above the water.
 *
 * The average man stands at the origin with nothing else in the scene.
 *
 * Scenarios:
 *
 * 1. Distress struggles for its `duration`, within Pia's 20 to 60 s (1974), then
 *    sinks for 2 s: asked 24 s it lasts 26, submerging at 24; asked 10 s it is
 *    refused.
 * 2. An artistic figure's `phase` lags its figure by 0.35 s per unit: at phase 1
 *    the support scull comes 0.35 s later than at phase 0.
 * 3. A scull, a rescue, an edge exit, a fin swim and a pool start each refuse a
 *    scene without what they read, on that parameter.
 * 4. A phase outside [0, 1] is refused.
 */
export async function test_unit_motions_sport_aquatic_plan(): Promise<void> {
  // Whole body: each family resolves its keyed shapes over the full rig.
  const body: IAutoMovieMotionHumanBody = await humanFixtureBody("m-average");
  const plan = (
    params: IAutoMovieMotionHumanAquatic.IParams,
  ): IAutoMovieMotionHumanActionPlan =>
    aquatic.plan(motionActionContext(body, params));
  const second = (p: IAutoMovieMotionHumanActionPlan, name: string): number =>
    p.duration *
    p.events.find((e: IAutoMovieMotionEvent): boolean => e.name === name)!
      .share;
  const refused = (params: IAutoMovieMotionHumanAquatic.IParams): string => {
    try {
      plan(params);
    } catch (error) {
      if (error instanceof HumanRefusal) return error.axis;
      throw error;
    }
    return "admitted";
  };

  // 1. Distress.
  const distress: IAutoMovieMotionHumanActionPlan = plan({
    kind: "distress",
    duration: 24,
  });
  TestValidator.predicate(
    "the struggle and the sink",
    nclose(distress.duration, 26, 1e-9) &&
      nclose(second(distress, "submerge"), 24, 1e-9),
  );

  // 2. The artistic lag.
  TestValidator.predicate(
    "the figure's phase lag",
    nclose(
      second(plan({ kind: "artisticSwim", phase: 1 }), "supportScull") -
        second(plan({ kind: "artisticSwim", phase: 0 }), "supportScull"),
      0.35,
      1e-9,
    ),
  );

  // 3. and 4. Scenes refused.
  TestValidator.equals(
    "each family's scene",
    [
      refused({ kind: "doubleScull", station: "bow" }),
      refused({ kind: "kayakStroke" }),
      refused({ kind: "rescueTow" }),
      refused({ kind: "edgeExit" }),
      refused({ kind: "finSwim" }),
      refused({ kind: "crawlStartTurn" }),
      refused({ kind: "distress", phase: 2 }),
      refused({ kind: "distress", duration: 10 }),
    ],
    [
      "support",
      "support",
      "partner",
      "support",
      "prop",
      "base",
      "phase",
      "seconds",
    ],
  );
}
