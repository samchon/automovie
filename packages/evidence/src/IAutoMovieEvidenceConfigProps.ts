import type { AutoMovieEvidenceStage } from "./AutoMovieEvidenceStage";
import type { AutoMoviePopulationScope } from "./AutoMoviePopulationScope";
import type { AutoMovieProductionKind } from "./AutoMovieProductionKind";
import type { AutoMovieProductionLanguage } from "./AutoMovieProductionLanguage";
import type { IAutoMovieNaturalnessStages } from "./IAutoMovieNaturalnessStages";
import type { ITtscEvidenceGraphClaim } from "@ttsc/evidence";

/**
 * One generated project's complete evidence-graph declaration.
 *
 * @evidence contracts/common.md#principled-implementation An explicit project location, kind, language, scope and complete stage map select the generated evidence graph.
 * @evidence contracts/common.md#clear-and-simple-design All authored and source stages share one declaration while naturalness remains an independent nested map.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Additional claims extend shared coverage; omitted or unknown stage values are rejected at admission rather than defaulted.
 * @evidence contracts/common.md#meaningful-documentation Members name physical ownership, lifecycle meaning and scoped populations; claims remain project-owned native inputs.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This declaration is erased; createAutoMovieEvidenceConfig validates the caller-owned project declaration, which owns the runtime algorithm and allocation cost.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The type coordinates no effects; createAutoMovieEvidenceConfig validates the caller-owned project declaration, which owns any valid reuse or recomputation.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The schema acquires no resources; createAutoMovieEvidenceConfig validates the caller-owned project declaration, while the caller or module owns the lifetime of its values.
 *
 * @author Samchon
 */
export interface IAutoMovieEvidenceConfigProps {
  /** Absolute generated-project root whose physical populations are validated. */
  location: string;

  /** Mutually exclusive production shape, or null before selection. */
  kind: AutoMovieProductionKind | null;

  /** Supported audience-language identity; graph callers must supply its resident project-owned contract pack. */
  language: AutoMovieProductionLanguage;

  /** Exact complete, first-pilot, or post-pilot-reset host population. */
  populationScope: AutoMoviePopulationScope;

  /** Canonical production-settings document stage. */
  settings: AutoMovieEvidenceStage;

  /** Optional external-research ledger stage. */
  research: AutoMovieEvidenceStage;

  /** Broad-world map design-document stage. */
  maps: AutoMovieEvidenceStage;

  /** Model design-document stage. */
  models: AutoMovieEvidenceStage;

  /** Built-space and environment design-document stage. */
  spaces: AutoMovieEvidenceStage;

  /** Material and surface design-document stage. */
  materials: AutoMovieEvidenceStage;

  /** Placed instance and arrangement design-document stage. */
  instances: AutoMovieEvidenceStage;

  /** Time-varying motion design-document stage. */
  motions: AutoMovieEvidenceStage;

  /** Coupled service and behavior-system design-document stage. */
  systems: AutoMovieEvidenceStage;

  /** Film-only narrative-treatment stage. */
  treatments: AutoMovieEvidenceStage;

  /** Film-only physical scene-progression script stage. */
  scripts: AutoMovieEvidenceStage;

  /** Film-only complete audiovisual screenplay construction stage. */
  screenplays: AutoMovieEvidenceStage;

  /** Film-only expression revision, independent from screenplay construction. */
  naturalness: IAutoMovieNaturalnessStages;

  /** Brief-only bounded audiovisual contract stage. */
  briefs: AutoMovieEvidenceStage;

  /** TypeScript model construction-source stage. */
  modelSources: AutoMovieEvidenceStage;

  /** TypeScript resolved-world construction-source stage. */
  mapSources: AutoMovieEvidenceStage;

  /** TypeScript space construction-source stage. */
  spaceSources: AutoMovieEvidenceStage;

  /** TypeScript material construction-source stage. */
  materialSources: AutoMovieEvidenceStage;

  /** TypeScript instance construction-source stage. */
  instanceSources: AutoMovieEvidenceStage;

  /** TypeScript motion construction-source stage. */
  motionSources: AutoMovieEvidenceStage;

  /** TypeScript system construction-source stage. */
  systemSources: AutoMovieEvidenceStage;

  /** Authored shot and acceptance-source stage. */
  shots: AutoMovieEvidenceStage;

  /** Production-design serialization-source stage. */
  productionSources: AutoMovieEvidenceStage;

  /** Final editorial timeline-source stage. */
  filmSources: AutoMovieEvidenceStage;

  /** Production-local claims may extend, but never replace, the shared graph. */
  claims?: ITtscEvidenceGraphClaim[];
}
