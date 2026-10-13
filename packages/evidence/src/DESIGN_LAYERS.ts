import type { AutoMovieAuthoredDocumentLayer } from "./AutoMovieAuthoredDocumentLayer";

/** Canonical design branch order reused by foundation and source correspondence checks. */
export const DESIGN_LAYERS: readonly ["maps", "models", "spaces", "materials", "instances", "motions", "systems"] = [
  "maps",
  "models",
  "spaces",
  "materials",
  "instances",
  "motions",
  "systems",
] as const satisfies readonly AutoMovieAuthoredDocumentLayer[];
