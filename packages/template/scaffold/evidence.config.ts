import {
  type IProductionConstruction,
  type IProductionLayerStages,
  createProductionConfig,
  resolveProductionGateRuntime,
} from "./workflow";

// A disabled pass composes its complete body; evidence enables its obligations.
// Neither state is an independent review approval.
const construction: IProductionConstruction = {
  index: "disabled",
  settings: "disabled",
  treatments: "disabled",
  scripts: "disabled",
  screenplay: "disabled",
};
const naturalness: IProductionLayerStages = {
  scripts: "disabled",
  screenplay: "disabled",
};

export default createProductionConfig({
  lifecycle: "independent-evidence-v1",
  mode: "long",
  location: import.meta.dirname,
  narrativeScope: { mode: "complete-work" },
  construction,
  naturalness,
  gate: {
    ...resolveProductionGateRuntime(import.meta.dirname),
    claimScopes: [],
  },
  claims: [],
  supportClaims: [
    {
      name: "production source",
      type: "typescript",
      files: ["src/**/*.ts"],
      symbol: ["type", "function"],
      reference: {
        type: "markdown",
        root: ".agents/skills",
        files: ["contracts/common.md"],
        symbol: "h2",
        checklist: true,
      },
    },
    {
      name: "production tests",
      type: "typescript",
      files: ["test/**/test_*.ts"],
      symbol: ["function"],
      reference: {
        type: "markdown",
        root: ".agents/skills",
        files: ["contracts/testing.md"],
        symbol: "h2",
        checklist: true,
      },
    },
  ],
});
