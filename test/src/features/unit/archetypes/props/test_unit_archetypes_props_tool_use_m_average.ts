import { archetypeToolUse } from "../../../internal/archetypeToolUse";

/**
 * A tool taken up from a bench works with its own face, on the average man: a hammer, a saw and a screwdriver bring the `face` they declare onto the work point, and a spoon stirs inside a saucepan, the tool riding the hand rigidly. `archetypeToolUse` states the stage and the scenarios with their bounds.
 */
export function test_unit_archetypes_props_tool_use_m_average(): void {
  archetypeToolUse("m-average");
}
