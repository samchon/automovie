import { sourceSnapshotLibraryEvidence } from "../internal/sourceSnapshotLibraryEvidence";
import {
  type IAutoMovieProductionEvidence,
  type IAutoMovieProductionEvidenceSourceOwnerBinding,
  createBlankAutoMovieProductionEvidence,
} from "@automovie/evidence";
import type {
  IAutoMovieGeneratedManifest,
  IAutoMovieShotContract,
} from "@automovie/interface";
import type {
  IAutoMovieProductionContentInput,
  IAutoMovieProductionDesignGraph,
} from "@automovie/production";
import { TestValidator } from "@nestia/e2e";
import path from "node:path";

import { throwsError } from "../internal/predicates";
import type { IAutoMovieProductionSourceSnapshot as ISourceStatusSnapshot } from "../../../../packages/production/src/production/IAutoMovieProductionSourceSnapshot";
import { textDigest } from "./sourceStatus/textDigest";
import { acquireAutoMovieProductionSourceSnapshot } from "../../../../packages/production/src/production/acquireAutoMovieProductionSourceSnapshot";
import { authoringEvidenceFingerprintFields } from "../../../../packages/production/src/production/authoringEvidenceFingerprintFields";
import { contentFingerprintFields } from "../../../../packages/production/src/production/contentFingerprintFields";
import { productionBuildInputFingerprint } from "../../../../packages/production/src/production/productionBuildInputFingerprint";
import { captureAutoMovieLibraryAuthoringSnapshot } from "../../../../packages/production/src/production/captureAutoMovieLibraryAuthoringSnapshot";
import { libraryBuildInputFingerprint } from "../../../../packages/production/src/production/libraryBuildInputFingerprint";
import { canonicalizeAutoMovieJson } from "@automovie/engine";

const identity: {
  authoringEvidenceFingerprintFields: typeof authoringEvidenceFingerprintFields;
  contentFingerprintFields: typeof contentFingerprintFields;
  productionBuildInputFingerprint: typeof productionBuildInputFingerprint;
} = { authoringEvidenceFingerprintFields, contentFingerprintFields, productionBuildInputFingerprint };

const ROOT: string = path.join(path.parse(process.cwd()).root, "workspace", "harbor");
const OPENING: string = "export const opening = defineShot({ beats: 3 });\n";
const HALL: string = "export const hall = { width: 4 };\n";
const HALL_EDITED: string = "export const hall = { width: 5 };\n";

const CONTENT: IAutoMovieProductionContentInput[] = [
  {
    path: "src/shots/opening.ts",
    source: true,
    render: false,
    bytes: Buffer.from(OPENING, "utf8"),
  },
  {
    path: "public/textures/sail.png",
    source: false,
    render: true,
    bytes: Buffer.from([7, 8, 9]),
  },
];

const GRAPH: IAutoMovieProductionDesignGraph = {
  production: null,
  models: new Map(),
  world: null,
  formations: new Map(),
  shots: new Map([
    [
      "opening",
      {
        id: "opening",
        source: { module: "src/shots/opening.ts", export: "opening" },
      } as unknown as IAutoMovieShotContract,
    ],
  ]),
  acceptance: new Map(),
};

const SCREENPLAY_INDEX: { version: number; treatment: { path: string; sequences: never[]; }; } = {
  version: 1,
  treatment: { path: "docs/treatment.md", sequences: [] },
};

const DOCUMENTS: Map<string, string> = new Map<string, string>([
  ["docs/screenplays/001-harbor.md", "INT. HARBOR - NIGHT"],
  ["docs/treatment.md", "A harbor at night."],
]);

const GENERATED: Map<string, Uint8Array<ArrayBufferLike>> = new Map<string, Uint8Array>([
  ["shots/opening.json", Buffer.from("compiled opening", "utf8")],
  ["manifests/compile.json", Buffer.from("compiled registry", "utf8")],
]);

const manifestOf: () => IAutoMovieGeneratedManifest = (): IAutoMovieGeneratedManifest => ({
  version: 1,
  builder: { packageVersion: "0.1.0", protocolVersion: "unit" },
  inputFingerprint: textDigest("an earlier compile"),
  files: [
    {
      path: "shots/opening.json",
      owner: "builder",
      digest: textDigest("compiled opening"),
      sourceTargets: ["shot:opening"],
    },
  ],
});

const sourceOwner: (props: { branch: string; text: string; sourcePath: string; exportName: string; targetPath: string; }) => IAutoMovieProductionEvidenceSourceOwnerBinding = (props: {
  branch: string;
  text: string;
  sourcePath: string;
  exportName: string;
  targetPath: string;
}): IAutoMovieProductionEvidenceSourceOwnerBinding => ({
  branch: props.branch,
  stage: "review",
  enforced: true,
  relationship: "lineage",
  sourcePath: props.sourcePath,
  exportName: props.exportName,
  symbolKind: "property",
  sourceDigest: textDigest(props.text),
  targetPath: props.targetPath,
  targetAnchor: props.exportName,
});

