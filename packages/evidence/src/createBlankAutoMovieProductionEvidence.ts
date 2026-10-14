import type { AutoMovieEvidenceStage } from "./AutoMovieEvidenceStage";
import type { AutoMovieProductionLanguage } from "./AutoMovieProductionLanguage";
import type { IAutoMovieEvidenceConfigProps } from "./IAutoMovieEvidenceConfigProps";

const DISABLED: AutoMovieEvidenceStage = "disabled";

/**
 * Create an explicit unselected declaration for a caller-owned production graph.
 *
 * The language remains an explicit caller input. Everything else is the closed blank state: no production kind, no active branch, no local claim, and complete-production population scope. Current experimental configurations extend this record and supply resident contracts; the current blank scaffold neither invokes this factory nor supplies a docs/language pack.
 *
 * @evidence contracts/common.md#principled-implementation Return an unselected complete-production declaration whose authored, source and naturalness branches are all disabled.
 * @evidence contracts/common.md#clear-and-simple-design One explicit disabled stage map retains the caller's chosen audience language before project-specific branch selection.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No production kind, active host or language is inferred from an empty project.
 * @evidence contracts/common.md#meaningful-documentation location and language are retained verbatim; later graph admission owns stage and resident-contract checks, including its retained blank-state language exception.
 * @evidence contracts/performance.md#efficient-algorithms The fixed branch map takes constant time and constant-sized record allocation.
 * @evidence contracts/performance.md#reuse-equivalent-work The disabled stage value is reused within the returned map, while each declaration is freshly constructed.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns the new stage and scope records; no project files or retained state are acquired.
 */
export function createBlankAutoMovieProductionEvidence(location: string, language: AutoMovieProductionLanguage): IAutoMovieEvidenceConfigProps {
  return ({
  location,
  kind: null,
  language,
  populationScope: { mode: "complete-production" },
  settings: DISABLED,
  research: DISABLED,
  maps: DISABLED,
  models: DISABLED,
  spaces: DISABLED,
  materials: DISABLED,
  instances: DISABLED,
  motions: DISABLED,
  systems: DISABLED,
  treatments: DISABLED,
  scripts: DISABLED,
  screenplays: DISABLED,
  naturalness: { screenplays: DISABLED },
  briefs: DISABLED,
  mapSources: DISABLED,
  modelSources: DISABLED,
  spaceSources: DISABLED,
  materialSources: DISABLED,
  instanceSources: DISABLED,
  motionSources: DISABLED,
  systemSources: DISABLED,
  shots: DISABLED,
  productionSources: DISABLED,
  filmSources: DISABLED,
  claims: [],
});
}
