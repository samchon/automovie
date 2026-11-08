import type { NarrativeLayer } from "./NarrativeLayer";

/**
 * Names every authored layer, including the canon the narrative layers inherit.
 *
 * @evidence contracts/development/design.md#principled-representation The union adds settings canon to the three narrative layers, so dependency keys can identify both the documentary parent and its adaptations.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Extending NarrativeLayer with settings lets common dependency keys include the documentary canon without a separate parallel key type.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Only the four supported layer literals are admitted; this alias supplies no runtime branch or ownership inference.
 * @evidence contracts/development/common.md#meaningful-documentation The comment distinguishes settings canon from inherited narrative layers.
 */
export type AuthoredLayer = "settings" | NarrativeLayer;
