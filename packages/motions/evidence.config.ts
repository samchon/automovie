import { type IEvidenceConfig } from "@wrtnlabs/evidence";

const files: string[] = [
  "src/compose/**/*.ts",
  "src/posture/HumanDigitFit.ts",
  "src/posture/HumanLimbFit.ts",
  "src/posture/HumanLimbFitMemory.ts",
  "src/posture/HumanLimbPair.ts",
  "src/posture/HumanQuadraticBand.ts",
  "src/posture/HumanQuadraticCholesky.ts",
  "src/posture/HumanQuadraticEntries.ts",
  "src/posture/HumanQuadraticPreparation.ts",
  "src/posture/HumanQuadraticProgram.ts",
  "src/posture/HumanQuadraticResiduals.ts",
  "src/posture/HumanQuadraticRow.ts",
  "src/posture/HumanQuadraticSubstitute.ts",
  "src/posture/HumanQuadraticValue.ts",
  "src/posture/HumanQuadraticWorkspace.ts",
  "src/posture/poseBones.ts",
  "src/posture/prepareHumanLimbFit.ts",
  "src/posture/prepareHumanPoseResolution.ts",
  "src/posture/refitHumanPosture.ts",
  "src/posture/resolveHumanPosture.ts",
];

/** Composition primitives and the maintained posture and quadratic helpers answer the documentation, design and implementation checklists. */
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