const filmEvidenceOf: () => IAutoMovieProductionEvidence = (): IAutoMovieProductionEvidence => ({
  root: ROOT,
  packageName: "harbor",
  description: "",
  configuration: {
    ...createBlankAutoMovieProductionEvidence(ROOT, "english"),
    kind: "film",
    settings: "review",
    shots: "review",
  },
  manifest: {
    kind: "film",
    language: "english",
    populationScope: { mode: "complete-production" },
    branches: [
      { name: "settings", stage: "review" },
      { name: "shots", stage: "review" },
    ],
    bindings: [],
    localBindings: [],
    localAudits: [],
    topology: { branches: [], expected: [], declarations: [], diagnostics: [] },
  },
  designBranches: [],
  designOwners: [],
  sourceOwners: [
    sourceOwner({
      branch: "shots",
      text: OPENING,
      sourcePath: "src/shots/opening.ts",
      exportName: "opening",
      targetPath: "docs/screenplays/001-harbor.md",
    }),
  ],
  contracts: [],
  contractRules: [],
});

const libraryEvidenceOf: (root: string) => IAutoMovieProductionEvidence = (root: string): IAutoMovieProductionEvidence =>
  sourceSnapshotLibraryEvidence(root, HALL, sourceOwner);

const projectOf: (overrides?: Record<string, unknown>) => { root: string; productionId: string; archetypes: undefined; revision: () => number; graph: () => IAutoMovieProductionDesignGraph; readSource: (file: string) => Uint8Array; contentInputs: () => IAutoMovieProductionContentInput[]; manifest: () => Record<string, never>; screenplayIndex: () => { version: number; treatment: { path: string; sequences: never[]; }; }; readProseDocument: (file: string) => string | null; generatedManifest: () => IAutoMovieGeneratedManifest; generatedRoot: () => string; readGeneratedFile: (file: string) => Uint8Array; } = (overrides: Record<string, unknown> = {}): { root: string; productionId: string; archetypes: undefined; revision: () => number; graph: () => IAutoMovieProductionDesignGraph; readSource: (file: string) => Uint8Array; contentInputs: () => IAutoMovieProductionContentInput[]; manifest: () => Record<string, never>; screenplayIndex: () => { version: number; treatment: { path: string; sequences: never[]; }; }; readProseDocument: (file: string) => string | null; generatedManifest: () => IAutoMovieGeneratedManifest; generatedRoot: () => string; readGeneratedFile: (file: string) => Uint8Array; } => ({
  root: ROOT,
  productionId: "harbor",
  archetypes: undefined,
  revision: (): number => 3,
  graph: (): IAutoMovieProductionDesignGraph => GRAPH,
  readSource: (file: string): Uint8Array => {
    if (file === "src/shots/opening.ts") return Buffer.from(OPENING, "utf8");
    if (file === "src/spaces/hall.ts") return Buffer.from(HALL, "utf8");
    throw new Error(`Source "${file}" does not exist.`);
  },
  contentInputs: (): IAutoMovieProductionContentInput[] => CONTENT,
  manifest: (): Record<string, never> => ({}),
  screenplayIndex: (): { version: number; treatment: { path: string; sequences: never[]; }; } => SCREENPLAY_INDEX,
  readProseDocument: (file: string): string | null =>
    DOCUMENTS.get(file) ?? null,
  generatedManifest: (): IAutoMovieGeneratedManifest => manifestOf(),
  generatedRoot: (): string => path.join(ROOT, "generated", "harbor"),
  readGeneratedFile: (file: string): Uint8Array => {
    const bytes: Uint8Array<ArrayBufferLike> | undefined = GENERATED.get(file);
    if (bytes === undefined)
      throw new Error(`Generated file "${file}" is a symlink or junction.`);
    return bytes;
  },
  ...overrides,
});

const listed: (root: string) => string[] = (root: string): string[] =>
  ["shots/opening.json", "stray.lnk", "manifests/compile.json"].map((file: string): string =>
    path.join(root, ...file.split("/")),
  );

