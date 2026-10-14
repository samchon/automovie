import { IAutoMovieForgeEntry } from "@automovie/interface";

import { createModel } from "./fixtures";

/**
 * Create a forge entry from the canonical one-part test model, defaulting its model id to the cast node. The final partial model spread deliberately overrides any field, including id, so callers can observe actual forge join refusals.
 */
export function forgeEntry(
  node: string,
  model: Partial<IAutoMovieForgeEntry["model"]> = {},
): IAutoMovieForgeEntry {
  return {
    node,
    model: { ...createModel(), id: node, ...model },
  };
}
