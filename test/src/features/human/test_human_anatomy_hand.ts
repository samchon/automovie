import { assertHumanAnatomy } from "../internal/assertHumanAnatomy";

/**
 * Neutral straightened hands answer their inputs at explicit model sites.
 * Model identity and observed hand shape remain separate from clinical
 * identity; unestablished stylion/crease correspondence stays unavailable
 * and failed rather than inheriting a passing model result.
 *
 * Scenarios:
 * 1. All nine people answer the region's public dimensions on independent skin.
 * 2. Whole-region shape and neighbouring geometric relationships remain sound.
 *
 * @evidence contracts/testing.md#behavioral-verification Poses final skin through the actual neutral evaluator and dual-quaternion binding. Hand and palm length start at the owned Hand-bone wrist-crease centre, without a 1.5 mm stylion substitution. Digit III tip projection and actual separation from both neighbouring loops locate their endpoints. A final section through metacarpals II/V supplies breadth and taut girth, excluding the thumb; thumb length reads actual tip projection from its MCP guide. The handAt diagnostic reads cached bind and neutral skin through this same oracle without regeneration.
 * @evidence contracts/testing.md#independent-expectations Goals are public extremity inputs and hand-circumference control, retaining 1 mm hand dimensions and 4 mm small-girth acceptance limits motivated by ISO 20685-1 Table 4. ANSUR-derived breadth/length remains 0.383 to 0.506. Reference remeasurement used a thinnest-wrist proxy because its skin lacked a reliable styloid prominence, so clinical stylion equivalence is unestablished. A bind projection solve cannot establish a neutral measurement; the test reads actual posed output. Web separation remains a model crease proxy rather than a palpable landmark observation.
 * @evidence contracts/testing.md#distinguishing-cases Runs f1, f2, m1, m2, tall, short, wide, narrow and masculine. Both hands are read. The ratio can expose an inconsistent extreme input and is not loosened to accommodate it. Arm tests own wrist tapes, pose tests motion health and curve tests hand/web surface soundness.
 * @evidence contracts/testing.md#execution-ownership Discoverable synchronous CPU function test_human_anatomy_hand, selected by --include human_anatomy_hand. It generates and poses cached whole people in process with no host, browser or GPU and lists all region findings before failing.
 */
export function test_human_anatomy_hand(): void {
  assertHumanAnatomy("hand");
}
