import { type IEvidenceConfig } from "@wrtnlabs/evidence";

/** Inspection, process and completed-display transports retain their owners. */
const serviceSources = [
  "src/human/inspection/**/*.ts",
  "src/human/inspection/**/*.mts",
  "src/process/**/*.ts",
  "src/inspection/**/*.ts",
  "src/inspection/**/*.mts",
  "src/IAutoMovieViewerCompleted*.ts",
  "src/IAutoMovieViewerDisplay*.ts",
  "src/createViewerCamera*.ts",
  "src/createViewerDisplay*.ts",
  "src/publishViewerCompleted*.ts",
  "src/human/common/*ViewportTransfer*.ts",
];
/** Framing, layout and calibration families define observation geometry. */
const observationSources = [
  "src/human/inspection/*Calibration*.ts",
  "src/human/inspection/*calibration*.ts",
  "src/human/inspection/frameHumanViewer*.ts",
  "src/human/inspection/layoutHumanViewer*.ts",
];

/**
 * The public viewer surface answers for stable contract populations.
 *
 * Contract documents are selected by domain or by the complete layer, never by
 * individual Markdown filename. New documents therefore enter the graph
 * automatically and non-applicable units remain explicit source exclusions.
 */
const graph: IEvidenceConfig = {
  claims: [
    {
      name: "inspection, process and completed-display transports answer common implementation principles",
      type: "typescript",
      files: serviceSources,
      symbol: ["type", "function"],
      reference: {
        type: "markdown",
        root: "../../.agents/skills",
        files: ["contracts/common.md"],
        symbol: "h2",
        checklist: true,
      },
    },
    {
      name: "inspection observation geometry answers modeling principles",
      type: "typescript",
      files: observationSources,
      symbol: ["type", "function"],
      reference: {
        type: "markdown",
        root: "../../.agents/skills",
        files: ["contracts/modeling.md"],
        symbol: "h2",
        checklist: true,
      },
    },
    {
      name: "public viewer exports implement requirements",
      type: "typescript",
      files: ["src/**/*.ts", "src/**/*.mts"],
      evidenceExcludeCarriers: ["src/**/AutoMovieViewer*EvidenceExclusions.ts"],
      symbol: ["type", "function", "property"],
      reference: [
        {
          type: "markdown",
          root: "../../docs",
          files: ["requirements/**/README.md"],
          symbol: ["h1"],
        },
        {
          type: "markdown",
          root: "../../docs",
          files: ["requirements/**/*.md", "!requirements/**/README.md"],
          symbol: ["h3"],
        },
      ],
    },
    {
      name: "public viewer exports implement specifications",
      type: "typescript",
      files: ["src/**/*.ts", "src/**/*.mts"],
      evidenceExcludeCarriers: ["src/**/AutoMovieViewer*EvidenceExclusions.ts"],
      symbol: ["type", "function", "property"],
      reference: [
        {
          type: "markdown",
          root: "../../docs",
          files: ["specifications/**/README.md"],
          symbol: ["h1"],
        },
        {
          type: "markdown",
          root: "../../docs",
          files: ["specifications/**/*.md", "!specifications/**/README.md"],
          symbol: ["h3"],
        },
      ],
    },
  ],
};

export default { ...graph, severity: "error" } satisfies IEvidenceConfig;
