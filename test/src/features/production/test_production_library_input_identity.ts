import type { IAutoMovieLibraryProjectStateProblem } from "../../../../packages/production/src/production/IAutoMovieLibraryProjectStateProblem";
import {
  type IAutoMovieProductionEvidence,
  createBlankAutoMovieProductionEvidence,
} from "@automovie/evidence";
import type {
  IAutoMovieGeneratedManifest,
} from "@automovie/interface";
import {
  AUTOMOVIE_PRODUCTION_BUILD_PROTOCOL,
  type IAutoMovieFingerprintField,
  type IAutoMovieProductionContentInput,
  canonicalizeAutoMovieJson,
  digestAutoMovieBytes,
  inspectAutoMovieLibraryProjectState,
  materializeAutoMovieLibraryFiles,
} from "@automovie/production";
import { TestValidator } from "@nestia/e2e";
import path from "node:path";

import { loadSourceModule } from "../internal/loadSourceModule";
import { namedFacts, throwsError } from "../internal/predicates";

/**
 * The resident snapshot fields this scenario reads; the rest stays opaque. This erased fixture view authenticates no source or physical root and chooses no runtime algorithm, cache or resource lifetime.
 *
 * @author Samchon
 */
interface ISnapshot {
  root: string;
  digest: string;
  configuration: { location: string };
  sources: readonly { path: string; digest: string | null }[];
}

/**
 * A portable fixture projection compared through canonical encoding, with configuration exposed for location checks. The erased view does not acquire, copy or validate runtime values; the projection and encoding operations own that work.
 *
 * @author Samchon
 */
type IPortable = Readonly<Record<string, unknown>> & {
  configuration: Readonly<Record<string, unknown>>;
};

const productionModule: (file: string) => string = (file: string): string =>
  path.resolve(
    __dirname,
    "../../../../packages/production/src/production",
    file,
  );

const snapshots: { captureAutoMovieLibraryAuthoringSnapshot(props: { root: string; evidence: IAutoMovieProductionEvidence; readSource: (path: string) => Uint8Array; }): ISnapshot; sameAutoMovieLibraryAuthoringSnapshot(left: ISnapshot, right: ISnapshot): boolean; } = loadSourceModule<{
  captureAutoMovieLibraryAuthoringSnapshot(props: {
    root: string;
    evidence: IAutoMovieProductionEvidence;
    readSource: (path: string) => Uint8Array;
  }): ISnapshot;
  sameAutoMovieLibraryAuthoringSnapshot(
    left: ISnapshot,
    right: ISnapshot,
  ): boolean;
}>(productionModule("libraryAuthoringSnapshot.ts"));
const { portableAutoMovieLibraryAuthoringSnapshot }: { portableAutoMovieLibraryAuthoringSnapshot(snapshot: ISnapshot): IPortable; } = loadSourceModule<{
  portableAutoMovieLibraryAuthoringSnapshot(snapshot: ISnapshot): IPortable;
}>(productionModule("portableAutoMovieLibraryAuthoringSnapshot.ts"));
const { libraryBuildInputFingerprint }: { libraryBuildInputFingerprint(props: { production: string; snapshot: ISnapshot; derivedFields: readonly IAutoMovieFingerprintField[]; }): string; } = loadSourceModule<{
  libraryBuildInputFingerprint(props: {
    production: string;
    snapshot: ISnapshot;
    derivedFields: readonly IAutoMovieFingerprintField[];
  }): string;
}>(productionModule("libraryBuildInputFingerprint.ts"));
const { contentFingerprintFields }: { contentFingerprintFields(inputs: readonly IAutoMovieProductionContentInput[]): IAutoMovieFingerprintField[]; } = loadSourceModule<{
  contentFingerprintFields(
    inputs: readonly IAutoMovieProductionContentInput[],
  ): IAutoMovieFingerprintField[];
}>(productionModule("productionBuildIdentity.ts"));

