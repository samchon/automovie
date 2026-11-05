import { type IEvidenceConfig } from "@wrtnlabs/evidence";

const files: string[] = [
  "src/**/*.ts",
  // Ambient module declarations cannot be addressed by this adapter.
  "!src/productionScenes.d.ts",
  "!src/medieval-baron-manor.d.ts",
];

/** Every exported declaration answers the shared documentation checklist, types the design checklist and functions the implementation checklist. */
export default {
  severity: "error",
  claims: [
    {
      name: "website documentation",
      type: "typescript",
      files,
      symbol: ["type", "function"],
      reference: {
        type: "markdown",
        root: "../.agents/skills",
        files: ["contracts/development/common.md"],
        symbol: "h2",
        checklist: true,
      },
    },
    {
      name: "website types",
      type: "typescript",
      files,
      symbol: "type",
      reference: {
        type: "markdown",
        root: "../.agents/skills",
        files: ["contracts/development/design.md"],
        symbol: "h2",
        checklist: true,
      },
    },
    {
      name: "website functions",
      type: "typescript",
      files,
      symbol: "function",
      reference: {
        type: "markdown",
        root: "../.agents/skills",
        files: ["contracts/development/implementation.md"],
        symbol: "h2",
        checklist: true,
      },
    },
  ],
} satisfies IEvidenceConfig;
