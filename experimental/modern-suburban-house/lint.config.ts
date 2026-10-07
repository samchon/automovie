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
import { fileURLToPath } from "node:url";

/**
 * The sole tracked production kind, population scope, branch-stage, and local
 * contract declaration consumed by standalone evidence evaluation, authored source, and final
 * production review.
 *
 * Select the production shape, then advance one construction layer at a time
 * through `draft -> evidence`. A film constructs settings,
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
export const productionEvidence = {
  ...createBlankAutoMovieProductionEvidence(
    fileURLToPath(new URL(".", import.meta.url)),
    "korean" as AutoMovieProductionLanguage,
  ),
} satisfies IAutoMovieEvidenceConfigProps;

productionEvidence.kind = "library";
productionEvidence.settings = "evidence";
productionEvidence.spaces = "evidence";
productionEvidence.spaceSources = "evidence";
productionEvidence.models = "evidence";
productionEvidence.modelSources = "draft";
productionEvidence.materials = "evidence";
productionEvidence.materialSources = "draft";
productionEvidence.instances = "evidence";
productionEvidence.instanceSources = "draft";
productionEvidence.systems = "evidence";
productionEvidence.systemSources = "draft";
productionEvidence.claims = [
  createAutoMovieProductionObligationClaim({
    name: "house-observation-denominator",
    document: "contracts/observation-denominator.md",
    account: "accounts/settings/observation-denominator.md",
    layer: "settings",
    stage: productionEvidence.settings,
    populationScope: { mode: "complete-production" },
  }),
  createAutoMovieProductionObligationClaim({
    name: "house-surface-ownership",
    document: "contracts/surface-ownership.md",
    account: "accounts/settings/surface-ownership.md",
    layer: "settings",
    stage: productionEvidence.settings,
    populationScope: { mode: "complete-production" },
  }),
  createAutoMovieProductionObligationClaim({
    name: "house-space-observation-denominator",
    document: "contracts/observation-denominator.md",
    account: "accounts/spaces/observation-denominator.md",
    layer: "spaces",
    stage: productionEvidence.spaces,
    populationScope: { mode: "complete-production" },
  }),
  createAutoMovieProductionObligationClaim({
    name: "house-space-surface-ownership",
    document: "contracts/surface-ownership.md",
    account: "accounts/spaces/surface-ownership.md",
    layer: "spaces",
    stage: productionEvidence.spaces,
    populationScope: { mode: "complete-production" },
  }),
  createAutoMovieProductionObligationClaim({
    name: "house-model-reservation-fit",
    document: "contracts/reservation-fit.md",
    account: "accounts/models/reservation-fit.md",
    layer: "models",
    stage: productionEvidence.models,
    populationScope: { mode: "complete-production" },
  }),
  createAutoMovieProductionObligationClaim({
    name: "house-model-surface-ownership",
    document: "contracts/surface-ownership.md",
    account: "accounts/models/surface-ownership.md",
    layer: "models",
    stage: productionEvidence.models,
    populationScope: { mode: "complete-production" },
  }),
  createAutoMovieProductionObligationClaim({
    name: "house-model-material-face-audit",
    document: "contracts/model-material-face-audit.md",
    account: "accounts/models/material-face-ledger.md",
    layer: "models",
    stage: productionEvidence.models,
    populationScope: { mode: "complete-production" },
  }),
  createAutoMovieProductionObligationClaim({
    name: "house-model-material-host-audit",
    document: "contracts/model-material-host-audit.md",
    account: "accounts/models/material-host-census.md",
    layer: "models",
    stage: productionEvidence.models,
    populationScope: { mode: "complete-production" },
  }),
  createAutoMovieProductionObligationClaim({
    name: "house-model-referent-audit",
    document: "contracts/model-referent-audit.md",
    account: "accounts/models/spaces-referent-ledger.md",
    layer: "models",
    stage: productionEvidence.models,
    populationScope: { mode: "complete-production" },
  }),
  createAutoMovieProductionPrincipleClaim({
    name: "house-material-texture-readability",
    document: "contracts/texture-readability.md",
    files: ["materials/**/*.md"],
    layer: "materials",
    stage: productionEvidence.materials,
    populationScope: { mode: "complete-production" },
    symbol: "h2",
  }),
  createAutoMovieProductionObligationClaim({
    name: "house-material-surface-ownership",
    document: "contracts/surface-ownership.md",
    account: "accounts/materials/surface-ownership.md",
    layer: "materials",
    stage: productionEvidence.materials,
    populationScope: { mode: "complete-production" },
  }),
  createAutoMovieProductionObligationClaim({
    name: "house-instance-reservation-fill",
    document: "contracts/reservation-fill.md",
    account: "accounts/instances/reservation-fill.md",
    layer: "instances",
    stage: productionEvidence.instances,
    populationScope: { mode: "complete-production" },
  }),
  createAutoMovieProductionObligationClaim({
    name: "house-instance-surface-ownership",
    document: "contracts/surface-ownership.md",
    account: "accounts/instances/surface-ownership.md",
    layer: "instances",
    stage: productionEvidence.instances,
    populationScope: { mode: "complete-production" },
  }),
];

const graph = createAutoMovieEvidenceConfig(productionEvidence);

/** Standalone evidence evaluation consumes the sole production declaration. */
export default createAutoMovieStandaloneEvidenceConfig(graph, productionEvidence.location) satisfies IEvidenceConfig;
