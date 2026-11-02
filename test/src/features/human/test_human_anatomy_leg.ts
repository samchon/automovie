import { assertHumanAnatomy } from "../internal/assertHumanAnatomy";

/**
 * Owned leg tapes retain their goals while the whole shank and body remain sound.
 * Model identity and observed shape do not replace required clinical identity;
 * unestablished patellar or source-course correspondence stays unavailable
 * and failed with its original inputs and limits.
 *
 * Scenarios:
 * 1. All nine people answer the region's public dimensions on independent skin.
 * 2. Whole-region shape and neighbouring geometric relationships remain sound.
 *
 * @evidence contracts/testing.md#behavioral-verification Reads independent horizontal final-skin sections over the owned upper-thigh region, knee-joint section and complete shank muscle region. The full knee-to-ankle profile retains extra-belly checks outside muscle-only transition exclusions. Bone containment and neutral bideltoid/hip breadth remain. The former patellar-prominence fallback and 15 to 60 percent calf search no longer define identity.
 * @evidence contracts/testing.md#independent-expectations Goals are public controls with unchanged 9 mm thigh and 4 mm knee/calf acceptance limits motivated by ISO 20685-1 Table 4. Knee-joint height is not certified mid-patella, and the upper-thigh model region is not certified gluteal furrow. The retained ANSUR-derived bideltoid/hip interval is 1.111 to 1.647; the one-belly profile retains a 4 mm noise floor and bones must remain enclosed. Independent moved-belly fixtures validate the complete-domain reader without reading its target. Separate shape checks and renders must assess whether the owner's region is anatomically justified.
 * @evidence contracts/testing.md#distinguishing-cases Runs f1, f2, m1, m2, tall, short, wide, narrow and masculine. Both legs are read, preserving missing-site failures and health beyond muscle-only domains. Trunk, foot, pose and curve tests own neighbouring shape, motion and surface health.
 * @evidence contracts/testing.md#execution-ownership Discoverable synchronous CPU function test_human_anatomy_leg, selected by --include human_anatomy_leg. It generates and poses cached whole people in process with no host, browser or GPU and lists all region findings before failing.
 */
export function test_human_anatomy_leg(): void {
  assertHumanAnatomy("leg");
}
