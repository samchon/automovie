import type { AutoMoviePopulationScope } from "./AutoMoviePopulationScope";
import { createAutoMoviePopulationFiles } from "./createAutoMoviePopulationFiles";
import type { AutoMovieProductionContractLayer } from "./AutoMovieProductionContractLayer";

/**
 * Select the authored Markdown file globs compared by one layer account.
 *
 * Treatments, scripts and screenplays delegate their pilot or complete-scope rules to the narrative population selector. Other layers select their whole branch because they have no delivery-group partition. Narrative selector refusals propagate unchanged.
 *
 * @evidence contracts/common.md#principled-implementation Only the three narrative layers admit scope-specific delivery selection; every other contract layer returns its complete recursive Markdown population, preserving the declared absence of a library partition selector.
 * @evidence contracts/common.md#clear-and-simple-design This account-boundary selector delegates narrative grammar to createAutoMoviePopulationFiles and owns only the whole-branch fallback for other authored layers.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No file list is inferred from a fixture or a completed account, and a non-narrative pilot receives no fabricated delivery-group filter.
 * @evidence contracts/common.md#meaningful-documentation The comment states returned glob semantics, the narrative delegation, the unpartitioned branch rule and propagated refusal ownership.
 * @evidence contracts/performance.md#efficient-algorithms One three-way layer test and one bounded selector call or glob construction occur; this operation never walks the matching files.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The selector computes one small glob array from its explicit layer and scope inputs and owns no request or filesystem cache.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Only the returned glob strings escape to their account owner; no host population or file handle is acquired.
 */
export function createAutoMovieAuthoredPopulationFiles(
  layer: AutoMovieProductionContractLayer,
  scope: AutoMoviePopulationScope,
): string[] {
  if (layer === "treatments" || layer === "scripts" || layer === "screenplays")
    return createAutoMoviePopulationFiles(layer, scope);
  return [`${layer}/**/*.md`];
}
