import { type IEvidenceConfig } from "@wrtnlabs/evidence";

/**
 * Every supported public declaration under `src` is selected for contract evidence.
 *
 * The population is derived from the source tree instead of enumerated, so a
 * file joins the graph by existing rather than by someone remembering to list
 * it here. The barrel is the only exclusion, because it re-exports declarations
 * that already answer at their definition.
 */
const publicSurface = ["src/**/*.ts", "!src/**/index.ts"];

/**
 * The public create-automovie surface answers for stable contract populations.
 *
 * Contract documents are selected by domain and role, never by an individual
 * content filename. README topic identities participate as H1 units while
 * durable content contracts participate as H3 units.
 */
const graph: IEvidenceConfig = {
  claims: [
    {
      name: "public create-automovie exports implement requirements",
      type: "typescript",
      files: publicSurface,
      symbol: ["type", "function", "property"],
      reference: [
        {
          type: "markdown",
          root: "../../docs",
          files: [
            "requirements/agent-authoring/**/README.md",
            "requirements/product/**/README.md",
          ],
          symbol: ["h1"],
        },
        {
          type: "markdown",
          root: "../../docs",
          files: [
            "requirements/agent-authoring/**/*.md",
            "requirements/product/**/*.md",
            "!requirements/**/README.md",
          ],
          symbol: ["h3"],
        },
      ],
    },
    {
      name: "public create-automovie exports implement specifications",
      type: "typescript",
      files: publicSurface,
      symbol: ["type", "function", "property"],
      reference: [
        {
          type: "markdown",
          root: "../../docs",
          files: ["specifications/authoring-and-authority/**/README.md"],
          symbol: ["h1"],
        },
        {
          type: "markdown",
          root: "../../docs",
          files: [
            "specifications/authoring-and-authority/**/*.md",
            "!specifications/**/README.md",
          ],
          symbol: ["h3"],
        },
      ],
    },
  ],
};

export default { ...graph, severity: "error" } satisfies IEvidenceConfig;
