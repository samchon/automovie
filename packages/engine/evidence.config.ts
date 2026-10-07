import { type IEvidenceConfig } from "@wrtnlabs/evidence";

const publicLeaves = ["src/**/*.ts", "!src/**/index.ts"];

const requirementReadmes = ["requirements/**/README.md"];
const requirementContent = [
  "requirements/**/*.md",
  "!requirements/**/README.md",
];
const specificationReadmes = ["specifications/**/README.md"];
const specificationContent = [
  "specifications/**/*.md",
  "!specifications/**/README.md",
];

/**
 * The public engine surface answers for stable contract populations.
 *
 * Contract documents are selected by domain or by the complete layer, never by
 * individual Markdown filename. New documents therefore enter the graph
 * automatically and non-applicable units remain explicit source exclusions.
 */
const graph: IEvidenceConfig = {
  claims: [
    {
      name: "public engine exports implement requirements",
      type: "typescript",
      files: publicLeaves,
      evidenceExcludeCarriers: ["src/**/AutoMovieEngine*EvidenceExclusions.ts"],
      symbol: ["type", "function", "property"],
      reference: [
        {
          type: "markdown",
          root: "../../docs",
          files: requirementReadmes,
          symbol: "h1",
        },
        {
          type: "markdown",
          root: "../../docs",
          files: requirementContent,
          symbol: "h3",
        },
      ],
    },
    {
      name: "public engine exports implement specifications",
      type: "typescript",
      files: publicLeaves,
      evidenceExcludeCarriers: ["src/**/AutoMovieEngine*EvidenceExclusions.ts"],
      symbol: ["type", "function", "property"],
      reference: [
        {
          type: "markdown",
          root: "../../docs",
          files: specificationReadmes,
          symbol: "h1",
        },
        {
          type: "markdown",
          root: "../../docs",
          files: specificationContent,
          symbol: "h3",
        },
      ],
    },
  ],
};

export default { ...graph, severity: "error" } satisfies IEvidenceConfig;
