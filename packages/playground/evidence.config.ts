import { type IEvidenceConfig } from "@wrtnlabs/evidence";

/** The anatomical editors are separate application surfaces; every other new module remains a prototype carrier. */
const prototypeSources = [
  "src/**/*.ts",
  "src/**/*.mts",
  "!src/human/**/*.ts",
  "!src/human/**/*.mts",
];
/**
 * The body editor's own adapters, which answer for the body contract and not
 * the face's: every module under `src/human/body`. Derived by folder so a new
 * body adapter answers for the body contract from the moment it exists.
 */
const bodySources = ["src/human/body/**/*.ts", "src/human/body/**/*.mts"];
/**
 * The person editor and the body-reach helpers it shares with the body editor.
 * A person is the one-skin assembly of a face and a body, and the product
 * documents state its contract only through the facial- and body-authoring
 * documents, so these sources answer for both families. The person folder is
 * derived by folder; the shared reach helpers are named because they live in
 * the common folder beside face-only helpers.
 * The shared viewer editor binding contributes the original validated document
 * loader and view reflection to the face, body and person application owners.
 */
const personSources = [
  "src/human/person/**/*.ts",
  "src/human/person/**/*.mts",
  "src/human/inspection/**/*.ts",
  "src/human/inspection/**/*.mts",
  "src/human/examples/*People.ts",
  "src/human/common/connectedBodyReach.ts",
  "src/human/common/IConnectedBodyReach.ts",
  "src/human/common/annotateConnectedBodyReach.ts",
  "src/human/common/renderConnectedBodyUnavailableChannels.ts",
  "src/human/common/createConnectedDisabledRow.ts",
  "src/human/common/IConnectedBodyExteriorTargetsProps.ts",
  "src/human/common/renderConnectedBodyExteriorTargets.ts",
  "src/human/common/renderConnectedBodyExteriorGaps.ts",
  "src/human/common/renderConnectedBodyUnavailableParts.ts",
  "src/human/common/renderConnectedBodyUnmeasuredChannels.ts",
  "src/human/common/renderConnectedBodyHeldMotions.ts",
  "src/human/common/readConnectedBodyAnatomyTarget.ts",
  "src/human/common/writeConnectedBodyAnatomyTarget.ts",
  "src/viewer/registerPlaygroundEditor.ts",
];
const faceSources = [
  "src/human/**/*.ts",
  "src/human/**/*.mts",
  "!src/human/body/**/*.ts",
  "!src/human/body/**/*.mts",
  ...personSources.map((pattern) => "!" + pattern),
];
const authoring = (layer: "requirements" | "specifications") => {
  const roots =
    layer === "requirements"
      ? [
          "requirements/actors/facial-authoring",
          "requirements/actors/body-authoring",
        ]
      : [
          "specifications/asset-and-representation/facial-authoring",
          "specifications/asset-and-representation/body-authoring",
        ];
  return [
    {
      type: "markdown" as const,
      root: "../../docs",
      files: roots.map((folder) => folder + "/**/README.md"),
      symbol: "h1" as const,
    },
    {
      type: "markdown" as const,
      root: "../../docs",
      files: roots.flatMap((folder) => [
        folder + "/**/*.md",
        "!" + folder + "/**/README.md",
      ]),
      symbol: "h3" as const,
    },
  ];
};

/**
 * The private playground still carries a real deterministic-prototype contract.
 *
 * Every public source carrier is selected. The film demonstration pays the executable
 * prototype units this application actually renders and explicitly declines
 * the downstream-fidelity units that remain outside a local viewer demo.
 * Each TypeScript population ends by excluding dependency and runtime files
 * under node_modules, including caches nested beneath application sources.
 * The two process entries do not publish library contracts: viewer/page.ts
 * installs the browser Window binding, and human/inspection/vite.config.mts
 * supplies the default Vite configuration to createHumanViewerViteServer.
 * Both remain included in ordinary TypeScript and native documentation checks.
 *
 * Native evidence lint evaluates the two declared relationships. Self-Review
 * follows the repository evidence-graph skill to compare each changed public
 * export with the requirement and specification it actually implements and
 * to require truthful direct citations. This configuration does not record a
 * current unpaid-host count.
 */
