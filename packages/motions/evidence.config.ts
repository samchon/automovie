import { type IEvidenceConfig } from "@wrtnlabs/evidence";

const files: string[] = [
  "src/compose/**/*.ts",
  "src/perform/HumanPropOutcome.ts",
  "src/perform/HumanPropFlight.ts",
  "src/perform/HumanPropSweep.ts",
];

/** Composition primitives and the maintained prop-outcome reader answer the shared documentation, design and implementation checklists on their declarations. */
export default {
  severity: "error",
  claims: [
    {
      name: "motions compose documentation",
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
      name: "motions compose types",
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
      name: "motions compose functions",
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
