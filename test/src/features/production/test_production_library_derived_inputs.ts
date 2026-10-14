import type { IAutoMovieDiagnostic } from "@automovie/interface";
import type {
  IAutoMovieFingerprintField,
  IAutoMovieProductionContentInput,
  IAutoMovieProductionDesignGraph,
} from "@automovie/production";
import { TestValidator } from "@nestia/e2e";
import path from "node:path";

import { readAutoMovieLibraryDerivedInputs } from "../../../../packages/production/src/production/readAutoMovieLibraryDerivedInputs";
import { contentFingerprintFields } from "../../../../packages/production/src/production/productionBuildIdentity";
import { productionAssetInventory } from "../../../../packages/production/src/production/productionAssetInventory";
import { inspectAutoMovieDerivedArtifacts } from "../../../../packages/production/src/production/derivedArtifacts";
import { textDigest } from "./sourceStatus/textDigest";

/** A project root that does not exist, so its derivation root cannot resolve. */
const ROOT: string = path.join(__dirname, "absent-derived-inputs-project");
const LEDGER: string = "automovie/assets.json";
const DERIVATIONS: string = "automovie/derived-artifacts.json";
const WIND: string = "assets/sound/harbor-wind.ogg";

const GRAPH: IAutoMovieProductionDesignGraph = {
  production: null,
  models: new Map(),
  world: null,
  formations: new Map(),
  shots: new Map(),
  acceptance: new Map(),
};

const contentOf: () => IAutoMovieProductionContentInput[] = (): IAutoMovieProductionContentInput[] => [
  {
    path: "src/spaces/hall.ts",
    source: true,
    render: false,
    bytes: Buffer.from("export const hall = { width: 4 };\n", "utf8"),
  },
  {
    path: WIND,
    source: false,
    render: true,
    bytes: Buffer.from("harbor wind", "utf8"),
  },
  {
    path: LEDGER,
    source: false,
    render: false,
    bytes: Buffer.from(
      JSON.stringify({
        version: 1,
        assets: [
          {
            path: WIND,
            digest: textDigest("harbor wind"),
            uses: [
              {
                production: "harbor",
                consumer: { kind: "audio-cue", id: "harbor-wind" },
                reason: "Ambient wind under the hall walkthrough.",
              },
            ],
          },
        ],
      }),
      "utf8",
    ),
  },
];

/**
 * A library's derived inputs follow the same reading policy for its compile
 * and every later check. Separate calls still observe mutable inputs again.
 *
 * The fields a library result is bound to are the declared content inventory
 * followed by the verified derivation closure, and the compile also receives
 * the admitted artifacts, the adopted asset records and their diagnostics from
 * that same read. An unreadable inventory must become an unsafe field and a
 * refusal rather than an exception, and the derivation closure must still be
 * inspected, so the failure reaches both the identity and the author. A scope
 * that reads no content must touch nothing.
 *
 * Scenarios:
 *
 * 1. A disabled read calls no project method and returns empty inputs.
 * 2. A readable inventory with an asset ledger and no derivation manifest gives
 *    the content fields, the ledger's adopted records and diagnostics as the
 *    asset inventory reads them, the inventory itself, and no artifacts.
 * 3. An unreadable inventory gives one unsafe field and one refusal naming the
 *    cause, then the derivation closure's own fields and its refusals as
 *    project errors.
 * 4. An asset inventory that fails after the content was read keeps the content
 *    fields and inventory, appends the unsafe field, and refuses with the cause.
 *
 * @evidence contracts/testing.md#behavioral-verification Invokes the actual library derived-input reader with disabled, readable, unreadable and post-content asset-inventory failures, asserting no disabled reads, retained content/adopted assets and ordered unsafe identity/diagnostics while derivation inspection still contributes its refusal.
 * @evidence contracts/testing.md#independent-expectations Literal zero reads, wind asset address, unsafe field and authored thrown messages independently specify key outcomes. Full fingerprint/assets/derivation comparisons reuse their canonical owners, so they establish composition/order rather than independent hashing or parser correctness.
 * @evidence contracts/testing.md#distinguishing-cases Retains all four scenarios, including failure before content acquisition versus after content exists, disabled access and readable inventory. Source execution and derived contribution JSON selection belong to adjacent library tests; manifest/derivation-inspection exceptions outside recovery are not asserted here.
 * @evidence contracts/testing.md#execution-ownership The named test_production_library_derived_inputs owns every callback and assertion. Its absent ROOT is queried by the real filesystem derivation inspector, making this host-dependent rather than a portable unit; it starts no process and writes no files. Host-layer relocation and the minimal project read-port type remain deferred integration work.
 */
