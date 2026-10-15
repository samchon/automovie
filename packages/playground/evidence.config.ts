import { type IEvidenceConfig } from "@wrtnlabs/evidence";

/** Every exported declaration answers the checklists that apply to this package. */
export default {
  severity: "error",
  claims: [
    {
      name: "playground declarations",
      type: "typescript",
      files: ["src/**/*.ts"],
      symbol: ["type", "function"],
      reference: {
        type: "markdown",
        root: "../../.agents/skills",
        files: ["contracts/common.md", "contracts/performance.md"],
        symbol: "h2",
        checklist: true,
      },
    },
  ],
} satisfies IEvidenceConfig;
