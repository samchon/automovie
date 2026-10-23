import type { IEvidenceConfig } from "@wrtnlabs/evidence";

/**
 * Compact engineering baseline. Adopt production-specific populations through
 * docs/guides/contracts.md when the brief needs additional evidence.
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