const HALL: string = "src/spaces/hall.ts";
const SHARED: string = "src/spaces/shared.ts";
const HELPER: string = "src/shared/geometry.ts";
const ASSET: string = "public/textures/stone.png";
const INDEX: string = "library/index.json";
const WINDOWS: string = "D:\\a\\x";
const POSIX: string = "/home/b/x";

/**
 * The independently changed input dimensions of this library identity scenario. These fixture fields preserve source, graph and adopted-byte distinctions; the type performs no admission, hashing or resource acquisition, and the scenario owns each supplied value.
 *
 * @author Samchon
 */
interface IVariant {
  /** Checkout root the evidence was read from. */
  root: string;

  /** Registered production namespace. */
  production: string;

  /** Graph-selected owner source. */
  hall: string;

  /** Helper inside the selected source population. */
  shared: string;

  /** Imported helper outside the selected source population. */
  helper: string;

  /** Adopted asset bytes. */
  asset: Uint8Array;

  /** Verified derived output bytes. */
  derived: Uint8Array;

  /** Authored target anchor of the owner edge. */
  anchor: string;

  /** Digest of the reviewed design H2. */
  unit: string;

  /** One selected configuration choice outside the owner branches. */
  materials: "disabled" | "draft";

  /** Whether the checkout wrote CRLF line endings and a byte order mark. */
  crlf: boolean;
}

const BASE: IVariant = {
  root: WINDOWS,
  production: "harbor",
  hall: 'import { width } from "./shared";\nexport const hall = { width };\n',
  shared: "export const width = 4;\n",
  helper: "export const span = 2;\n",
  asset: Buffer.from([1, 2, 3]),
  derived: Buffer.from("[0,1]\n", "utf8"),
  anchor: "hall",
  unit: "a".repeat(64),
  materials: "disabled",
  crlf: false,
};

const checkout: (text: string, crlf: boolean) => Uint8Array = (text: string, crlf: boolean): Uint8Array =>
  crlf
    ? Buffer.from(`\ufeff${text.replaceAll("\n", "\r\n")}`, "utf8")
    : Buffer.from(text, "utf8");

const evidenceOf: (variant: IVariant) => IAutoMovieProductionEvidence = (variant: IVariant): IAutoMovieProductionEvidence => {
  const sourceBinding: { branch: string; stage: string; enforced: boolean; root: string; files: string[]; symbols: string[]; paths: string[]; } = {
    branch: "spaceSources",
    stage: "review",
    enforced: true,
    root: ".",
    files: ["src/spaces/**/*.ts"],
    symbols: ["property"],
    paths: [HALL, SHARED],
  };
  return {
    root: variant.root,
    packageName: "harbor",
    description: "",
    configuration: {
      ...createBlankAutoMovieProductionEvidence(variant.root, "english"),
      kind: "library",
      settings: "review",
      spaces: "review",
      spaceSources: "review",
      materials: variant.materials,
    },
    manifest: {
      kind: "library",
      language: "english",
      populationScope: { mode: "complete-production" },
      branches: [
        { name: "settings", stage: "review" },
        { name: "spaces", stage: "review" },
        { name: "spaceSources", stage: "review" },
      ],
      bindings: [],
      localBindings: [],
      localAudits: [],
      topology: {
        branches: [],
        expected: [],
        declarations: [],
        diagnostics: [],
      },
    },
    designBranches: [
      { branch: "spaces", designStage: "review", sourceBinding },
    ],
    designOwners: [
      {
        branch: "spaces",
        path: "docs/spaces/hall.md",
        title: "Hall",
        units: [{ anchor: "hall", title: "Hall", digest: variant.unit }],
        sourceBinding,
      },
    ],
    sourceOwners: [
      {
        branch: "spaceSources",
        stage: "review",
        enforced: true,
        relationship: "lineage",
        sourcePath: HALL,
        exportName: "hall",
        symbolKind: "property",
        sourceDigest: digestAutoMovieBytes(Buffer.from(variant.hall, "utf8")),
        targetPath: "docs/spaces/hall.md",
        targetAnchor: variant.anchor,
      },
    ],
    contracts: [],
    contractRules: [],
  };
};

