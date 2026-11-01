import { assertHumanCurves } from "../internal/assertHumanCurves";

/**
 * The legs and their joins are sound curves, on every person.
 *
 * @evidence contracts/testing.md#behavioral-verification Generates each person and audits both legs, catching a lump under the crotch, thighs passing the midline, sides that differ or a kink along the leg. Thighs that meet at the midline within the contact's softness pass, as a heavy person's must.
 * @evidence contracts/testing.md#independent-expectations The midline, mirror and curvature rules come from the body's symmetry and from what a smooth surface is, and no leg number enters. Measured on a known defect, the crease rule fired at 59 degrees on the crotch's 7 mm lump. Its limit of 40 degrees still lets a soft fold through.
 * @evidence contracts/testing.md#distinguishing-cases Contrasts a slight person whose thighs part with a heavy person whose thighs touch, and tall against short for a leg's length. The trunk's test owns the crotch ring the leg ends on, and the foot's owns the ankle.
 * @evidence contracts/testing.md#execution-ownership A discoverable synchronous unit reached by `--include human_curve_leg` over the cached generated people, starting no external host.
 */
export const test_human_curve_leg = (): void =>
  assertHumanCurves(/^leg\./);
