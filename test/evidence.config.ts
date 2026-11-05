import { type IEvidenceConfig } from "@wrtnlabs/evidence";

/** Every test scenario answers the shared documentation and testing checklists. */
export default {
  severity: "error",
  claims: [
    {
      name: "test scenarios",
      type: "typescript",
      files: ["src/features/**/test_*.ts"],
      symbol: "function",
      reference: {
        type: "markdown",
        root: "../.agents/skills",
        files: [
          "contracts/development/common.md",
          "contracts/development/testing.md",
        ],
        symbol: "h2",
        checklist: true,
      },
    },
  ],
} satisfies IEvidenceConfig;