const capture: (variant: IVariant, builderRoot?: string) => ISnapshot = (
  variant: IVariant,
  builderRoot: string = variant.root,
): ISnapshot =>
  snapshots.captureAutoMovieLibraryAuthoringSnapshot({
    root: builderRoot,
    evidence: evidenceOf(variant),
    readSource: (file: string): Uint8Array<ArrayBufferLike> => {
      if (file === HALL) return checkout(variant.hall, variant.crlf);
      if (file === SHARED) return checkout(variant.shared, variant.crlf);
      throw new Error(`Unselected source ${file} was read.`);
    },
  });

const fingerprint: (variant: IVariant, snapshot?: ISnapshot) => string = (
  variant: IVariant,
  snapshot: ISnapshot = capture(variant),
): string =>
  libraryBuildInputFingerprint({
    production: variant.production,
    snapshot,
    derivedFields: [
      ...contentFingerprintFields([
        {
          path: HELPER,
          source: true,
          render: false,
          bytes: checkout(variant.helper, variant.crlf),
        },
        { path: ASSET, source: false, render: true, bytes: variant.asset },
      ]),
      { role: "derived-output", kind: "file", payload: variant.derived },
    ],
  });

const publish: (production: string, inputFingerprint: string) => { index: ReturnType<typeof materializeAutoMovieLibraryFiles>["index"]; manifest: IAutoMovieGeneratedManifest; bytes: Uint8Array<ArrayBufferLike>; } = (
  production: string,
  inputFingerprint: string,
): { index: ReturnType<typeof materializeAutoMovieLibraryFiles>["index"]; manifest: IAutoMovieGeneratedManifest; bytes: Uint8Array<ArrayBufferLike>; } => {
  const publication: { files: ReadonlyMap<string, Uint8Array>; index: ReturnType<typeof materializeAutoMovieLibraryFiles>["index"]; } = materializeAutoMovieLibraryFiles({
    production,
    builder: AUTOMOVIE_PRODUCTION_BUILD_PROTOCOL,
    inputFingerprint,
    results: [],
  });
  const bytes: Uint8Array<ArrayBufferLike> = publication.files.get(INDEX)!;
  const manifest: IAutoMovieGeneratedManifest = {
    version: 1,
    builder: {
      packageVersion: "0.0.0",
      protocolVersion: AUTOMOVIE_PRODUCTION_BUILD_PROTOCOL,
    },
    inputFingerprint,
    files: [
      {
        path: INDEX,
        owner: "builder",
        digest: digestAutoMovieBytes(bytes),
        sourceTargets: ["library"],
      },
    ],
  };
  return { index: publication.index, manifest, bytes };
};

const reopen: (production: string, published: ReturnType<typeof publish>) => string[] = (
  production: string,
  published: ReturnType<typeof publish>,
): string[] =>
  inspectAutoMovieLibraryProjectState({
    production,
    builder: published.manifest.builder.protocolVersion,
    inputFingerprint: published.manifest.inputFingerprint,
    authoringEvidence: { ...evidenceOf(BASE), sourceOwners: [] },
    manifest: published.manifest,
    readFile: (file: string): Uint8Array<ArrayBufferLike> | null => (file === INDEX ? published.bytes : null),
  }).problems.map((problem: IAutoMovieLibraryProjectStateProblem): string => problem.code);

