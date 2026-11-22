/**
 * Names the authored narrative layers, in pipeline order.
 *
 * `treatments` fixes what happens as one flat ordered sequence of event units,
 * grouped by nothing and partitioned for no reader. `scripts` designs
 * the part and episode partition, scene progression and draft exchanges.
 * `screenplay` authors the final action, dialogue, sound and edit from those decisions.
 *
 * @evidence contracts/development/design.md#principled-representation The closed union names flat treatments, partitioned scripts and final screenplay, retaining their distinct authoring responsibilities.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Three literals keep treatments, scripts and final screenplay distinct without another runtime hierarchy.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Each literal names an actual authoring layer; no consumer exception or fabricated release partition is admitted.
 * @evidence contracts/development/common.md#meaningful-documentation The prose distinguishes flat events, scripts-designed partitions and final visible action/dialogue/sound/edit intent.
 */
export type NarrativeLayer = "treatments" | "scripts" | "screenplay";
