import {
  createAutoMovieEvidenceConfig,
  createAutoMovieStandaloneEvidenceConfig,
  createAutoMovieProductionObligationClaim,
  createAutoMovieProductionPrincipleClaim,
  createBlankAutoMovieProductionEvidence,
  type AutoMovieProductionLanguage,
  type IAutoMovieEvidenceConfigProps,
} from "@automovie/evidence";
import type { IEvidenceConfig } from "@wrtnlabs/evidence";


/**
 * The sole tracked production kind, population scope, branch-stage, and local
 * contract declaration consumed by standalone evidence evaluation, authored source, and final
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
 * productionSources as the parallel typed assembly input to filmSources.
 */
const settingsStage = "review" as const;
const spacesStage = "evidence" as const;

export const productionEvidence = {
  ...createBlankAutoMovieProductionEvidence(
    __dirname,
    "korean" as AutoMovieProductionLanguage,
  ),
  kind: "library",
  settings: settingsStage,
  spaces: spacesStage,
  spaceSources: "evidence",
  models: "evidence",
  modelSources: "evidence",
  materials: "evidence",
  materialSources: "evidence",
  instances: "evidence",
  instanceSources: "evidence",
  claims: [
    createAutoMovieProductionPrincipleClaim({
      name: "temple-model-scale-uv",
      document: "contracts/principles-models.md",
      files: ["models/**/*.md"],
      layer: "models",
      stage: "evidence",
      populationScope: { mode: "complete-production" },
      symbol: "h2",
    }),
    createAutoMovieProductionObligationClaim({
      name: "temple-model-obligations",
      document: "contracts/obligations-models.md",
      account: "accounts/models/temple-obligations.md",
      layer: "models",
      stage: "evidence",
      populationScope: { mode: "complete-production" },
    }),
    createAutoMovieProductionObligationClaim({
      name: "temple-space-obligations",
      document: "contracts/obligations-spaces.md",
      account: "accounts/spaces/temple-obligations.md",
      layer: "spaces",
      stage: spacesStage,
      populationScope: { mode: "complete-production" },
    }),
  ],
} satisfies IAutoMovieEvidenceConfigProps;

const graph = createAutoMovieEvidenceConfig(productionEvidence);

/** Standalone evidence evaluation consumes the sole production declaration. */
export default createAutoMovieStandaloneEvidenceConfig(graph, productionEvidence.location) satisfies IEvidenceConfig;
