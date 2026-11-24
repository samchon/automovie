import type {
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanMartialArt,
  IAutoMovieVector3,
} from "@automovie/interface";
import { MartialArtStanceForms, martialArt } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { humanFixtureBody } from "../../../internal/fixtures/humanFixtureBody";
import { motionActionContext } from "../../../internal/motionActionContext";
import { nclose } from "../../../internal/nclose";
import { vclose } from "../../../internal/vclose";

/** The hold between the transfers and the return, seconds: the forms' staged 0.24 s. */
const HOLD: number = 0.24;

/** The forward-stepping solo forms. */
const KINDS: MartialArtStanceForms.Kind[] = [
  "karateStanceTransfer",
  "taekwondoStanceReset",
  "muayThaiStanceReset",
  "taiChiTransfer",
];

/**
 * `MartialArtStancePhrase` (through `martialArt.plan`) steps the lead foot out
 * over the form's `step`, shifts the weight forward and back over its two
 * `shift`s, holds, and steps back over `step`: the rear foot planted
 * throughout, the lead planted from `ready` to `relax`. A forward form's lead
 * ankle lands `stride` statures ahead of the rear ankle along the heading, at
 * its own width.
 *
 * The average man stands at the origin facing +Z; each form is held `HOLD`.
 *
 * Scenarios:
 *
 * 1. Each form lasts `2 step + shift[0] + shift[1] + HOLD` s, the rear foot
 *    planted throughout and the lead from `step` to the end less `step`.
 * 2. Mid-hold the lead leg's goal stands `stride · stature` ahead of the rear
 *    ankle, at the lead's own width.
 * 3. Led by the right foot, the left stays and the right steps.
 */
export async function test_unit_motions_sport_martial_art_stance_phrase(): Promise<void> {
  // Whole body: the phrase lowers the stance over the full rig and places both
  // arms on goals it resolves.
  const body: IAutoMovieMotionHumanBody = await humanFixtureBody("m-average");
  const context = (
    params: IAutoMovieMotionHumanMartialArt.IParams,
  ): IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanMartialArt.IParams> =>
    motionActionContext(body, params);
  const reads = (
    kind: MartialArtStanceForms.Kind,
    lead: "left" | "right",
  ): boolean => {
    const entered: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanMartialArt.IParams> =
      context({ kind, hold: HOLD, lead });
    const plan: IAutoMovieMotionHumanActionPlan = martialArt.plan(entered);
    const form: MartialArtStanceForms.IForm = MartialArtStanceForms.FORM[kind];
    const duration: number =
      2 * form.step + form.shift[0] + form.shift[1] + HOLD;
    const rear: "left" | "right" = lead === "left" ? "right" : "left";
    const window = (
      part: string,
    ): IAutoMovieMotionHumanContactWindow | undefined =>
      plan.contacts.find(
        (w: IAutoMovieMotionHumanContactWindow): boolean => w.part === part,
      );
    const from: IAutoMovieVector3 = entered.entry.feet[rear].ankle;
    const own: IAutoMovieVector3 = entered.entry.feet[lead].ankle;
    const landed: IAutoMovieVector3 = {
      x: own.x,
      y: own.y,
      z: Math.max(own.z - from.z, form.stride * body.measure.stature) + from.z,
    };
    const mid: number = duration - form.step - HOLD / 2;
    return (
      nclose(plan.duration, duration, 1e-9) &&
      window(`${rear}Foot`)!.from === 0 &&
      window(`${rear}Foot`)!.to === 1 &&
      nclose(window(`${lead}Foot`)!.from * duration, form.step, 1e-9) &&
      nclose(
        window(`${lead}Foot`)!.to * duration,
        duration - form.step,
        1e-9,
      ) &&
      vclose(plan.posture(mid).limbs[`${lead}Leg`]!.point, landed, 1e-6)
    );
  };
  TestValidator.predicate(
    "each form's phrase and landing",
    KINDS.every(
      (kind: MartialArtStanceForms.Kind): boolean => reads(kind, "left"),
    ),
  );
  TestValidator.predicate(
    "mirrored by the lead",
    reads("karateStanceTransfer", "right"),
  );
}