/**
 * A library input identity names what was built, not where it was built.
 *
 * The authoring snapshot is acquired inside one checkout, so it carries the builder root and the declaration's absolute location beside the facts a library result depends on. The publication guard must keep comparing those resident facts, and the result identity must not see them. The same work under one namespace in two checkouts therefore shares one identity, while the namespace and every result-changing input still move it.
 *
 * Scenarios:
 *
 * 1. The same evidence and source bytes captured at `D:\a\x` and `/home/b/x` read
 *    the same normalized sources and keep different resident digests, so the
 *    guard refuses one against the other and accepts a repeated acquisition.
 *    Their portable projections lack exactly the root, the location and the
 *    digest over them, restore the resident snapshot when those three facts
 *    are put back, and are equal. The two checkouts, a CRLF and byte-order-mark
 *    checkout, and a repeated acquisition give one library input fingerprint.
 * 2. Evidence read from one checkout is refused by the other checkout's builder
 *    root, a separate assertion from the shared identity.
 * 3. Another namespace gives another fingerprint. Each published index records
 *    the namespace and the fingerprint that bound it, and the library state
 *    reader opens an index only under its own namespace.
 * 4. A selected source edit, a helper edit inside the selected population, an
 *    imported helper edit outside it, an owner anchor change, a design unit
 *    change, a configuration choice, an adopted asset edit, and a derived
 *    output edit each move the fingerprint. A line-ending-only helper edit does
 *    not.
 *
 * @evidence contracts/testing.md#behavioral-verification Captures resident library snapshots, computes portable identities, materializes publication metadata and reopens it, catching identities that depend on checkout or ignore namespace and result-changing inputs.
 * @evidence contracts/testing.md#independent-expectations Contract-derived equalities and inequalities separate resident guards from portable result identity, with literal selected source paths and publication refusal codes; reused digest and fingerprint helpers are not independent cryptographic oracles.
 * @evidence contracts/testing.md#distinguishing-cases Contrasts Windows and POSIX path spellings, repeated and CRLF/BOM acquisition, wrong checkout, namespace, selected and imported source, owner anchor, design digest, configuration, assets and derived bytes; real platform filesystem execution is not claimed.
 * @evidence contracts/testing.md#execution-ownership This named portable unit entry owns all resident callback cases and in-memory publication reads through the existing source fixtures; it installs no consumer and starts no process, browser or renderer.
 */
