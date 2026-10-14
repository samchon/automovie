import { type IEvidenceConfig } from "@wrtnlabs/evidence";

/** Website source declarations answer the implementation and resource checklists. */
export default {
  severity: "error",
  claims: [
    {
      name: "website declarations",
      type: "typescript",
      files: [
        "src/**/*.ts",
        "build/**/*.cts",
        "websiteViteConfig.ts",
        // Ambient module declarations cannot be addressed by this adapter.
        "!src/productionScenes.d.ts",
        "!src/medieval-baron-manor.d.ts",
      ],
      symbol: ["type", "function"],
      reference: {
        type: "markdown",
        root: "../.agents/skills",
        files: ["contracts/common.md", "contracts/performance.md"],
        symbol: "h2",
        checklist: true,
      },
    },
  ],
} satisfies IEvidenceConfig;
