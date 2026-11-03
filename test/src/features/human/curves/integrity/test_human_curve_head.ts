import { assertHumanCurves } from "../../../internal/assertHumanCurves";

/**
 * The neck, head and ears and their joins are sound curves, on every person.
 *
 * @evidence contracts/testing.md#behavioral-verification Generates each person and audits the chains from the neck to the crown and the ears, catching a section running over itself, an open join at the neck or a crease across the face. Any public head inputs in the domain pass. The lower and middle head are also skinned as the viewer shades them, with the nostrils cut and closed, so facets along the jaw's border and streaks in a nostril's closure fail although every curve reads sound; the jaw is read at shares of the person's own mandibular width.
 * @evidence contracts/testing.md#independent-expectations Winding, crossing and join closure hold for any closed skin, so no prior number enters. Ear rims and lobes are folded plates, so crossing, ripple, slope and seam are not read on them: the ear's folds and its sawtooth rest on the viewer, and this test does not vouch for them. A face section may flip more often than a plain one, and the crown's closing rings skip the slope rule.
 * @evidence contracts/testing.md#distinguishing-cases Contrasts the references' faces with tall, short, heavy and slight people, whose necks differ in both tapes. The trunk's test owns the shoulders below the neck ring, and the head's apertures and lips belong to their own rounds.
 * @evidence contracts/testing.md#execution-ownership A discoverable synchronous unit reached by `--include human_curve_head` over the cached generated people, starting no external host.
 */
export function test_human_curve_head(): void {
  assertHumanCurves(/^(head|ear)(\.|$)/);
}
