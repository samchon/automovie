import type {
  IAutoMovieMotionEvent,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanBody,
} from "@automovie/interface";
import { martialArt } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { humanFixtureBody } from "../../../internal/fixtures/humanFixtureBody";
import { motionActionContext } from "../../../internal/motionActionContext";

export async function test_unit_motions_sport_martial_art_plan_karate(): Promise<void> {
  // Whole body: the form places both legs and arms on goals the full rig
  // resolves.
  const body: IAutoMovieMotionHumanBody = await humanFixtureBody("m-average");
  let text: string = "";
  try {
    const plan: IAutoMovieMotionHumanActionPlan = martialArt.plan(
      motionActionContext(body, { kind: "karateStanceTransfer", hold: 0.24 }),
    );
    plan.prepare?.();
    text = plan.events.map((e: IAutoMovieMotionEvent): string => `${e.name}@${e.seconds}`).join(" ") + ` d=${plan.duration}`;
    for (let s: number = 0; s <= plan.duration; s += 0.02) plan.posture(s);
    text += " ok";
  } catch (error) {
    text += ` ERR ${String(error)}`;
  }
  TestValidator.predicate(text, false);
}