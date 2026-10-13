import type { AutoMovieProductionLanguage } from "./AutoMovieProductionLanguage";
import type {
  AutoMovieEvidenceStage,
  IAutoMovieEvidenceConfigProps,
} from "./createAutoMovieEvidenceConfig";

const DISABLED: AutoMovieEvidenceStage = "disabled";

/**
 * Create the one explicit unselected production declaration installed by a
 * fresh scaffold.
 *
 * The language remains an explicit caller input. Everything else is the
 * closed blank state: no production kind, no active branch, no local claim,
 * and the complete-production population mode that becomes effective only
 * after authorship selects a kind. The shipped scaffold passes its render
 * placeholder here; the graph admits that value only while no language pack
 * is materialized and nothing is selected, so the template evaluates without
 * a language ever being defaulted.
 */
export const createBlankAutoMovieProductionEvidence = (
  location: string,
  language: AutoMovieProductionLanguage,
): IAutoMovieEvidenceConfigProps => ({
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
