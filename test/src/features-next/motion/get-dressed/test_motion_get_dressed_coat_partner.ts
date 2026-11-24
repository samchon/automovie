import { Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieAffordance,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanSegment,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import { HumanPerformance, HumanRefusal } from "@automovie/motions";
import { HumanHand } from "@automovie/motions/internal";

import { assertTakeClean } from "../../../features/internal/assertTakeClean";
import { everydayTake } from "../../../features/internal/everydayTake";
import { motionComplaints } from "../../../features/internal/motionComplaints";
import { motionHumanBody } from "../../../features/internal/motionHumanBody";
import { wardrobeFilm } from "../../../features/internal/wardrobeFilm";
import { coatPartnerScene } from "../../internal/coatPartnerScene";

/** Two instants read two ways agree within this, seconds: the original's. */
const SAME: number = 1e-9;

/**
 * How long after the wear the worn frame is first read, seconds: the
 * original's.
 */
const SETTLE: number = 0.01;

/**
 * The shares of the film after the wear the worn jacket is read at: the
 * original's.
 */
const SHARES: readonly number[] = [0.5, 1];

/**
 * Helping a partner into a coat (#4015).
 *
 * Scenarios, the average man coating the small woman and the reverse, with
 * either holding hand, each take clean, each case and each check gathering its
 * own result so one failure hides no other:
 *
 * 1. The dresser holds the jacket still at the partner's collar while the
 *    partner's hands pass through both sleeve openings.
 * 2. The dresser's grip ends as the jacket is worn; its `wear` socket then lies on
 *    the partner's collar and it rides the partner's chest while the partner
 *    walks off.
 * 3. Naming the dresser as the partner, or a hold of no length, is refused on that
 *    axis, and the same coat with the partner and the hold of the takes above
 *    is not.
 *
 * The dresser's grasp of the jacket is `test_motion_action_pick_up`'s.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the cases, the bounds, the refusals and the goal another spec owns.
 * @evidence contracts/development/testing.md#behavioral-verification Reads the displayed jacket, the partner's hands in each sleeve opening's frame, the partner's shoulders and chest; a jacket moving under the threading hands, a hand missing an opening, a grip outlasting the wear, a collar off the shoulders or a jacket sliding on the chest fails.
 * @evidence contracts/development/testing.md#independent-expectations The sleeve passage is the wardrobe specification's; the collar is `wardrobe`'s own seat; custody passes without a gap, worn rigid within 1 mm.
 * @evidence contracts/development/testing.md#distinguishing-cases Two body pairs, both holding hands, two refusals against the valid coat.
 * @evidence contracts/development/testing.md#execution-ownership In-memory two-performer performances through the public chain.
 */
export function test_motion_get_dressed_coat_partner(): void {
  const checks: motionComplaints.IGatherer = motionComplaints();
  for (const c of coatPartnerScene.CASES)
    try {
      coat(checks, c);
    } catch (error: unknown) {
      checks.check(`${c.label}: ${everydayTake.describe(error)}`, false);
    }
  try {
    refusals(checks);
  } catch (error: unknown) {
    checks.check(`the refusal cases: ${everydayTake.describe(error)}`, false);
  }
  checks.assert("a partner is helped into a coat");
}

/** One case's coat and its checks. */
function coat(
  checks: motionComplaints.IGatherer,
  c: coatPartnerScene.ICase,
): void {
  const label: string = c.label;
  const b: IAutoMovieMotionHumanBody = motionHumanBody(c.dressed);
  const model: coatPartnerScene.JacketModel = coatPartnerScene.jacket();
  const film: HumanPerformance = coatPartnerScene.stage(
    motionHumanBody(c.dresser),
    b,
    model,
    c.hand,
    "b",
    coatPartnerScene.HOLD,
    "walkOff",
  );
  try {
    assertTakeClean(label, film);
  } catch (error: unknown) {
    checks.check(`${label}: ${everydayTake.describe(error)}`, false);
  }
  const segment: IAutoMovieMotionHumanSegment = coatPartnerScene.coat(film);
  const ready: number = wardrobeFilm.mark(segment, "collarReady");
  const worn: number = wardrobeFilm.mark(segment, "jacketWorn");
  const sleeves: IAutoMovieMotionHumanSegment[] =
    coatPartnerScene.sleeves(film);
  checks.check(
    `${label}: both sleeves are threaded (${sleeves.length})`,
    sleeves.length === 2,
  );
  if (sleeves.length === 2) {
    const first: number = sleeves[0]!.start;
    const last: number = wardrobeFilm.mark(sleeves[1]!, "sleeveClear");
    checks.check(
      `${label}: the threading lies inside the held span`,
      first >= ready && last <= worn,
    );
    const still: number = Vector3.distance(
      film.prop("jacket", first).position,
      film.prop("jacket", last).position,
    );
    checks.check(
      `${label}: the jacket is held still while the partner threads (${(still * 1000).toFixed(1)} mm)`,
      still <= coatPartnerScene.STILL,
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
          `${label}: the ${side} hand passes through its sleeve ${JSON.stringify({ from, to })}`,
          from.z > coatPartnerScene.ENTER &&
            to.z < -coatPartnerScene.CLEAR &&
            [from, to].every(
              (p: IAutoMovieVector3): boolean =>
                Math.abs(p.x) < site.width! / 2 &&
                p.y > 0 &&
                p.y < site.height!,
            ),
        );
      },
    );
  }
  const grip: IAutoMovieMotionHumanContactWindow | undefined =
    segment.plan.contacts.find(
      (window: IAutoMovieMotionHumanContactWindow): boolean =>
        window.kind === "grip" &&
        window.support.kind === "prop" &&
        window.support.subject === "jacket",
    );
  checks.check(
    `${label}: the grip ends as the jacket is worn`,
    grip !== undefined &&
      Math.abs(segment.start + grip.to * segment.plan.duration - worn) <= SAME,
  );
  const seat: number = Vector3.distance(
    coatPartnerScene.socket(
      film.prop("jacket", worn),
      model.affordance("wear"),
    ),
    coatPartnerScene.collar(film, worn),
  );
  checks.check(
    `${label}: the collar rests on the shoulders (${(seat * 1000).toFixed(1)} mm)`,
    seat <= coatPartnerScene.MISS,
  );
  const start: IAutoMovieRigidTransform = coatPartnerScene.chest(
    film,
    worn + SETTLE,
  );
  const drifts: readonly number[] = SHARES.map((share: number): number => {
    const t: number = worn + share * (film.duration - worn);
    return Vector3.distance(
      coatPartnerScene.chest(film, t).position,
      start.position,
    );
  });
  checks.check(
    `${label}: the jacket rides the partner's chest (${drifts.map((d: number): string => (d * 1000).toFixed(2)).join(", ")} mm)`,
    drifts.every((d: number): boolean => d <= coatPartnerScene.RIGID),
  );
}

