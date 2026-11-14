import { archetypeToolUse } from "../internal/archetypeToolUse";

/**
 * A tool taken up from a bench works with its own face, on the average man: a hammer, a saw and a screwdriver bring the `face` they declare onto the work point, and a spoon stirs inside a saucepan, the tool riding the hand rigidly. `archetypeToolUse` states the stage and the scenarios with their bounds.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Builds the pick-up and the work through the public chain on the real tools and vessel and reads the displayed tool and hand; a face off the work, a spoon outside the pot, a tool that slips or a tool worked from the bench fails with the measure.
 * @evidence contracts/development/testing.md#independent-expectations The face is the archetype's own contact read off the displayed tool, the work points are the scene's; the 10 mm and 1 mm are the existing bounds.
 * @evidence contracts/development/testing.md#distinguishing-cases Four kinds of work, a free work point and a vessel, held and not held; the other stature is `test_archetype_tool_use_f_small`, split so each runs alone in its time.
 * @evidence contracts/development/testing.md#execution-ownership Prepares one polygon man and eight films; it runs locally and wherever CI runs the archetype tests.
 * @evidence contracts/development/common.md#meaningful-documentation States the rule, the body, where the scenarios are stated and the split.
 */
export function test_archetype_tool_use_m_average(): void {
  archetypeToolUse("m-average");
}