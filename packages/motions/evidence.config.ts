import { type IEvidenceConfig } from "@wrtnlabs/evidence";

const files: string[] = [
  "src/compose/**/*.ts",
  "src/perform/HumanPerformanceAhead.ts",
  "src/perform/HumanPerformanceFlight.ts",
  "src/perform/HumanPerformanceFlightRotation.ts",
  "src/perform/HumanSegmentOverlay.ts",
  "src/posture/HumanLimbFit.ts",
  "src/posture/HumanQuadraticBand.ts",
  "src/posture/HumanQuadraticCholesky.ts",
  "src/posture/HumanQuadraticPreparation.ts",
  "src/posture/HumanQuadraticProgram.ts",
  "src/posture/prepareHumanLimbFit.ts",
];

/** Composition primitives and the maintained motion-evaluation helpers answer the documentation, design and implementation checklists on their own declarations. */
export default {
  severity: "error",
  claims: [
    {
      name: "motions documentation",
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
      name: "motions types",
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
      name: "motions functions",
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