/** The refusal cases on two average men, and the valid coat beside them. */
function refusals(checks: motionComplaints.IGatherer): void {
  const self: IAutoMovieMotionHumanBody = motionHumanBody("m-average");
  for (const [axis, partner, hold] of [
    ["partner", "a", coatPartnerScene.HOLD],
    ["hold", "b", 0],
  ] as const) {
    const refused: HumanRefusal | undefined = refusal(self, partner, hold);
    checks.check(
      `a coat with a bad ${axis} is refused on it (${describe(refused)})`,
      refused !== undefined && refused.axis === axis,
    );
  }
  const valid: HumanRefusal | undefined = refusal(
    self,
    "b",
    coatPartnerScene.HOLD,
  );
  checks.check(
    `the same coat of the partner b held ${coatPartnerScene.HOLD} s is not refused (${describe(valid)})`,
    valid === undefined,
  );
}

/** The refusal the coat with this partner and hold throws, if any. */
function refusal(
  self: IAutoMovieMotionHumanBody,
  partner: string,
  hold: number,
): HumanRefusal | undefined {
  return everydayTake.refusal(() =>
    coatPartnerScene
      .stage(
        self,
        self,
        coatPartnerScene.jacket(),
        "right",
        partner,
        hold,
        "walkOff",
      )
      .bones("a", 4),
  );
}

/** A refusal's axis and message, or that the build was admitted. */
function describe(refused: HumanRefusal | undefined): string {
  return refused === undefined
    ? "admitted"
    : `${refused.axis}: ${refused.message}`;
}
