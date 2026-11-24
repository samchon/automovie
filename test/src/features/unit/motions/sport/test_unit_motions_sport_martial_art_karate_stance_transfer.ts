import type {
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanMartialArt,
  IAutoMovieMotionHumanPosture,
  IAutoMoviePose,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  HumanPerformanceTempo,
  MartialArtStanceForms,
  martialArt,
  prepareHumanPostureProjection,
  resolveHumanPosture,
  stand,
} from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { humanFixtureBody } from "../../../internal/fixtures/humanFixtureBody";
import { motionActionContext } from "../../../internal/motionActionContext";
import { nclose } from "../../../internal/nclose";
import { vclose } from "../../../internal/vclose";

/** The hold between the transfers and the return, seconds: the forms' staged 0.24 s. */
const HOLD: number = 0.24;

/**
 * The karate stance transfer (`martialArt.plan`, `MartialArtStancePhrase`):
 * the lead foot steps out over the form's `step`, the weight shifts forward and
 * back over its two `shift`s, holds, and the foot steps back over `step`; the
 * rear foot is planted throughout and the lead from `ready` to `relax`; the
 * lead ankle lands `stride` statures ahead of the rear ankle, at its own width.
 *
 * The average man stands at the origin facing +Z, leading with the left foot,
 * entered as the performance enters its first action.
 *
 * Scenarios:
 *
 * 1. The form lasts `2 step + shift[0] + shift[1] + HOLD` s; the right foot
 *    plants throughout, the left from `step` to the end less `step`.
 * 2. Mid-hold the left leg's goal stands `stride · stature` ahead of the right
 *    ankle, at its own width.
 */
export async function test_unit_motions_sport_martial_art_karate_stance_transfer(): Promise<void> {
  // Whole body: the phrase lowers the stance over the full rig and places both
  // arms on goals it resolves.
  const body: IAutoMovieMotionHumanBody = await humanFixtureBody("m-average");
  // The entry as the performance resolves its first posture: the quiet
  // stance through the ROM-projected seeded resolve (`HumanSegmentPose.initial`).
  const posture: IAutoMovieMotionHumanPosture = stand.posture(
    body,
    { x: 0, y: 0, z: 0 },
    0,
  );
  const pose: IAutoMoviePose = resolveHumanPosture.seeded(
    body,
    posture,
    undefined,
    undefined,
    undefined,
    undefined,
    prepareHumanPostureProjection(body),
  ).pose;
  const entered: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanMartialArt.IParams> =
    motionActionContext(
      body,
      { kind: "karateStanceTransfer", hold: HOLD, lead: "left" },
      { posture, pose, handover: { last: new Map() } },
    );
  // Planned as the performance plans an action (`HumanPerformanceTempo`): its
  // arm groups in the handover's scope, and slowed where a hand would pass the
  // speed bound.
  const plan: IAutoMovieMotionHumanActionPlan = HumanPerformanceTempo.plan(
    martialArt,
    entered,
  );
  const form: MartialArtStanceForms.IForm =
    MartialArtStanceForms.FORM.karateStanceTransfer;
  const duration: number = 2 * form.step + form.shift[0] + form.shift[1] + HOLD;
  const window = (part: string): IAutoMovieMotionHumanContactWindow =>
    plan.contacts.find(
      (w: IAutoMovieMotionHumanContactWindow): boolean => w.part === part,
    )!;
  TestValidator.predicate(
    "the phrase and its plants",
    nclose(plan.duration, duration, 1e-9) &&
      window("rightFoot").from === 0 &&
      window("rightFoot").to === 1 &&
      nclose(window("leftFoot").from * duration, form.step, 1e-9) &&
      nclose(window("leftFoot").to * duration, duration - form.step, 1e-9),
  );
  const rear: IAutoMovieVector3 = entered.entry.feet.right.ankle;
  const own: IAutoMovieVector3 = entered.entry.feet.left.ankle;
  TestValidator.predicate(
    "the lead foot's landing",
    vclose(
      plan.posture(duration - form.step - HOLD / 2).limbs.leftLeg!.point,
      {
        x: own.x,
        y: own.y,
        z: Math.max(own.z - rear.z, form.stride * body.measure.stature) + rear.z,
      },
      1e-6,
    ),
  );
}
