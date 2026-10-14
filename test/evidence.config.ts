import { type IEvidenceConfig } from "@wrtnlabs/evidence";

/** Every test scenario answers the testing checklist. */
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
        files: ["contracts/testing.md"],
        symbol: "h2",
        checklist: true,
      },
    },
  ],
} satisfies IEvidenceConfig;