/**
 * A fresh source snapshot names every input a gate answer depends on.
 *
 * No authored source is executed. A timed production's input identity must be the builder's own field projection over the current evidence, design, source and content, and a library's must be its namespace-bound identity over the resident authoring snapshot and content closure, with the resident digest beside it. The screenplay index, requested documents and every entry under the builder-owned root are read as they stand. A revision that moves during the read, or an identity that cannot be derived, leaves no snapshot, and a read the project handle refuses propagates.
 *
 * Scenarios:
 *
 * 1. A timed production reports its revision, the builder field projection of
 *    its evidence, shot source, absent film source and content, no resident
 *    digest, the canonical screenplay index digest, the requested documents
 *    once each in path order with an absent one as `null`, and every generated
 *    entry in path order with an unreadable one as `null`.
 * 2. A timed production without authoring evidence hashes no owner-binding
 *    field, and a production without a screenplay index or generated manifest
 *    reports both as `null` and an empty generated root.
 * 3. A revision that moves between the first and last read, and an identity whose
 *    design cannot be read, report no snapshot.
 * 4. A screenplay read the project handle refuses propagates its error.
 * 5. A library reports its resident authoring digest and its namespace-bound
 *    identity over that snapshot and content. Another namespace moves only the
 *    identity, a source edit moves both, and evidence from another checkout is
 *    refused.
 *
 * @evidence contracts/testing.md#behavioral-verification Acquires current timed and library source snapshots and checks their revision, identity and observed document/generated digests, catching missing inputs, moving revisions and swallowed refused reads.
 * @evidence contracts/testing.md#independent-expectations Literal revision, sorted paths, null absence and refusal outcomes derive from the snapshot contract; expected digests and builder fingerprints reuse production helpers, so this checks composition and change sensitivity rather than independent hashing correctness.
 * @evidence contracts/testing.md#distinguishing-cases Covers duplicate and absent documents, unreadable generated entries, absent evidence/index/manifest, moving revision, unreadable design, propagated incarnation refusal, namespace changes, edited source and mismatched checkout evidence; actual filesystem descriptor safety belongs to owning project tests.
 * @evidence contracts/testing.md#execution-ownership This named portable unit entry owns all supplied project/list/read callbacks through actual source imports. Empty manifest disables native derivation reads; it installs no consumer and starts no native artifact or production host. Direct imports expose the existing minimal-project/class type mismatch for the dedicated later port repair; graph/shot/screenplay fixtures establish only fields read here, not full domain admission.
 */
