import { assertHumanCurves } from "../internal/assertHumanCurves";

/**
 * The legs and their joins are sound curves, on every person.
 *
 * @evidence contracts/testing.md#behavioral-verification Generates each person and audits both legs, catching a lump under the crotch, a thigh top the crotch ring has filled, thighs passing the midline, sides that differ, a kink along the leg or a streak running down the thigh from the crotch ring's pinch. Thighs that meet at the midline within the contact's softness pass, as a heavy person's must.
 * @evidence contracts/testing.md#independent-expectations The midline, mirror and curvature rules come from the body's symmetry and from what a smooth surface is, and no leg number enters. Measured on known defects, the crease rule fired at 59 degrees on the crotch's 7 mm lump, and the thigh rule at 1.17 of the tape on a law whose crotch ring set the thigh's top, against 1.13 at most after. Its limit of 1.15 sits in that gap, and the crease limit of 40 degrees still lets a soft fold through. The streak rule read 0.63 on f1 and 0.62 on m2 against 0.3 on the figure whose fillet spread a pinch's slope over a whole radius of the thigh, and passes with a fillet of 0.3 radii. It reads 68 to 85 mm under the ring on f1, so a crease nearer the ring passes it and the viewer stays required. Its limit was set after both figures were read.
 * @evidence contracts/testing.md#distinguishing-cases Contrasts a slight person whose thighs part with a heavy person whose thighs touch, and tall against short for a leg's length. The trunk's test owns the crotch ring the leg ends on, and the foot's owns the ankle.
 * @evidence contracts/testing.md#execution-ownership A discoverable synchronous unit reached by `--include human_curve_leg` over the cached generated people, starting no external host.
 */
export const test_human_curve_leg = (): void =>
  assertHumanCurves(/^leg\./);
