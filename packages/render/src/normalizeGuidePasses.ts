import type { AutoMovieGuidePass } from "@automovie/interface";

import { isGuidePass } from "./isGuidePass.js";

/**
 * Validate a requested pass list and fold repeats, keeping each pass at its
 * first position.
 *
 * Throws `unknown guide pass "<name>"` for a name outside
 * `AUTOMOVIE_GUIDE_PASSES`. `planGuidePassOutputs` and the chunked sequence
 * planner both normalize through it, so a request means the same pass order
 * everywhere. The production planner's `assertSingleGuidePass` is a narrower
 * rule and does not use it.
 */
export const normalizeGuidePasses: (
  passes: readonly string[],
) => AutoMovieGuidePass[] = (
  passes: readonly string[],
): AutoMovieGuidePass[] => {
  const seen: Set<AutoMovieGuidePass> = new Set();
  const normalized: AutoMovieGuidePass[] = [];
  for (const pass of passes) {
    if (isGuidePass(pass) === false)
      throw new Error(`unknown guide pass "${pass}"`);
    if (seen.has(pass)) continue;
    seen.add(pass);
    normalized.push(pass);
  }
  return normalized;
};
