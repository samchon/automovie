import { type IEvidenceConfig } from "@wrtnlabs/evidence";

const files: string[] = ["src/**/*.ts"];

/** Every exported declaration answers the shared documentation checklist, types the design checklist and functions the implementation checklist. */
export default {
  severity: "error",
  claims: [
    {
      name: "playground documentation",
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
      name: "playground types",
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
      name: "playground functions",
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
