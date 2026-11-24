import { Vector3 } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanSegment,
} from "@automovie/interface";
import { HumanPerformance } from "@automovie/motions";

import { everydayTake } from "../../../features/internal/everydayTake";
import { motionComplaints } from "../../../features/internal/motionComplaints";
import { motionHumanBody } from "../../../features/internal/motionHumanBody";
import { wardrobeFilm } from "../../../features/internal/wardrobeFilm";
import { coatPartnerScene } from "../../internal/coatPartnerScene";
import { motionActionUnit } from "../../internal/motionActionUnit";

/** Two instants read two ways agree within this, seconds: the original's. */
const SAME: number = 1e-9;

/**
 * The dresser holds the jacket open at the partner's collar and lets go as it
 * is worn, on its own: the coatPartner of
 * `test_motion_get_dressed_coat_partner`, the original's four cases (the
 * average man coating the small woman and the reverse, with either holding
 * hand), entered by the minimal chain stand > pickUp for the dresser and stand
 * > sleeveIn > sleeveIn for the partner (the coat is held for the partner's
 * threading; the partner's walk off after it is left out).
 *
 * Scenarios:
 *
 * 1. The jacket is held still while the partner threads: it moves at most the
 *    original's 2 mm from the first threading's start to the last sleeve's
 *    `sleeveClear`.
 * 2. The dresser's grip on the jacket ends as the jacket is worn: the grip
 *    window's end is the coat's `jacketWorn`.
 * 3. At `jacketWorn` the jacket's `wear` socket rests on the partner's collar,
 *    within `wardrobe`'s 10 mm reach tolerance.
 * 4. The coat keeps the shipped bounds over its own span.
 *
 * Decomposes the original's hold, grip and collar checks, read here on a coat
 * whose partner does not walk off after it.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the original, its step and checks, the entry, the cases and every bound.
 * @evidence contracts/development/testing.md#behavioral-verification Performs the dresser's stand > pickUp > coatPartner with the partner's stand > sleeveIn > sleeveIn and reads the displayed jacket, the coat's grip window and the partner's displayed shoulders, with the verdict report over the coat's span; a jacket moving under the threading hands, a grip outlasting or ending before the wear, a collar off the shoulders or a finding in the coat fails.
 * @evidence contracts/development/testing.md#independent-expectations The still and collar bounds are the original's (the collar is `wardrobe`'s own seat); the hand-over is the coat contract's (`IAutoMovieMotionHumanCoatPartner`: the dresser lets go and the jacket is worn).
 * @evidence contracts/development/testing.md#distinguishing-cases Two body pairs, both holding hands; the partner's threading is `test_motion_get_dressed_coat_partner_sleeve_in`'s.
 * @evidence contracts/development/testing.md#execution-ownership In-memory two-performer performances through the public chain, entered through `test_motion_get_dressed_coat_partner_hold`.
 */
export function test_motion_get_dressed_coat_partner_hold(): void {
  const checks: motionComplaints.IGatherer = motionComplaints();
  for (const c of coatPartnerScene.CASES)
    try {
      hold(checks, c);
    } catch (error: unknown) {
      checks.check(`${c.label}: ${everydayTake.describe(error)}`, false);
    }
  checks.assert("the jacket is held open at the collar and let go as worn");
}

/** One case's coat and its checks. */
function hold(
  checks: motionComplaints.IGatherer,
  c: coatPartnerScene.ICase,
): void {
  const model: coatPartnerScene.JacketModel = coatPartnerScene.jacket();
  const film: HumanPerformance = coatPartnerScene.stage(
    motionHumanBody(c.dresser),
    motionHumanBody(c.dressed),
    model,
    c.hand,
    "b",
    coatPartnerScene.HOLD,
    "none",
  );
  const coat: IAutoMovieMotionHumanSegment = coatPartnerScene.coat(film);
  const worn: number = wardrobeFilm.mark(coat, "jacketWorn");
  const sleeves: IAutoMovieMotionHumanSegment[] =
    coatPartnerScene.sleeves(film);
  if (sleeves.length === 2) {
    const first: number = sleeves[0]!.start;
    const last: number = wardrobeFilm.mark(sleeves[1]!, "sleeveClear");
    const still: number = Vector3.distance(
      film.prop("jacket", first).position,
      film.prop("jacket", last).position,
    );
    checks.check(
      `${c.label}: the jacket is held still while the partner threads (${(still * 1000).toFixed(1)} mm)`,
      still <= coatPartnerScene.STILL,
    );
  } else
    checks.check(
      `${c.label}: the partner threads two sleeves to hold the jacket for (${sleeves.length})`,
      false,
    );
  const grip: IAutoMovieMotionHumanContactWindow | undefined =
    coat.plan.contacts.find(
      (window: IAutoMovieMotionHumanContactWindow): boolean =>
        window.kind === "grip" &&
        window.support.kind === "prop" &&
        window.support.subject === "jacket",
    );
  checks.check(
    `${c.label}: the grip ends as the jacket is worn`,
    grip !== undefined &&
      Math.abs(coat.start + grip.to * coat.plan.duration - worn) <= SAME,
  );
  const seat: number = Vector3.distance(
    coatPartnerScene.socket(
      film.prop("jacket", worn),
      model.affordance("wear"),
    ),
    coatPartnerScene.collar(film, worn),
  );
  checks.check(
    `${c.label}: the collar rests on the shoulders (${(seat * 1000).toFixed(1)} mm)`,
    seat <= coatPartnerScene.MISS,
  );
  motionActionUnit.bounds(checks, c.label, film, "a", coat);
}
