import type { IEvidenceConfig } from "@wrtnlabs/evidence";

/** Every exported type and function under `src` answers the common checklist. */
export default {
  severity: "error",
  claims: [
    {
      name: "production source",
      type: "typescript",
      files: ["src/**/*.ts", "!src/**/index.ts"],
      symbol: ["type", "function"],
      reference: {
        type: "markdown",
        root: ".agents/skills",
        files: ["contracts/common.md"],
        symbol: "h2",
        checklist: true,
      },
    },
  ],
} satisfies IEvidenceConfig;
