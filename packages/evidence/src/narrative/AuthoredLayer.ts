import type { NarrativeLayer } from "./NarrativeLayer";

/**
 * Names every authored layer: the canon the narrative layers inherit and the narrative layers themselves.
 *
 * Settings is the long route's canon and brief the short route's; each is a
 * source layer with no parent of its own.
 *
 * @evidence contracts/development/design.md#principled-representation The union adds the two canon layers, long-route settings and short-route brief, to the three narrative layers, so dependency keys identify both the documentary parent and its adaptations.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Extending NarrativeLayer with the canon literals lets common dependency keys include canon without a separate parallel key type.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Only the five supported layer literals are admitted; this alias supplies no runtime branch or ownership inference.
 * @evidence contracts/development/common.md#meaningful-documentation The comment distinguishes the two canon layers, their routes and the inherited narrative layers.
 */
export type AuthoredLayer = "settings" | "brief" | NarrativeLayer;
