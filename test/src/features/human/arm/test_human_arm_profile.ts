import { assertHumanRows } from "../../internal/assertHumanRows";
import { HumanProfileRows } from "../../internal/HumanProfileRows";

/**
 * Every person's arm, cut square to its bones every 2 mm, runs the way an arm
 * does: the upper arm falls from its belly to the elbow in one run and the
 * forearm's belly stands in its proximal half.
 *
 * @evidence contracts/testing.md#behavioral-verification Generates each person's skin and cuts each upper arm square to the humerus from 0.15 to 0.85 of its length below the shoulder centre, keeping the section that encloses the bone, and reads the largest rise of the girth below its maximum; it reads the share of the forearm at which its girth is greatest within 0.1 to 0.6 of its length. It catches a second belly on the upper arm and a forearm whose muscle sits near the wrist.
 * @evidence contracts/testing.md#independent-expectations The upper arm runs down from its deltoid and biceps belly to the supracondylar waist, each rise below the maximum within ISO 20685-1's 4 mm for small girths. The forearm's muscles are fleshy above mid-forearm and tendinous below (Gray 1918), so the belly's share is at most 0.5. No construction constant or earlier output enters.
 * @evidence contracts/testing.md#distinguishing-cases All nine generated people, both arms, slender and broad, female and male. The arm's anatomy test owns the tapes, the wrist's narrowing and the bone inside the skin, the arm's curve test the chain's soundness; the arm's pieces and seams wait for the region's announcement.
 * @evidence contracts/testing.md#execution-ownership A discoverable synchronous unit reached by `--include human_arm_profile`, reading each person's rows once from a `Singleton` per person, with no renderer, browser or GPU.
 */
export function test_human_arm_profile(): void {
  assertHumanRows("arm profile", HumanProfileRows.arm);
}
