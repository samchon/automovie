import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionEvent,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanSalto,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  poseBones,
  resolveHumanPosture,
  roundOff,
  salto,
} from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { humanFixtureBody } from "../../../internal/fixtures/humanFixtureBody";
import { motionActionContext } from "../../../internal/motionActionContext";
import { throwsError } from "../../../internal/throwsError";

/**
 * How near a salto's feet land to the authored landing, metres: the tumbling
 * line's landing bound, a foot's own length about the place asked.
 */
const LANDING: number = 0.1;

/**
 * `salto.plan` is a jump asked for whole somersaults: its flight turns the body
 * by the momentum its shape needs to land the turns asked, rising to `APEX`
 * (0.3) of the stature unless asked.
 *
 * The average man lands a round-off facing back along his line; from where it
 * ends he takes one back salto to a place 2.2 statures down the line.
 *
 * Scenarios:
 *
 * 1. The events run take-off, apex, touchdown, settled.
 * 2. The feet land within `LANDING` of the place asked.
 * 3. Turns rounding to none are refused.
 *
 * The somersault itself is the performance's flight pass, not the plan's, so
 * the inversion at the apex is not read here.
 */
export async function test_unit_motions_sport_salto_plan(): Promise<void> {
  // Whole body: the flight reads the full rig's mass model and resolves the
  // shapes over it.
  const body: IAutoMovieMotionHumanBody = await humanFixtureBody("m-average");
  const round: IAutoMovieMotionHumanActionPlan = roundOff.plan(
    motionActionContext(body, {}),
  );
  const to: IAutoMovieVector3 = { x: 0, y: 0, z: 2.2 * body.measure.stature };
  const plan = (
    params: IAutoMovieMotionHumanSalto.IParams,
  ): IAutoMovieMotionHumanActionPlan =>
    salto.plan(motionActionContext.after(body, round, params));
  const back: IAutoMovieMotionHumanActionPlan = plan({ to, way: "backward" });
  const at = (name: string): number =>
    back.duration *
    back.events.find((e: IAutoMovieMotionEvent): boolean => e.name === name)!
      .share;
  const bones = (
    seconds: number,
  ): Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =>
    poseBones(body, resolveHumanPosture(body, back.posture(seconds)));

  // 1. Events.
  TestValidator.predicate(
    "take-off, apex, touchdown, settled",
    at("takeoff") < at("apex") &&
      at("apex") < at("touchdown") &&
      at("touchdown") < at("settled"),
  );

  // 2. The landing.
  const landed: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = bones(
    back.duration,
  );
  const feet: IAutoMovieVector3 = {
    x:
      (landed.get("leftFoot")!.worldPosition.x +
        landed.get("rightFoot")!.worldPosition.x) /
      2,
    y: 0,
    z:
      (landed.get("leftFoot")!.worldPosition.z +
        landed.get("rightFoot")!.worldPosition.z) /
      2,
  };
  TestValidator.predicate(
    `landed at the place (${Math.hypot(feet.x - to.x, feet.z - to.z).toFixed(3)} m off)`,
    Math.hypot(feet.x - to.x, feet.z - to.z) <= LANDING,
  );

  // 3. Refusal.
  TestValidator.predicate(
    "no turn",
    throwsError(() => plan({ to, turns: 0 })),
  );
}
