import type { NarrativeLayer } from "./NarrativeLayer";

/**
 * Names every authored layer: the canon the narrative layers inherit and the
 * narrative layers themselves.
 *
 * Settings is the long route's canon and brief the short route's; each is a
 * source layer with no parent of its own.
 */
export type AuthoredLayer = "settings" | "brief" | NarrativeLayer;