export function test_production_library_derived_inputs(): void {
  let reads: number = 0;
  const projectOf: (props: {
    manifest?: { assetManifest?: string; derivedArtifactManifest?: string };
    contentInputs?: () => IAutoMovieProductionContentInput[];
    graph?: () => IAutoMovieProductionDesignGraph;
  }) => { root: string; productionId: string; archetypes: undefined;
    manifest: () => { assetManifest?: string; derivedArtifactManifest?: string };
    contentInputs: () => IAutoMovieProductionContentInput[];
    graph: () => IAutoMovieProductionDesignGraph;
  } = (props: {
    manifest?: { assetManifest?: string; derivedArtifactManifest?: string };
    contentInputs?: () => IAutoMovieProductionContentInput[];
    graph?: () => IAutoMovieProductionDesignGraph;
  }): { root: string; productionId: string; archetypes: undefined;
    manifest: () => { assetManifest?: string; derivedArtifactManifest?: string };
    contentInputs: () => IAutoMovieProductionContentInput[];
    graph: () => IAutoMovieProductionDesignGraph;
  } => {
    const count: <T>(read: () => T) => () => T =
      <T>(read: () => T): (() => T) =>
      (): T => {
        reads += 1;
        return read();
      };
    return {
      root: ROOT,
      productionId: "harbor",
      archetypes: undefined,
      manifest: count((): { assetManifest?: string; derivedArtifactManifest?: string } => props.manifest ?? {}),
      contentInputs: count(props.contentInputs ?? contentOf),
      graph: count(props.graph ?? ((): IAutoMovieProductionDesignGraph => GRAPH)),
    };
  };

  TestValidator.equals(
    "a disabled read touches nothing",
    {
      inputs: readAutoMovieLibraryDerivedInputs({
        project: projectOf({}),
        enabled: false,
      }),
      reads,
    },
    {
      inputs: {
        artifacts: {},
        fields: [],
        diagnostics: [],
        assets: [],
        content: [],
      },
      reads: 0,
    },
  );

  const content: IAutoMovieProductionContentInput[] = contentOf();
  const inventory: ReturnType<typeof productionAssetInventory> = productionAssetInventory(
    LEDGER,
    content,
    "harbor",
    GRAPH,
    undefined,
  );
  const readable: ReturnType<typeof readAutoMovieLibraryDerivedInputs> = readAutoMovieLibraryDerivedInputs({
    project: projectOf({
      manifest: { assetManifest: LEDGER },
      contentInputs: (): IAutoMovieProductionContentInput[] => content,
    }),
    enabled: true,
  });
  TestValidator.equals(
    "a readable inventory gives its fields, records and diagnostics",
    readable,
    {
      artifacts: {},
      fields: contentFingerprintFields(content),
      diagnostics: inventory.diagnostics,
      assets: inventory.records,
      content,
    },
  );
  TestValidator.equals(
    "the adopted ledger record is carried",
    readable.assets.map((asset: typeof readable.assets[number]): string => asset.path),
    [WIND],
  );

  const derivation: ReturnType<typeof inspectAutoMovieDerivedArtifacts> = inspectAutoMovieDerivedArtifacts({
    root: ROOT,
    manifestPath: DERIVATIONS,
    externalAssetPaths: [],
  });
  const derivationRefusals: IAutoMovieDiagnostic[] = derivation.problems.map(
    (problem: typeof derivation.problems[number]): IAutoMovieDiagnostic => ({
      code: problem.code,
      category: "error",
      phase: "project",
      target: problem.target,
      path: problem.path,
      message: problem.message,
    }),
  );
  const unsafe: IAutoMovieFingerprintField = {
    role: "content:inventory",
    kind: "unsafe",
    payload: new Uint8Array(),
  };
  TestValidator.equals(
    "an unreadable inventory refuses and still inspects the derivation closure",
    readAutoMovieLibraryDerivedInputs({
      project: projectOf({
        manifest: {
          assetManifest: LEDGER,
          derivedArtifactManifest: DERIVATIONS,
        },
        contentInputs: (): never => {
          throw new Error("Declared content root escapes the project.");
        },
      }),
      enabled: true,
    }),
    {
      artifacts: {},
      fields: [unsafe, ...derivation.fingerprintFields],
      diagnostics: [
        {
          code: "content-input-unsafe",
          category: "error",
          phase: "source",
          target: "declared-content",
          path: null,
          message: "Declared content root escapes the project.",
        },
        ...derivationRefusals,
      ],
      assets: [],
      content: [],
    },
  );
  TestValidator.predicate(
    "the unreadable-root derivation closure refuses",
    derivationRefusals.length !== 0,
  );

  const afterContent: IAutoMovieProductionContentInput[] = contentOf();
  TestValidator.equals(
    "an inventory failure after the content read keeps the content",
    readAutoMovieLibraryDerivedInputs({
      project: projectOf({
        manifest: { assetManifest: LEDGER },
        contentInputs: (): IAutoMovieProductionContentInput[] => afterContent,
        graph: (): never => {
          throw new Error("Model recipe hall fails its schema.");
        },
      }),
      enabled: true,
    }),
    {
      artifacts: {},
      fields: [...contentFingerprintFields(afterContent), unsafe],
      diagnostics: [
        {
          code: "content-input-unsafe",
          category: "error",
          phase: "source",
          target: "declared-content",
          path: null,
          message: "Model recipe hall fails its schema.",
        },
      ],
      assets: [],
      content: afterContent,
    },
  );
}
