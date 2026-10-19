import type { IEvidenceConfig } from "@wrtnlabs/evidence";

/**
 * Every exported type and function under `src` answers the common checklist,
 * and every exported function of a `test_*.ts` file under `test` the testing
 * checklist.
 */
export default {
  severity: "error",
  claims: [
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
} satisfies IEvidenceConfig;
