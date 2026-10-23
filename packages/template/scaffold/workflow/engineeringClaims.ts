import type { IEvidenceClaim } from "@wrtnlabs/evidence";

/** Keeps ordinary source and test duties independent of narrative selection. */
export const engineeringClaims: IEvidenceClaim[] = [
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
];
