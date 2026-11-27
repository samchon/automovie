/*
 * Names the authored narrative layers, in pipeline order.
 *
 * `treatments` fixes what happens as one flat ordered sequence of event units,
 * grouped by nothing and partitioned for no reader. `scripts` designs the part
 * and episode partition, scene progression and draft exchanges. `screenplay`
 * authors the final action, dialogue, sound and edit from those decisions.
 */
export type NarrativeLayer = "treatments" | "scripts" | "screenplay";
