import { assertHumanCurves } from "../internal/assertHumanCurves";

/**
 * The neck, head and ears and their joins are sound curves, on every person.
 *
 * @evidence contracts/testing.md#behavioral-verification Generates each person and audits the chains from the neck to the crown and the ears, catching a section running over itself, an open join at the neck or a crease across the face. Any public head inputs in the domain pass, and a face's apertures are cut later, so they play no part here.
 * @evidence contracts/testing.md#independent-expectations Winding, crossing and join closure hold for any closed skin, so no prior number enters. Ear rims and lobes are folded plates, so crossing, ripple, slope and seam are not read on them: the ear's folds and its sawtooth rest on the viewer, and this test does not vouch for them. A face section may flip more often than a plain one, and the crown's closing rings skip the slope rule.
 * @evidence contracts/testing.md#distinguishing-cases Contrasts the references' faces with tall, short, heavy and slight people, whose necks differ in both tapes. The trunk's test owns the shoulders below the neck ring, and the head's apertures and lips belong to their own rounds.
 * @evidence contracts/testing.md#execution-ownership A discoverable synchronous unit reached by `--include human_curve_head` over the cached generated people, starting no external host.
 */
export const test_human_curve_head = (): void =>
  assertHumanCurves(/^(head|ear)(\.|$)/);
