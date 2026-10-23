import type { IEvidenceConfig } from "@wrtnlabs/evidence";

/** Maintained types and functions answer the repository's implementation duties. */
export default {
  severity: "error",
  claims: [
    {
      name: "evidence declarations",
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
