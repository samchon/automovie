import { Vector3 } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanSegment,
  IAutoMovieRigidTransform,
} from "@automovie/interface";
import { HumanPerformance } from "@automovie/motions";

import { assertTakeClean } from "../../../features/internal/assertTakeClean";
import { everydayTake } from "../../../features/internal/everydayTake";
import { motionComplaints } from "../../../features/internal/motionComplaints";
import { motionHumanBody } from "../../../features/internal/motionHumanBody";
import { wardrobeFilm } from "../../../features/internal/wardrobeFilm";
import { coatPartnerScene } from "../../internal/coatPartnerScene";

/** The shares of the film after the wear the worn jacket is read at. */
const SHARES: readonly number[] = [0.5, 1];

/** How long after the wear the worn frame is first read, seconds. */
const SETTLE: number = 0.01;

/**
 * Helping a partner into a coat (#4015), read as one take: the integration spec
 * of the coat, whose actions are each their own unit
 * (`test_motion_get_dressed_coat_partner_pick_up`, `_hold` and `_sleeve_in`;
 * the refusals are `_refusal`'s).
 *
 * Scenarios, the average man coating the small woman and the reverse, with
 * either holding hand:
 *
 * 1. The whole take, the dresser's stand > pickUp > coatPartner and the partner's
 *    stand > sleeveIn > sleeveIn > stand > walk, passes the shipped verdicts at
 *    its cuts and through the hand-over.
 * 2. Once worn, the jacket rides the partner's chest through the stand and the
 *    walk off: its frame on the displayed chest halfway through the rest of the
 *    film and at its end lies within 1 mm of where it lies just after the wear,
 *    the worn custody carried across the partner's actions.
 *
 * The checks of one action (the pickUp, the hold, the threading) are its
 * unit's.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the chain, the cross-action checks it keeps and where each action's own checks went.
 * @evidence contracts/development/testing.md#behavioral-verification Runs the two-performer coat and reads the shipped verdicts and the displayed jacket in the partner's displayed chest frame across the actions after the wear; a finding or a jacket sliding on the chest fails.
 * @evidence contracts/development/testing.md#independent-expectations Custody passes without a gap, worn rigid within the original's 1 mm.
 * @evidence contracts/development/testing.md#distinguishing-cases Two body pairs, both holding hands; each action's goal is its unit's.
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
  checks.assert("a partner is helped into a coat and walks off in it");
}

/** One case's whole coat and its cross-action checks. */
function coat(
  checks: motionComplaints.IGatherer,
  c: coatPartnerScene.ICase,
): void {
  const film: HumanPerformance = coatPartnerScene.stage(
    motionHumanBody(c.dresser),
    motionHumanBody(c.dressed),
    coatPartnerScene.jacket(),
    c.hand,
    "b",
    coatPartnerScene.HOLD,
    "walkOff",
  );
  try {
    assertTakeClean(c.label, film);
  } catch (error: unknown) {
    checks.check(`${c.label}: ${everydayTake.describe(error)}`, false);
  }
  const segment: IAutoMovieMotionHumanSegment = coatPartnerScene.coat(film);
  const worn: number = wardrobeFilm.mark(segment, "jacketWorn");
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
    `${c.label}: the jacket rides the partner's chest (${drifts.map((d: number): string => (d * 1000).toFixed(2)).join(", ")} mm)`,
    drifts.every((d: number): boolean => d <= coatPartnerScene.RIGID),
  );
}
