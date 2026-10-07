import { type IEvidenceConfig } from "@wrtnlabs/evidence";

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
      name: "public viewer exports implement requirements",
      type: "typescript",
      files: ["src/**/*.ts"],
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
      files: ["src/**/*.ts"],
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
