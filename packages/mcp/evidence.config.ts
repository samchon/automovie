import { type IEvidenceConfig } from "@wrtnlabs/evidence";

// Process entries expose no declaration; their callable boundaries are in src.
const publicSources = [
  "src/**/*.ts",
  "!src/**/index.ts",
  "!src/bin.ts",
  "!src/reference-bin.ts",
];

const graph: IEvidenceConfig = {
  claims: [
    {
      name: "reference exports implement navigation requirements",
      type: "typescript",
      files: publicSources,
      symbol: ["type", "function", "property"],
      reference: {
        type: "markdown",
        root: "../../docs",
        files: ["requirements/agent-authoring/reference-navigation.md"],
        symbol: "h3",
      },
    },
    {
      name: "reference exports implement navigation specifications",
      type: "typescript",
      files: publicSources,
      symbol: ["type", "function", "property"],
      reference: {
        type: "markdown",
        root: "../../docs",
        files: [
          "specifications/authoring-and-authority/reference-navigation.md",
        ],
        symbol: "h3",
      },
    },
  ],
};

export default { ...graph, severity: "error" } satisfies IEvidenceConfig;
