import { assertHumanAnatomy } from "../internal/assertHumanAnatomy";

/**
 * Owned arm tapes retain their goals and the complete limb keeps a sound profile.
 * One owned section family supplies wrist minimum and thumb-side support.
 * Model identity and observed shape remain distinct from required clinical
 * identity, whose unestablished landmarks remain unavailable and failed.
 *
 * Scenarios:
 * 1. All nine people answer the region's public dimensions on independent skin.
 * 2. Whole-region shape and neighbouring geometric relationships remain sound.
 *
 * @evidence contracts/testing.md#behavioral-verification Reads final assembled triangles at the owned upper-arm attachment-to-elbow midpoint, elbow section, complete forearm muscle domain and shared wrist-crease plane. The arm plus upper-parent selection preserves shared sections. Full forearm extra turns, exact-crease-inclusive wrist minimum, radial bulge, bone containment and reflection checks remain. Fixed 34/1.5 mm offsets and a private 10 to 60 percent search window no longer select identity sites.
 * @evidence contracts/testing.md#independent-expectations Goals are public controls with the unchanged 4 mm small-girth acceptance limit motivated by ISO 20685-1 Table 4. Sites are model conventions, not clinical acromion, olecranon or stylion observations. Existing wrist location -30 to +10 mm, radial bulge 1 mm and reflection 0.5 mm remain engineering criteria, not newly proved clinical limits. Independent fixtures prove bowed/shared loops intact, displaced skin outside its bone, exact minimum sampling consistent, and moved maxima detectable throughout their domain. An owner can still misplace its address, so separate anatomy and visual inspection must assess that premise.
 * @evidence contracts/testing.md#distinguishing-cases Runs f1, f2, m1, m2, tall, short, wide, narrow and masculine. Both arms are read; missing sites remain failures and complete-limb health checks cannot be hidden by a muscle-only search. Hand and pose tests own distal hand dimensions and motion.
 * @evidence contracts/testing.md#execution-ownership Discoverable synchronous CPU function test_human_anatomy_arm, selected by --include human_anatomy_arm. It generates and poses cached whole people in process with no host, browser or GPU and lists all region findings before failing.
 */
export function test_human_anatomy_arm(): void {
  assertHumanAnatomy("arm");
}
