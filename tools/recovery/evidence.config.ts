import type { IEvidenceConfig } from "@wrtnlabs/evidence";

/** Research producers retain the production implementation checklist. */
export default {
  severity: "error",
  claims: [
    {
      name: "recovery declarations",
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
