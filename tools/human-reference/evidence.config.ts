import type { IEvidenceConfig } from "@wrtnlabs/evidence";

/** Maintained research declarations answer the same implementation questions as production tools. */
export default {
  severity: "error",
  claims: [
    {
      name: "reference research declarations",
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