export function test_production_source_snapshot_acquisition(): void {
  const filmEvidence: IAutoMovieProductionEvidence = filmEvidenceOf();
  const manifest: IAutoMovieGeneratedManifest = manifestOf();
  const timed: ISourceStatusSnapshot | null = acquireAutoMovieProductionSourceSnapshot({
    project: projectOf(),
    authoring: filmEvidence,
    documents: [
      "docs/treatment.md",
      "docs/screenplays/001-harbor.md",
      "docs/treatment.md",
      "docs/missing.md",
    ],
    listFiles: listed,
  });
  TestValidator.equals("a timed snapshot names every gate input", timed, {
    revision: 3,
    inputFingerprint: identity.productionBuildInputFingerprint(
      "harbor",
      GRAPH,
      [
        ...identity.authoringEvidenceFingerprintFields(filmEvidence),
        {
          role: "source:opening",
          kind: "typescript",
          payload: Buffer.from(OPENING, "utf8"),
        },
        { role: "source:film", kind: "absent", payload: new Uint8Array() },
      ],
      identity.contentFingerprintFields(CONTENT),
    ),
    resident: null,
    screenplay: textDigest(canonicalizeAutoMovieJson(SCREENPLAY_INDEX)),
    documents: [
      { path: "docs/missing.md", digest: null },
      {
        path: "docs/screenplays/001-harbor.md",
        digest: textDigest("INT. HARBOR - NIGHT"),
      },
      { path: "docs/treatment.md", digest: textDigest("A harbor at night.") },
    ],
    generated: {
      inputFingerprint: manifest.inputFingerprint,
      manifest: textDigest(canonicalizeAutoMovieJson(manifest)),
      files: [
        {
          path: "manifests/compile.json",
          digest: textDigest("compiled registry"),
        },
        { path: "shots/opening.json", digest: textDigest("compiled opening") },
        { path: "stray.lnk", digest: null },
      ],
    },
  });

  TestValidator.equals(
    "a timed production without evidence hashes no owner edges",
    acquireAutoMovieProductionSourceSnapshot({
      project: projectOf(),
      authoring: undefined,
      documents: [],
      listFiles: (): never[] => [],
    })?.inputFingerprint,
    identity.productionBuildInputFingerprint(
      "harbor",
      GRAPH,
      [
        {
          role: "source:opening",
          kind: "typescript",
          payload: Buffer.from(OPENING, "utf8"),
        },
        { role: "source:film", kind: "absent", payload: new Uint8Array() },
      ],
      identity.contentFingerprintFields(CONTENT),
    ),
  );

  const bare: ISourceStatusSnapshot | null = acquireAutoMovieProductionSourceSnapshot({
    project: projectOf({
      screenplayIndex: (): null => null,
      generatedManifest: (): null => null,
    }),
    authoring: filmEvidence,
    documents: [],
    listFiles: (): never[] => [],
  });
  TestValidator.equals(
    "a production without screenplay or output reports both absent",
    { screenplay: bare?.screenplay, generated: bare?.generated },
    {
      screenplay: null,
      generated: { inputFingerprint: null, manifest: null, files: [] },
    },
  );

  const revisions: number[] = [3, 4];
  TestValidator.equals(
    "a moving revision or an underivable identity leaves no snapshot",
    {
      movingRevision: acquireAutoMovieProductionSourceSnapshot({
        project: projectOf({ revision: (): number | undefined => revisions.shift() }),
        authoring: filmEvidence,
        documents: [],
        listFiles: listed,
      }),
      unreadableDesign: acquireAutoMovieProductionSourceSnapshot({
        project: projectOf({
          graph: (): never => {
            throw new Error("Shot contract opening fails its schema.");
          },
        }),
        authoring: filmEvidence,
        documents: [],
        listFiles: listed,
      }),
    },
    { movingRevision: null, unreadableDesign: null },
  );
  TestValidator.equals(
    "a refused read propagates its own error",
    throwsError(
      (): ISourceStatusSnapshot | null =>
        acquireAutoMovieProductionSourceSnapshot({
          project: projectOf({
            screenplayIndex: (): never => {
              throw new Error("Production state incarnation changed.");
            },
          }),
          authoring: filmEvidence,
          documents: [],
          listFiles: listed,
        }),
      "incarnation changed",
    ),
    true,
  );

  const library: (overrides: Record<string, unknown>, evidence?: IAutoMovieProductionEvidence) => ISourceStatusSnapshot = (
    overrides: Record<string, unknown>,
    evidence: IAutoMovieProductionEvidence = libraryEvidenceOf(ROOT),
  ): ISourceStatusSnapshot =>
    acquireAutoMovieProductionSourceSnapshot({
      project: projectOf(overrides),
      authoring: evidence,
      documents: [],
      listFiles: listed,
    })!;
  const libraryIdentity: (production: string, hall: string) => { resident: string; inputFingerprint: string; } = (production: string, hall: string): { resident: string; inputFingerprint: string; } => {
    const snapshot: ReturnType<typeof captureAutoMovieLibraryAuthoringSnapshot> = captureAutoMovieLibraryAuthoringSnapshot({
      root: ROOT,
      evidence: libraryEvidenceOf(ROOT),
      readSource: (): Buffer<ArrayBuffer> => Buffer.from(hall, "utf8"),
    });
    return {
      resident: snapshot.digest,
      inputFingerprint: libraryBuildInputFingerprint({
        production,
        snapshot,
        derivedFields: identity.contentFingerprintFields(CONTENT),
      }),
    };
  };
  const base: ISourceStatusSnapshot = library({});
  const annex: ISourceStatusSnapshot = library({ productionId: "harbor-annex" });
  const edited: ISourceStatusSnapshot = library({
    readSource: (): Buffer<ArrayBuffer> => Buffer.from(HALL_EDITED, "utf8"),
  });
  TestValidator.equals(
    "a library snapshot carries its resident guard and namespace-bound identity",
    [base, annex, edited].map((snapshot: ISourceStatusSnapshot): { resident: string | null; inputFingerprint: string; } => ({
      resident: snapshot.resident,
      inputFingerprint: snapshot.inputFingerprint,
    })),
    [
      libraryIdentity("harbor", HALL),
      libraryIdentity("harbor-annex", HALL),
      libraryIdentity("harbor", HALL_EDITED),
    ],
  );
  TestValidator.equals(
    "the namespace moves only the identity and a source edit moves both",
    {
      annexResidentKept: annex.resident === base.resident,
      annexIdentityMoved: annex.inputFingerprint !== base.inputFingerprint,
      editResidentMoved: edited.resident !== base.resident,
      editIdentityMoved: edited.inputFingerprint !== base.inputFingerprint,
    },
    {
      annexResidentKept: true,
      annexIdentityMoved: true,
      editResidentMoved: true,
      editIdentityMoved: true,
    },
  );
  TestValidator.equals(
    "library evidence from another checkout is refused",
    throwsError(
      (): ISourceStatusSnapshot =>
        library(
          {},
          libraryEvidenceOf(
            path.join(path.parse(ROOT).root, "elsewhere", "harbor"),
          ),
        ),
      "belongs to",
    ),
    true,
  );
}