const graph: IEvidenceConfig = {
  claims: [
    {
      name: "viewer application bindings and authored film examples answer common implementation principles",
      type: "typescript",
      files: [
        "src/viewer/**/*.ts",
        "src/viewer/**/*.mts",
        "src/film/**/*.ts",
        "src/film/**/*.mts",
        "!src/viewer/page.ts",
        "!src/human/inspection/vite.config.mts",
        "!**/node_modules/**",
      ],
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
      name: "inspection application answers common implementation principles",
      type: "typescript",
      files: [
        "src/human/inspection/**/*.ts",
        "src/human/inspection/**/*.mts",
        "src/human/examples/**/*.ts",
        "src/human/examples/**/*.mts",
        "!src/viewer/page.ts",
        "!src/human/inspection/vite.config.mts",
        "!**/node_modules/**",
      ],
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
      name: "person application implements face and body editor requirements",
      type: "typescript",
      files: [
        ...personSources,
        "!src/viewer/page.ts",
        "!src/human/inspection/vite.config.mts",
        "!**/node_modules/**",
      ],
      symbol: ["type", "function", "property"],
      reference: authoring("requirements"),
    },
    {
      name: "person application implements face and body editor specifications",
      type: "typescript",
      files: [
        ...personSources,
        "!src/viewer/page.ts",
        "!src/human/inspection/vite.config.mts",
        "!**/node_modules/**",
      ],
      symbol: ["type", "function", "property"],
      reference: authoring("specifications"),
    },
    {
      name: "face application implements anatomical editor requirements",
      type: "typescript",
      files: [
        ...faceSources,
        "!src/viewer/page.ts",
        "!src/human/inspection/vite.config.mts",
        "!**/node_modules/**",
      ],
      symbol: ["type", "function", "property"],
      reference: [
        {
          type: "markdown",
          root: "../../docs",
          files: ["requirements/actors/facial-authoring/**/README.md"],
          symbol: "h1",
        },
        {
          type: "markdown",
          root: "../../docs",
          files: [
            "requirements/actors/facial-authoring/**/*.md",
            "!requirements/actors/facial-authoring/**/README.md",
          ],
          symbol: "h3",
        },
      ],
    },
    {
      name: "face application implements anatomical editor specifications",
      type: "typescript",
      files: [
        ...faceSources,
        "!src/viewer/page.ts",
        "!src/human/inspection/vite.config.mts",
        "!**/node_modules/**",
      ],
      symbol: ["type", "function", "property"],
      reference: [
        {
          type: "markdown",
          root: "../../docs",
          files: [
            "specifications/asset-and-representation/facial-authoring/**/README.md",
          ],
          symbol: "h1",
        },
        {
          type: "markdown",
          root: "../../docs",
          files: [
            "specifications/asset-and-representation/facial-authoring/**/*.md",
            "!specifications/asset-and-representation/facial-authoring/**/README.md",
          ],
          symbol: "h3",
        },
      ],
    },
    {
      name: "body application implements body editor requirements",
      type: "typescript",
      files: [
        ...bodySources,
        "!src/viewer/page.ts",
        "!src/human/inspection/vite.config.mts",
        "!**/node_modules/**",
      ],
      symbol: ["type", "function", "property"],
      reference: [
        {
          type: "markdown",
          root: "../../docs",
          files: ["requirements/actors/body-authoring/**/README.md"],
          symbol: "h1",
        },
        {
          type: "markdown",
          root: "../../docs",
          files: [
            "requirements/actors/body-authoring/**/*.md",
            "!requirements/actors/body-authoring/**/README.md",
          ],
          symbol: "h3",
        },
      ],
    },
    {
      name: "body application implements body editor specifications",
      type: "typescript",
      files: [
        ...bodySources,
        "!src/viewer/page.ts",
        "!src/human/inspection/vite.config.mts",
        "!**/node_modules/**",
      ],
      symbol: ["type", "function", "property"],
      reference: [
        {
          type: "markdown",
          root: "../../docs",
          files: [
            "specifications/asset-and-representation/body-authoring/**/README.md",
          ],
          symbol: "h1",
        },
        {
          type: "markdown",
          root: "../../docs",
          files: [
            "specifications/asset-and-representation/body-authoring/**/*.md",
            "!specifications/asset-and-representation/body-authoring/**/README.md",
          ],
          symbol: "h3",
        },
      ],
    },
    {
      name: "playground demonstrations realize prototype requirements",
      type: "typescript",
      files: [
        ...prototypeSources,
        "!src/viewer/page.ts",
        "!src/human/inspection/vite.config.mts",
        "!**/node_modules/**",
      ],
      symbol: ["type", "function", "property"],
      reference: {
        type: "markdown",
        root: "../../docs",
        files: ["requirements/product/prototype-quality.md"],
        symbol: "h3",
      },
    },
    {
      name: "playground demonstrations realize prototype specifications",
      type: "typescript",
      files: [
        ...prototypeSources,
        "!src/viewer/page.ts",
        "!src/human/inspection/vite.config.mts",
        "!**/node_modules/**",
      ],
      symbol: ["type", "function", "property"],
      reference: {
        type: "markdown",
        root: "../../docs",
        files: [
          "specifications/authoring-and-authority/prototype-determinism-and-fidelity.md",
        ],
        symbol: "h3",
      },
    },
  ],
};

export default { ...graph, severity: "error" } satisfies IEvidenceConfig;
