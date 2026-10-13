import { type IEvidenceConfig } from "@wrtnlabs/evidence";

/** Every exported declaration answers the checklists that apply to this package. */
export default {
  severity: "error",
  claims: [
    {
      name: "viewer declarations",
      type: "typescript",
      files: [
        "src/**/*.ts",
        "src/**/*.mts",
        "!src/**/index.ts",
      ],
      symbol: ["type", "function"],
      reference: {
        type: "markdown",
        root: "../../.agents/skills",
        files: [
          "contracts/common.md",
          "contracts/performance.md",
          "contracts/portability.md",
        ],
        symbol: "h2",
        checklist: true,
      },
    },
    {
      name: "human inspection framing and calibration",
      type: "typescript",
      files: [
        "src/human/inspection/*Calibration*.ts",
        "src/human/inspection/*calibration*.ts",
        "src/human/inspection/frameHumanViewer*.ts",
        "src/human/inspection/layoutHumanViewer*.ts",
      ],
      symbol: ["type", "function"],
      reference: {
        type: "markdown",
        root: "../../.agents/skills",
        files: [
          "contracts/modeling.md",
        ],
        symbol: "h2",
        checklist: true,
      },
    },
  ],
} satisfies IEvidenceConfig;
