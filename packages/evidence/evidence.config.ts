import { type IEvidenceConfig } from "@wrtnlabs/evidence";

const publicSource = ["src/**/*.ts", "!src/index.ts"];

const graph: IEvidenceConfig = {
  claims: [
    {
      name: "public evidence exports implement production evidence requirements",
      type: "typescript",
      files: publicSource,
      symbol: ["type", "function", "property"],
      reference: [
        {
          type: "markdown",
          root: "../../docs",
          files: ["requirements/production-evidence/README.md"],
          symbol: "h1",
        },
        {
          type: "markdown",
          root: "../../docs",
          files: [
            "requirements/production-evidence/**/*.md",
            "!requirements/production-evidence/**/README.md",
          ],
          symbol: "h3",
        },
      ],
    },
    {
      name: "public evidence exports implement production evidence specifications",
      type: "typescript",
      files: publicSource,
      symbol: ["type", "function", "property"],
      reference: [
        {
          type: "markdown",
          root: "../../docs",
          files: ["specifications/production-evidence/README.md"],
          symbol: "h1",
        },
        {
          type: "markdown",
          root: "../../docs",
          files: [
            "specifications/production-evidence/**/*.md",
            "!specifications/production-evidence/**/README.md",
          ],
          symbol: "h3",
        },
      ],
    },
    {
      name: "production language exports implement authoring requirements",
      type: "typescript",
      files: [
        "src/AutoMovieProductionLanguage.ts",
        "src/createAutoMovieEvidenceConfig.ts",
      ],
      symbol: ["type", "function", "property"],
      reference: {
        type: "markdown",
        root: "../../docs",
        files: ["requirements/agent-authoring/production-language.md"],
        symbol: "h3",
      },
    },
    {
      name: "production language exports implement authoring specifications",
      type: "typescript",
      files: [
        "src/AutoMovieProductionLanguage.ts",
        "src/createAutoMovieEvidenceConfig.ts",
      ],
      symbol: ["type", "function", "property"],
      reference: {
        type: "markdown",
        root: "../../docs",
        files: [
          "specifications/authoring-and-authority/production-language.md",
        ],
        symbol: "h3",
      },
    },
    {
      name: "contract migration exports implement recovery requirements",
      type: "typescript",
      files: ["src/contractMigration.ts"],
      symbol: ["type", "function", "property"],
      reference: {
        type: "markdown",
        root: "../../docs",
        files: [
          "requirements/operations-and-recovery/contract-baseline.md",
          "requirements/operations-and-recovery/contract-migration-plan.md",
          "requirements/operations-and-recovery/contract-migration-publication.md",
        ],
        symbol: "h3",
      },
    },
    {
      name: "contract migration exports implement recovery specifications",
      type: "typescript",
      files: ["src/contractMigration.ts"],
      symbol: ["type", "function", "property"],
      reference: {
        type: "markdown",
        root: "../../docs",
        files: [
          "specifications/execution-and-recovery/contract-baseline.md",
          "specifications/execution-and-recovery/contract-migration-plan.md",
          "specifications/execution-and-recovery/contract-migration-publication.md",
        ],
        symbol: "h3",
      },
    },
    {
      name: "delivery contract exports implement narrative specifications",
      type: "typescript",
      files: ["src/deliveryToc.ts"],
      symbol: ["type", "function", "property"],
      reference: {
        type: "markdown",
        root: "../../docs",
        files: ["specifications/narrative-and-intent/delivery-index.md"],
        symbol: "h3",
      },
    },
    {
      name: "delivery contract exports implement story requirements",
      type: "typescript",
      files: ["src/deliveryToc.ts"],
      symbol: ["type", "function", "property"],
      reference: {
        type: "markdown",
        root: "../../docs",
        files: ["requirements/story/delivery-index.md"],
        symbol: "h3",
      },
    },
  ],
};

export default { ...graph, severity: "error" } satisfies IEvidenceConfig;
