import { type IEvidenceConfig } from "@wrtnlabs/evidence";

const files: string[] = ["src/**/*.ts"];

/** Every archetype declaration answers the checklists: each exported declaration the shared documentation checklist, types the design checklist and functions the implementation checklist. */
export default {
  severity: "error",
  claims: [
    {
      name: "archetypes documentation",
      type: "typescript",
      files,
      evidenceFiles: ["predicate/**/*.md"],
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
      name: "archetypes types",
      type: "typescript",
      files,
      evidenceFiles: ["predicate/**/*.md"],
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
      name: "archetypes functions",
      type: "typescript",
      files,
      evidenceFiles: ["predicate/**/*.md"],
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
