import { assertHumanAnatomy } from "../internal/assertHumanAnatomy";

/**
 * Every person's feet, flat at the anatomical neutral, measure what their foot
 * inputs say by ISO 7250-1's definitions.
 *
 * @evidence contracts/testing.md#behavioral-verification Poses each person's skin to `{}` through the public pose evaluator and rig and reads each foot's skin along the principal axis of its footprint (its skin under 15 mm): length from the heel's rearmost to the longest toe's farthest skin, breadth as the widest extent across that axis, and breadth over length; it also reads the feet's mirror symmetry at the bind. It catches a foot of the wrong length or breadth, a foot turned so its length reads across it, and a foot too broad or narrow for any adult.
 * @evidence contracts/testing.md#independent-expectations Length and breadth come from `extremities.feet`, within ISO 20685-1:2018 Table 4's 2 mm for foot dimensions. Breadth over length lies within 0.33 to 0.43: ANSUR II's 0.376 to 0.377 for adults of both sexes (Brannock breadth) and Snyder 1977's 0.39 to 0.41 for children, widened for the spread of individuals. No construction constant or earlier output enters. Made green on f1: length 244.2 against 243.3 and breadth 89.7 against 90.2. Made red by the arch of the reasoning the extremes read: a foot whose input moved to the 99th percentile must still follow it. Oracle limits: the maximum breadth stands in for the breadth across the metatarsal heads, which the skin does not mark; the lateral malleolus height has no skin signature of its lowest point and is not read.
 * @evidence contracts/testing.md#distinguishing-cases Both feet of all nine people, whose foot inputs move to the population's ends with them. The leg test owns the ankle's girth.
 * @evidence contracts/testing.md#execution-ownership A discoverable synchronous unit reached by `--include human_anatomy_foot`, posing the cached people in process with no renderer, browser or GPU.
 */
export const test_human_anatomy_foot = (): void => assertHumanAnatomy("foot");
