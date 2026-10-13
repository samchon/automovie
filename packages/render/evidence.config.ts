import { type IEvidenceConfig } from "@wrtnlabs/evidence";

/** Every exported declaration answers the checklists that apply to this package. */
export default {
  severity: "error",
  claims: [
    {
      name: "render declarations",
      type: "typescript",
      files: [
        "src/**/*.ts",
        "!src/**/index.ts",
      ],
      symbol: ["type", "function"],
      reference: {
        type: "markdown",
        root: "../../.agents/skills",
        files: [
          "contracts/common.md",
          "contracts/performance.md",
        ],
        symbol: "h2",
        checklist: true,
      },
    },
  ],
} satisfies IEvidenceConfig;
