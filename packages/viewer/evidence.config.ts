import { type IEvidenceConfig } from "@wrtnlabs/evidence";

const files: string[] = ["src/**/*.ts", "src/**/*.tsx"];

/** Every exported declaration answers the shared documentation checklist, types the design checklist and functions the implementation checklist. */
export default {
  severity: "error",
  claims: [
    {
      name: "viewer documentation",
      type: "typescript",
      files,
      symbol: ["type", "function"],
      reference: {
        type: "markdown",
        root: "../../.agents/skills",
        files: ["contracts/development/common.md"],
        symbol: "h2",
        checklist: true,
      },
    },
    {
      name: "viewer types",
      type: "typescript",
      files,
      symbol: "type",
      reference: {
        type: "markdown",
        root: "../../.agents/skills",
        files: ["contracts/development/design.md"],
        symbol: "h2",
        checklist: true,
      },
    },
    {
      name: "viewer functions",
      type: "typescript",
      files,
      symbol: "function",
      reference: {
        type: "markdown",
        root: "../../.agents/skills",
        files: ["contracts/development/implementation.md"],
        symbol: "h2",
        checklist: true,
      },
    },
  ],
} satisfies IEvidenceConfig;
