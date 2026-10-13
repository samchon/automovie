import type { AutoMovieAuthoredDocumentLayer } from "./AutoMovieAuthoredDocumentLayer";
import type { AutoMovieDesignDocumentLayer } from "./AutoMovieDesignDocumentLayer";
import { DESIGN_LAYERS } from "./DESIGN_LAYERS";

/** Upstream design families whose completed units the selected host population must account for. A host cites only the units it actually consumes; omission from another host is not an exclusion, while a genuinely unused target needs one truthful population-wide exclusion. */
/** Current provider-consumer matrix, including the mutual motions and systems dependency; consumers select only completed active providers. */
export const DESIGN_FOUNDATIONS: Partial<
  Record<AutoMovieAuthoredDocumentLayer, readonly AutoMovieDesignDocumentLayer[]>
> = {
  spaces: ["maps"],
  models: ["spaces"],
  materials: ["models", "spaces"],
  instances: ["maps", "models", "spaces", "materials"],
  motions: ["maps", "models", "spaces", "materials", "instances", "systems"],
  systems: ["maps", "models", "spaces", "materials", "instances", "motions"],
  briefs: DESIGN_LAYERS,
};
