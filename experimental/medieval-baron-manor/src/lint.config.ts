import {
  type AutoMovieProductionLanguage,
  type IAutoMovieEvidenceConfigProps,
  createAutoMovieEvidenceConfig,
  createAutoMovieStandaloneEvidenceConfig,
  createAutoMovieProductionPrincipleClaim,
  createBlankAutoMovieProductionEvidence,
} from "@automovie/evidence";
import type { IEvidenceConfig } from "@wrtnlabs/evidence";
import { fileURLToPath } from "node:url";

/**
 * The sole tracked production kind, population scope, branch-stage, and local
 * contract declaration consumed by standalone evidence evaluation and final
 * production review.
 *
 * Select the production shape, then advance one construction layer at a time
 * through `draft -> evidence -> review`. A film constructs settings,
 * treatments, scripts, and `docs/screenplays`, then independently revises the
 * frozen screenplay into `docs/final/screenplays` through the naturalness
 * stage. Shots and film sources consume only that reviewed final tree. A brief
 * follows settings, briefs, shots, and film sources. A library selects settings
 * and any coherent set of delivered design/source pairs.
 *
 * The layer list is a responsibility map, not a folder menu. Add, split, merge,
 * or omit settings files and activate design branches from the production's
 * actual change owners: a film, one model, a building, and an interior may need
 * very different populations. Keep each independent requirement in one H2;
 * use `docs/contracts` only when a work-specific rule recurs across owners.
 * Never create a branch merely because the scaffold names it.
 *
 * Naturalness revises dialogue, narration, and audience-read language only;
 * mechanically exact physical descriptions are copied unchanged. Follow
 * `.agents/skills/production-lifecycle/naturalness.md` for the revision scope
 * and upstream-repair procedure. Film and brief also require reviewed
 * productionSources as the parallel typed input to filmSources.
 */
export const productionEvidence = {
  ...createBlankAutoMovieProductionEvidence(
    fileURLToPath(new URL("..", import.meta.url)),
    "korean" as AutoMovieProductionLanguage,
  ),
  kind: "library",
  populationScope: { mode: "complete-production" },
  settings: "review",
  spaces: "review",
  spaceSources: "review",
  claims: [
    createAutoMovieProductionPrincipleClaim({
      name: "Manor spatial requirements are realized by the authored space",
      document: "contracts/manor-spatial-requirements.md",
      files: ["spaces/001-manor.md"],
      layer: "spaces",
      stage: "review",
      populationScope: { mode: "complete-production" },
      symbol: "h2",
    }),
  ],
} satisfies IAutoMovieEvidenceConfigProps;

const graph = createAutoMovieEvidenceConfig(productionEvidence);

/** Standalone evidence evaluation consumes the sole production declaration. */
export default createAutoMovieStandaloneEvidenceConfig(graph, productionEvidence.location) satisfies IEvidenceConfig;
