import { assertHumanAnatomy } from "../internal/assertHumanAnatomy";

/**
 * Trunk and neck goals are answered on assembled skin at owned model addresses.
 * Model identity, observed surface health and required clinical identity remain
 * distinct results. Unestablished clinical correspondence stays unavailable
 * and failed even when the owned model courses close.
 *
 * Scenarios:
 * 1. All nine people answer the region's public dimensions on independent skin.
 * 2. Whole-region shape and neighbouring geometric relationships remain sound.
 *
 * @evidence contracts/testing.md#behavioral-verification Reads final skin at the owner's chest, underbust, waist, hip and high-hip sections, neck section and non-planar four-contact neck-base course. The reader never reads target radii or closure coefficients. Full neck profile turns, twelve meridian crease planes, population shape ratios, crotch/stature and mirror checks remain. An abdominal bulge or jaw wrinkle cannot choose a tape's address.
 * @evidence contracts/testing.md#independent-expectations Goals are public inputs. Existing large-girth 9 mm and small-girth 4 mm acceptance limits remain, motivated by ISO 20685-1 Table 4; model sites and native courses are not certified clinically equivalent. Retained ANSUR-derived ratios are chest depth/breadth 0.702 to 1.095, waist 0.576 to 0.853, buttock depth/hip breadth 0.548 to 0.827 and crotch/stature 0.445 to 0.515. Existing 0.5 mm reflection, crease and turn criteria remain. Independent analytic site fixtures distinguish distracted global selectors from owned sections and measure non-planar courses on final triangles. Oracle limits: site placement is a modelling premise, clinical palpable landmarks are not recovered, and ANSUR waist ratios were sampled at omphalion rather than this model waist.
 * @evidence contracts/testing.md#distinguishing-cases Runs f1, f2, m1, m2, tall, short, wide, narrow and masculine. Missing metadata remains a non-finite identity failure. Independent measurement-site fixtures own controlled selector defects; limb/head, pose and curve tests own their regions and surface health.
 * @evidence contracts/testing.md#execution-ownership Discoverable synchronous CPU function test_human_anatomy_trunk, selected by --include human_anatomy_trunk. It generates and poses cached whole people in process with no host, browser or GPU and lists all region findings before failing.
 */
export function test_human_anatomy_trunk(): void {
  assertHumanAnatomy("trunk");
}
