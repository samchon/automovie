import { type IEvidenceConfig } from "@wrtnlabs/evidence";

const files: string[] = ["src/**/*.ts"];

/** Every exported type answers the shared documentation checklist and the design checklist. */
export default {
  severity: "error",
  claims: [
    {
      name: "interface documentation",
      type: "typescript",
      files,
      evidenceFiles: ["predicate/**/*.md"],
      symbol: "type",
      reference: {
        type: "markdown",
        root: "../../.agents/skills",
        files: ["contracts/development/common.md"],
        symbol: "h2",
        checklist: true,
      },
    },
    {
      name: "interface types",
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
  ],
} satisfies IEvidenceConfig;
