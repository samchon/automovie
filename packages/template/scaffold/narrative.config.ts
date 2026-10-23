import {
  type IProductionConstruction,
  type IProductionLayerStages,
  createProductionConfig,
  resolveProductionGateRuntime,
} from "./workflow";
import { engineeringClaims } from "./workflow/engineeringClaims";

// This optional profile is selected by the root evidence.config.ts.
// A disabled pass composes its complete body; evidence enables its obligations.
// Neither state is an independent review approval.
/** Draft stages for the selected long-form route. */
const construction: IProductionConstruction = {
  index: "disabled",
  settings: "disabled",
  treatments: "disabled",
  scripts: "disabled",
  screenplay: "disabled",
};
/** Expression passes activate after their complete construction drafts. */
const naturalness: IProductionLayerStages = {
  scripts: "disabled",
  screenplay: "disabled",
};

/** Root location shared by the selected narrative and engineering claims. */
const location: string = import.meta.dirname;

export default createProductionConfig({
  lifecycle: "independent-evidence-v1",
  mode: "long",
  location,
  narrativeScope: { mode: "complete-work" },
  construction,
  naturalness,
  gate: {
    ...resolveProductionGateRuntime(location),
    claimScopes: [],
  },
  claims: [],
  supportClaims: engineeringClaims,
});
