import type {
  AutoMovieHumanSide,
  IAutoMovieAffordance,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanSegment,
  IAutoMovieVector3,
} from "@automovie/interface";
import { HumanPerformance } from "@automovie/motions";
import { HumanHand } from "@automovie/motions/internal";

import { everydayTake } from "../../../features/internal/everydayTake";
import { motionComplaints } from "../../../features/internal/motionComplaints";
import { motionHumanBody } from "../../../features/internal/motionHumanBody";
import { wardrobeFilm } from "../../../features/internal/wardrobeFilm";
import { coatPartnerScene } from "../../internal/coatPartnerScene";
import { motionActionUnit } from "../../internal/motionActionUnit";

/**
 * The partner threads both arms into the held-open jacket, on its own: the two
 * sleeveIn actions of `test_motion_get_dressed_coat_partner`, the original's
 * four cases, entered by the minimal chain stand > pickUp > coatPartner for the
 * dresser and stand for the partner (the threading reads the jacket where the
 * dresser holds it; the partner's walk off after it is left out).
 *
 * Scenarios:
 *
 * 1. Both sleeves are threaded: the partner plays two actions with a `sleeveReady`
 *    event.
 * 2. The threading lies inside the held span: from the coat's `collarReady` to its
 *    `jacketWorn`.
 * 3. Each hand passes through its own sleeve opening: in the opening's frame the
 *    grip lies at least 20 mm in front of it at `sleeveReady` and at least 50
 *    mm past it at `sleeveClear`, within the opening's width and height at
 *    both, the wardrobe specification's passage.
 * 4. Each sleeveIn keeps the shipped bounds over its own span.
 *
 * Decomposes the original's threading checks.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the original, its steps and checks, the entry, the cases and every bound.
 * @evidence contracts/development/testing.md#behavioral-verification Performs the partner's stand > sleeveIn > sleeveIn beside the dresser's coat and reads the partner's displayed grips in each sleeve opening's frame and the coat's events, with the verdict report over each sleeveIn's span; a sleeve not threaded, a threading outside the hold, a hand missing its opening or a finding in a sleeveIn fails.
 * @evidence contracts/development/testing.md#independent-expectations The passage and its 20 and 50 mm bounds are the original's, from the wardrobe specification; the opening's width and height are the archetype's.
 * @evidence contracts/development/testing.md#distinguishing-cases Two body pairs, both holding hands, both sleeves; the dresser's hold is `test_motion_get_dressed_coat_partner_hold`'s.
 * @evidence contracts/development/testing.md#execution-ownership In-memory two-performer performances through the public chain, entered through `test_motion_get_dressed_coat_partner_sleeve_in`.
 */
export function test_motion_get_dressed_coat_partner_sleeve_in(): void {
  const checks: motionComplaints.IGatherer = motionComplaints();
  for (const c of coatPartnerScene.CASES)
    try {
      thread(checks, c);
    } catch (error: unknown) {
      checks.check(`${c.label}: ${everydayTake.describe(error)}`, false);
    }
  checks.assert("the partner threads both arms through the held jacket");
}

/** One case's threading and its checks. */
function thread(
  checks: motionComplaints.IGatherer,
  c: coatPartnerScene.ICase,
): void {
  const b: IAutoMovieMotionHumanBody = motionHumanBody(c.dressed);
  const model: coatPartnerScene.JacketModel = coatPartnerScene.jacket();
  const film: HumanPerformance = coatPartnerScene.stage(
    motionHumanBody(c.dresser),
    b,
    model,
    c.hand,
    "b",
    coatPartnerScene.HOLD,
    "none",
  );
  const coat: IAutoMovieMotionHumanSegment = coatPartnerScene.coat(film);
  const sleeves: IAutoMovieMotionHumanSegment[] =
    coatPartnerScene.sleeves(film);
  checks.check(
    `${c.label}: both sleeves are threaded (${sleeves.length})`,
    sleeves.length === 2,
  );
  if (sleeves.length !== 2) return;
  const first: number = sleeves[0]!.start;
  const last: number = wardrobeFilm.mark(sleeves[1]!, "sleeveClear");
  checks.check(
    `${c.label}: the threading lies inside the held span`,
    first >= wardrobeFilm.mark(coat, "collarReady") &&
      last <= wardrobeFilm.mark(coat, "jacketWorn"),
  );
  (["left", "right"] as const).forEach(
    (side: AutoMovieHumanSide, index: number): void => {
      const span: IAutoMovieMotionHumanSegment = sleeves[index]!;
      const site: IAutoMovieAffordance = model.affordance(
        side === "left" ? "leftSleeveOpening" : "rightSleeveOpening",
      );
      const read: (t: number) => IAutoMovieVector3 = (
        t: number,
      ): IAutoMovieVector3 =>
        wardrobeFilm.localSite(
          film.prop("jacket", t),
          site,
          HumanHand.frame(b, film.bones("b", t), side, "grip").point,
        );
      const from: IAutoMovieVector3 = read(
        wardrobeFilm.mark(span, "sleeveReady"),
      );
      const to: IAutoMovieVector3 = read(
        wardrobeFilm.mark(span, "sleeveClear"),
      );
      checks.check(
        `${c.label}: the ${side} hand passes through its sleeve ${JSON.stringify({ from, to })}`,
        from.z > coatPartnerScene.ENTER &&
          to.z < -coatPartnerScene.CLEAR &&
          [from, to].every(
            (p: IAutoMovieVector3): boolean =>
              Math.abs(p.x) < site.width! / 2 && p.y > 0 && p.y < site.height!,
          ),
      );
      motionActionUnit.bounds(checks, c.label, film, "b", span);
    },
  );
}
