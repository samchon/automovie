import { type IEvidenceConfig } from "@wrtnlabs/evidence";

const helpers: string[] = [
  "src/features/internal/motionHumanFrame.ts",
  "src/features/internal/motionHumanLaw.ts",
  "src/features/internal/motionHumanLawCovering.ts",
  "src/features/internal/motionHumanLawSweep.ts",
  "src/features/internal/motionHumanLawSweepCell.ts",
  "src/features/internal/motionHumanRefusal.ts",
  "src/features/internal/motionHumanRepeat.ts",
  "src/features/internal/throwsError.ts",
];

/** Test scenarios answer the testing checklist; maintained motion helpers answer the documentation, design and implementation checklists. */
export default {
  severity: "error",
  claims: [
    {
      name: "test scenarios",
      type: "typescript",
      files: ["src/features/**/test_*.ts"],
      symbol: "function",
      reference: {
        type: "markdown",
        root: "../.agents/skills",
        files: [
          "contracts/development/common.md",
          "contracts/development/testing.md",
        ],
        symbol: "h2",
        checklist: true,
      },
    },
    {
      name: "motion helper documentation",
      type: "typescript",
      files: helpers,
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
      name: "motion helper types",
      type: "typescript",
      files: helpers,
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
      name: "motion helper functions",
      type: "typescript",
      files: helpers,
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