export function test_production_library_input_identity(): void {
  const windows: ISnapshot = capture(BASE);
  const posix: ISnapshot = capture({ ...BASE, root: POSIX });
  const recaptured: ISnapshot = capture(BASE);
  const selectedSources: { path: string; digest: string; }[] = [
    { path: HALL, digest: digestAutoMovieBytes(Buffer.from(BASE.hall)) },
    { path: SHARED, digest: digestAutoMovieBytes(Buffer.from(BASE.shared)) },
  ];
  TestValidator.equals(
    "both checkouts read the same normalized selected sources",
    [windows.sources, posix.sources],
    [selectedSources, selectedSources],
  );
  TestValidator.equals(
    "the resident guard still tells the checkouts apart",
    namedFacts([
      ["residentDigestsDiffer", (): boolean => windows.digest !== posix.digest],
      [
        "guardRefusesOtherCheckout",
        (): boolean =>
          snapshots.sameAutoMovieLibraryAuthoringSnapshot(windows, posix) ===
          false,
      ],
      [
        "guardAcceptsRepeatedAcquisition",
        (): boolean =>
          snapshots.sameAutoMovieLibraryAuthoringSnapshot(windows, recaptured),
      ],
    ]),
    {
      residentDigestsDiffer: true,
      guardRefusesOtherCheckout: true,
      guardAcceptsRepeatedAcquisition: true,
    },
  );

  const portable: IPortable = portableAutoMovieLibraryAuthoringSnapshot(windows);
  TestValidator.equals(
    "the portable projection drops exactly the location facts",
    namedFacts([
      ["rootDropped", (): boolean => "root" in portable === false],
      ["residentDigestDropped", (): boolean => "digest" in portable === false],
      ["locationDropped", (): boolean => "location" in portable.configuration === false],
      [
        "nothingElseDropped",
        (): boolean =>
          canonicalizeAutoMovieJson({
            ...portable,
            root: windows.root,
            digest: windows.digest,
            configuration: {
              ...portable.configuration,
              location: windows.configuration.location,
            },
          }) === canonicalizeAutoMovieJson(windows),
      ],
      [
        "checkoutsShareProjection",
        (): boolean =>
          canonicalizeAutoMovieJson(portable) ===
          canonicalizeAutoMovieJson(
            portableAutoMovieLibraryAuthoringSnapshot(posix),
          ),
      ],
    ]),
    {
      rootDropped: true,
      residentDigestDropped: true,
      locationDropped: true,
      nothingElseDropped: true,
      checkoutsShareProjection: true,
    },
  );

  const base: string = fingerprint(BASE, windows);
  TestValidator.equals(
    "one library input identity across checkouts",
    namedFacts([
      [
        "posixCheckout",
        (): boolean => fingerprint({ ...BASE, root: POSIX }, posix) === base,
      ],
      ["crlfCheckout", (): boolean => fingerprint({ ...BASE, crlf: true }) === base],
      ["repeatedAcquisition", (): boolean => fingerprint(BASE, recaptured) === base],
    ]),
    { posixCheckout: true, crlfCheckout: true, repeatedAcquisition: true },
  );
  TestValidator.equals(
    "evidence from another checkout is refused",
    throwsError((): ISnapshot => capture(BASE, POSIX), ["belongs to", "not builder root"]),
    true,
  );

  const annex: string = fingerprint({ ...BASE, production: "harbor-annex" }, windows);
  TestValidator.equals(
    "the namespace moves the identity",
    annex !== base,
    true,
  );
  const harborIndex: { index: ReturnType<typeof materializeAutoMovieLibraryFiles>["index"]; manifest: IAutoMovieGeneratedManifest; bytes: Uint8Array<ArrayBufferLike>; } = publish("harbor", base);
  const annexIndex: { index: ReturnType<typeof materializeAutoMovieLibraryFiles>["index"]; manifest: IAutoMovieGeneratedManifest; bytes: Uint8Array<ArrayBufferLike>; } = publish("harbor-annex", annex);
  TestValidator.equals(
    "each index records the namespace its identity bound",
    [
      [harborIndex.index.production, harborIndex.index.inputFingerprint],
      [annexIndex.index.production, annexIndex.index.inputFingerprint],
    ],
    [
      ["harbor", base],
      ["harbor-annex", annex],
    ],
  );
  TestValidator.equals(
    "the library state reader opens an index only under its namespace",
    [
      reopen("harbor", harborIndex),
      reopen("harbor-annex", harborIndex),
      reopen("harbor-annex", annexIndex),
    ],
    [[], ["library-index-invalid"], []],
  );

  const moved: (change: Partial<IVariant>) => boolean = (change: Partial<IVariant>): boolean =>
    fingerprint({ ...BASE, ...change }) !== base;
  TestValidator.equals(
    "every result-changing input moves the identity",
    {
      selectedSource: moved({ hall: `${BASE.hall}export const depth = 6;\n` }),
      populationHelper: moved({ shared: "export const width = 5;\n" }),
      importedHelper: moved({ helper: "export const span = 3;\n" }),
      ownerAnchor: moved({ anchor: "hall-east" }),
      designUnit: moved({ unit: "b".repeat(64) }),
      configuration: moved({ materials: "draft" }),
      adoptedAsset: moved({ asset: Buffer.from([1, 2, 4]) }),
      derivedOutput: moved({ derived: Buffer.from("[0,2]\n", "utf8") }),
      helperLineEndingsOnly: moved({
        helper: BASE.helper.replaceAll("\n", "\r\n"),
      }),
    },
    {
      selectedSource: true,
      populationHelper: true,
      importedHelper: true,
      ownerAnchor: true,
      designUnit: true,
      configuration: true,
      adoptedAsset: true,
      derivedOutput: true,
      helperLineEndingsOnly: false,
    },
  );
}
