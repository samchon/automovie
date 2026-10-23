/**
 * Names the authored narrative layers, in pipeline order.
 *
 * `treatments` fixes what happens as one flat ordered sequence of event units,
 * grouped by nothing and partitioned for no reader. `scripts` designs
 * the part and episode partition and its scene-level dramatic progression.
 * `screenplay` writes the final visible action, dialogue, sound, and edit intent.
 *
 * @evidence contracts/common.md#principled-implementation The closed union names flat treatments, partitioned scripts and final screenplay, retaining their distinct authoring responsibilities.
 * @evidence contracts/common.md#clear-and-simple-design Three literals keep treatments, scripts and final screenplay distinct without another runtime hierarchy.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Each literal names an actual authoring layer; no consumer exception or fabricated release partition is admitted.
 * @evidence contracts/common.md#meaningful-documentation The prose distinguishes flat events, scripts-designed partitions and final visible action/dialogue/sound/edit intent.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Narrative layer identity is erased at runtime; producing and consuming functions account for concrete traversal and allocation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Narrative layer identity declares data and coordinates no reusable effects; consumers own equivalence and invalidation.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Narrative layer identity acquires no resource or retained state; concrete owners determine instance bytes and lifetimes.
 */
export type NarrativeLayer = "treatments" | "scripts" | "screenplay";
