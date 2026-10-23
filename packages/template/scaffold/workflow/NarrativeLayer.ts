/**
 * Names the authored narrative layers, in pipeline order.
 *
 * `treatments` fixes what happens as one flat ordered sequence of event units,
 * grouped by nothing and partitioned for no reader. `scripts` designs
 * the part and episode partition and its scene-level dramatic progression.
 * `screenplay` writes the final visible action, dialogue, sound, and edit intent.
 */
export type NarrativeLayer = "treatments" | "scripts" | "screenplay";
