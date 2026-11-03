import { assertHumanAnatomy } from "../internal/assertHumanAnatomy";

/**
 * Every person whose waist input is clearly under the hip and chest inputs has
 * a trunk whose breadth, read through its middle from the crotch to the armpit,
 * swells to the hips and then narrows to a waist.
 *
 * @evidence contracts/testing.md#behavioral-verification Generates each person's skin, cuts the trunk (arms left out) every S / 300 from 0.02 S over the crotch to 0.005 S under the armpit and reads the lateral extent of each section, then reduces that profile to its turning points with a 1 mm hysteresis. It checks that the first two turns are a maximum and a minimum, that the minimum dips at least 1 mm under the lower of its neighbouring maxima and that it lies between the crotch and the armpit. It catches a trunk that narrows nowhere, one whose waist lies above the chest or under the crotch, and one whose hips are narrower than its waist.
 * @evidence contracts/testing.md#independent-expectations The expectation is asked only of a person whose waist girth input is under both the hip and the chest girth inputs by more than twice ISO 20685-1:2018 Table 4's 9 mm error for large circumferences: such a waist is a narrowing the tape must find, and the order hips, waist, chest along the height is the order of the ANSUR II means (waist girth under both buttock and chest girth, `ansur-ii-trunk-ratios.md`). A straight trunk, whose waist input is not clearly under the others, is asked nothing, since about one man in a hundred has no waist (ANSUR II waist over buttock 0.921 +- 0.059). No reference body and no construction constant enters.
 * @evidence contracts/testing.md#distinguishing-cases Every generated person; those whose inputs ask for no waist contribute no rows. The trunk audit owns the tapes at their sites and the heights over stature; the curve test owns the trunk's sections and seams.
 * @evidence contracts/testing.md#execution-ownership A discoverable synchronous unit reached by `--include human_anatomy_trunk_silhouette`, cutting the cached people's skins in process with no renderer, browser or GPU.
 */
export function test_human_anatomy_trunk_silhouette(): void {
  assertHumanAnatomy("trunkSilhouette");
}
