/**
 * Disk input and import-graph ownership for the resident viewer. The host creates this once; refreshBases updates the external input digests before the import graph receives a change. Catalogue reads share that same basis identity memo so thumbnails and numerical requests use one cache authority.
 */
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

import type { IHumanViewerFaceDocumentsMemo } from "./IHumanViewerFaceDocumentsMemo.js";
import type { IHumanViewerGenerationFiles } from "./IHumanViewerGenerationFiles.js";
import type { IHumanViewerInputFileRead } from "./IHumanViewerInputFileRead.js";
import type { HumanViewerBodyExamples } from "./HumanViewerBodyExamples.js";
import type { IHumanViewerExampleSources } from "./IHumanViewerExampleSources.js";
import type { IReadHumanViewerCatalogueProps } from "./IReadHumanViewerCatalogueProps.js";
import { createHumanViewerBasisMemo } from "./createHumanViewerBasisMemo.js";
import { createHumanViewerRevisionsWorker } from "./createHumanViewerRevisionsWorker.js";
import { createHumanViewerSidecarFacts } from "./createHumanViewerSidecarFacts.js";
import { createNodeHumanViewerResolveIo } from "./createNodeHumanViewerResolveIo.js";
import { humanViewerStorage } from "./humanViewerStorage.js";
import { readHumanViewerCatalogue } from "./readHumanViewerCatalogue.mjs";
import { readHumanViewerPublishedGeneration } from "./readHumanViewerPublishedGeneration.js";
import { readHumanViewerNodeInputs } from "./readHumanViewerNodeInputs.js";
import type { IHumanViewerNodeInputScope } from "./IHumanViewerNodeInputScope.js";
import { createAutoMovieResourceRetirement } from "../../createAutoMovieResourceRetirement.js";

/**
 * Open the published input and source revision owners for one server directory. The host refreshes basis versions before publishing a source edit batch; catalogue readers share that memo and the graph's current domain digests. Application-owned paths and factories supply every named example. The repository ships no basis or person generation; published ones are files an operator places in the ignored storage's `published` directory. One checked-loader scope feeds both numerical startup witnesses and the browser admission revision; unrelated checked-project edits leave model keys intact. File identity memoization uses mtime/size stamps, which can collide after an in-place rewrite that preserves both values; this adapter does not certify a fresh byte digest in that case. Close retires the revision worker and waits for already-started sidecar reads after withdrawing catalogue notifications.
 *
 * @evidence contracts/common.md#principled-implementation The source owner joins actual published paths, basis identity, checked Node inputs and runtime dependency revisions in the existing catalogue reader and refresh order.
 * @evidence contracts/common.md#clear-and-simple-design One server directory owns path facts, input memos, sidecar readers and the revision worker while application example declarations remain supplied by their owner.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No basis or person asset is invented, independent sidecars still undergo required member/identity checks, and mtime/size equivalence is disclosed as a limited provider stamp rather than fresh byte proof.
 * @evidence contracts/common.md#meaningful-documentation Documentation identifies application input ownership, shared cache authority, checked-source scope, stamp collision limits and worker/read retirement.
 * @evidence contracts/performance.md#efficient-algorithms Catalogue work delegates to memoized input and asynchronous sidecar readers; revision batches compute the existing source graph and checked input witness, while path construction is fixed startup work.
 * @evidence contracts/performance.md#reuse-equivalent-work Catalogue readers share basis and document memos keyed by their existing source/input authority; stamp-based reuse cannot distinguish same-size same-mtime byte rewrites and is not claimed stronger.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Server close clears local document memos, withdraws notifications, waits for started reads and terminates the revision worker; reader fact maps retain encountered files without an independent cap until their server owner becomes unreachable.
 */
export function createHumanViewerSource(
  directory: string,
  applicationDirectory: string,
  exampleSources: IHumanViewerExampleSources,
): {
  root: string;
  storage: string;
  referenceDirectory: string;
  basisFiles: IReadHumanViewerCatalogueProps["basisFiles"];
  generationFiles: IHumanViewerGenerationFiles;
  documentsFile: string;
  subjectPeopleFile: string | undefined;
  bodyExamplesFile: string;
  cameraPosesFile: string;
  inputsDirectory: string;
  slash: (file: string) => string;
  revisions: ReturnType<typeof createHumanViewerRevisionsWorker>;
  watched: string[];
  numericalInputs: () => ReturnType<typeof readHumanViewerNodeInputs>;
  catalogue: (selectedDoc?: string, admitAll?: boolean) => ReturnType<typeof readHumanViewerCatalogue>;
  hasOwnInput: (doc: string) => boolean;
  refreshBases: () => void;
  sidecarsChanged: (listener: () => void) => void;
  sidecars: ReturnType<typeof createHumanViewerSidecarFacts>;
  views: ReturnType<typeof createHumanViewerSidecarFacts>;
  admitWith: (judge: NonNullable<IReadHumanViewerCatalogueProps["admission"]>, peek?: NonNullable<IReadHumanViewerCatalogueProps["admission"]>) => void;
  close: () => Promise<void>;
} {
  const root: string = path.resolve(directory, "../../../../..");
  const storage: string = humanViewerStorage(
    root,
    process.env.HUMAN_VIEWER_STORAGE_ROOT,
  );
  const referenceDirectory: string = path.join(
    humanViewerStorage(root, undefined),
    "references",
  );
  const publishedDirectory: string = path.join(storage, "published");
  const basisFiles: IReadHumanViewerCatalogueProps["basisFiles"] = {
    face: path.join(publishedDirectory, "face.basis.json.gz"),
    body: path.join(publishedDirectory, "body.basis.json.gz"),
  };
  /** The published one-skin person generation views, read off the request path. */
  /** The source owner's subject people on the published generation. */
  const { subjectPeopleFile, documentsFile, bodyExamplesFile, cameraPosesFile }: IHumanViewerExampleSources = exampleSources;
  const generationFiles: IHumanViewerGenerationFiles = {
    head: path.join(publishedDirectory, "person.head.json.gz"),
    body: path.join(publishedDirectory, "person.body.json.gz"),
  };
  const inputsDirectory: string = path.join(storage, "inputs");
  const slash: (file: string) => string = (file: string): string => file.replaceAll("\\", "/");
  const rootPath: string = slash(root);
  const human: (file: string) => string = (file: string): string =>
    `${rootPath}/packages/human/src/${file}`;
  /** Digest and identity of a large input file, recomputed only when it changes on disk. */
  const basisOf: ReturnType<typeof createHumanViewerBasisMemo> = createHumanViewerBasisMemo({
    stamp: (file: string): string => {
      const stat: fs.Stats = fs.statSync(file);
      return `${stat.mtimeMs}:${stat.size}`;
    },
    read: (file: string): Buffer => fs.readFileSync(file),
  });
  /** Each input file's entries, kept while the file and what it depends on are unchanged. */
  const inputsMemo: Map<string, IHumanViewerInputFileRead> = new Map();
  /** The face documents, kept while the subject list, face basis and face source are unchanged. */
  const faceMemo: IHumanViewerFaceDocumentsMemo = {
    signature: null,
    value: null,
  };
  /** The published bases and subject list: inputs no import graph names. */
  const basisDigest: () => string = (): string =>
    [...Object.values(basisFiles), documentsFile]
      .map((file: string): string => basisOf(file).digest)
      .join("");
  let bases: string = basisDigest();
  const watched: string[] = ["human", "engine", "interface", "viewer", "playground"].map(
    (name: string): string => path.join(root, "packages", name, "src"),
  );
  watched.push(directory, applicationDirectory);
  const numericalRequire: ReturnType<typeof createRequire> = createRequire(path.join(directory, "numerical-worker.mts"));
  const checkedInputs: IHumanViewerNodeInputScope = {
    directories: [...watched],
    files: [
      "pnpm-lock.yaml", "pnpm-workspace.yaml", "config/tsconfig.json",
      "packages/playground/package.json", "packages/playground/tsconfig.json",
      path.join(applicationDirectory, "tsconfig.json"), "packages/playground/lint.config.ts",
      "packages/viewer/tsconfig.json", "packages/viewer/lint.config.ts",
      numericalRequire.resolve("ttsc/register"), numericalRequire.resolve("ttsc/package.json"),
      numericalRequire.resolve("devalue"),
      ...["human", "engine", "interface", "viewer", "playground"].flatMap((name: string): string[] => [
        path.join(root, "packages", name, "package.json"),
        path.join(root, "packages", name, "tsconfig.json"),
      ]),
    ].map((file: string): string => path.resolve(root, file)),
  };
  watched.push(...checkedInputs.files);
  // Numerical-domain digests follow their existing import graphs. The browser
  // admission digest also includes the complete checked Node byte/membership
  // witness, so a checked project edit can renew a candidate without changing
  // unrelated face, body or person computation-cache keys.
  const revisions: ReturnType<typeof createHumanViewerRevisionsWorker> = createHumanViewerRevisionsWorker({
    checkedInputs,
    root: rootPath,
    entries: {
      browser: [
        ...["page.mts", "numerical-worker.mts"].map((name: string): string => `${slash(directory)}/${name}`),
        ...["host.mts", "scene.html", "view.html"].map((name: string): string => `${slash(applicationDirectory)}/${name}`),
      ],
      face: [
        human("face/runtime/createConnectedFaceRuntime.ts"),
      ],
      body: [
        human("body/runtime/createConnectedBodyRuntime.ts"),
        human("human/runtime/createConnectedBodyGenerationRuntime.ts"),
      ],
      person: [
        human("human/runtime/createConnectedPersonRuntime.ts"),
      ],
    },
    extra: [
      "pnpm-lock.yaml",
      "config/tsconfig.json",
      "packages/human/tsconfig.json",
      "packages/viewer/tsconfig.json",
      "packages/human/package.json",
      "packages/playground/package.json",
      "packages/viewer/package.json",
    ].map((file: string): string => `${rootPath}/${file}`),
    bases: (): string => bases,
    io: createNodeHumanViewerResolveIo(root),
    worker: path.join(directory, "revisions-worker.mts"),
  });
  // Candidate sidecars are read off the request path; when one becomes known
  // the host republishes its catalogue through the registered listener.
  let sidecarListener: () => void = (): void => {};
  // The host binds the page's admission once its page exists.
  let admission: IReadHumanViewerCatalogueProps["admission"];
  let peekAdmission: IReadHumanViewerCatalogueProps["admission"];
  const sidecars: ReturnType<typeof createHumanViewerSidecarFacts> = createHumanViewerSidecarFacts({
    stamp: (name: string): string => {
      const stat: fs.Stats = fs.statSync(path.join(inputsDirectory, name));
      return `${stat.mtimeMs}:${stat.size}`;
    },
    stream: (name: string): fs.ReadStream => fs.createReadStream(path.join(inputsDirectory, name)),
    changed: (): void => sidecarListener(),
    kind: (name: string): "person" | "view" | "basis" =>
      name.endsWith(".person.json.gz")
        ? "person"
        : name.endsWith(".head.json.gz") || name.endsWith(".body.json.gz")
          ? "view"
          : "basis",
  });
  const views: ReturnType<typeof createHumanViewerSidecarFacts> = createHumanViewerSidecarFacts({
    stamp: (file: string): string => {
      const stat: fs.Stats = fs.statSync(file);
      return `${stat.mtimeMs}:${stat.size}`;
    },
    stream: (file: string): fs.ReadStream => fs.createReadStream(file),
    changed: (): void => sidecarListener(),
    kind: (): "view" => "view",
  });
  const generation: () => ReturnType<typeof readHumanViewerPublishedGeneration> = (): ReturnType<typeof readHumanViewerPublishedGeneration> =>
    readHumanViewerPublishedGeneration({
      files: {
        head: path.relative(root, generationFiles.head).replaceAll("\\", "/"),
        body: path.relative(root, generationFiles.body).replaceAll("\\", "/"),
      },
      exists: (view: "head" | "body"): boolean => fs.existsSync(generationFiles[view]),
      facts: (view: "head" | "body"): ReturnType<typeof views.facts> => views.facts(generationFiles[view]),
    });
  /** An owned sidecar selects its own authority; the input owner still checks every required member and basis identity. */
  const hasOwnInput: (doc: string) => boolean = (doc: string): boolean => {
    if (!doc.startsWith("file:")) return false;
    const stem: string = doc.slice(5).split("/")[0];
    if (!/^[A-Za-z0-9._-]+$/.test(stem)) return false;
    return [".basis.json.gz", ".person.json.gz", ".head.json.gz", ".body.json.gz"]
      .some((suffix: string): boolean => fs.existsSync(path.join(inputsDirectory, stem + suffix)));
  };
  const catalogue: (selectedDoc?: string, admitAll?: boolean) => ReturnType<typeof readHumanViewerCatalogue> = (selectedDoc?: string, admitAll: boolean = false): ReturnType<typeof readHumanViewerCatalogue> =>
    readHumanViewerCatalogue({
      exampleSources,
      bodyExamples: JSON.parse(fs.readFileSync(bodyExamplesFile, "utf8")) as HumanViewerBodyExamples,
      selectedDoc,
      independentInput: selectedDoc !== undefined && hasOwnInput(selectedDoc),
      basisFiles,
      documentsFile,
      subjectPeopleFile,
      inputsDirectory,
      inputsMemo,
      faceMemo,
      basisOf,
      revisions: revisions.current(),
      sidecar: sidecars.facts,
      generation,
      admission: selectedDoc !== undefined || admitAll ? admission : peekAdmission,
    });
  return {
    root,
    storage,
    referenceDirectory,
    basisFiles,
    generationFiles,
    documentsFile,
    subjectPeopleFile,
    bodyExamplesFile,
    cameraPosesFile,
    inputsDirectory,
    slash,
    revisions,
    watched,
    numericalInputs: (): ReturnType<typeof readHumanViewerNodeInputs> => readHumanViewerNodeInputs(root, checkedInputs.directories, checkedInputs.files),
    catalogue,
    hasOwnInput,
    refreshBases: (): void => {
      bases = basisDigest();
    },
    /** Register the host's republication for sidecars whose facts became known. */
    sidecarsChanged: (listener: () => void): void => {
      sidecarListener = listener;
    },
    /** The sidecar reader, whose reads a rescan waits for. */
    sidecars,
    /** The generation view reader, whose reads a rescan waits for too. */
    views,
    close: createAutoMovieResourceRetirement([
      (): void => {
        sidecarListener = (): void => {};
        inputsMemo.clear();
        faceMemo.signature = null;
        faceMemo.value = null;
      },
      revisions.close,
      async (): Promise<void> => { await Promise.all([sidecars.settled(), views.settled()]); },
    ]),
    /** Bind the page owner's document admission. */
    admitWith: (
      judge: NonNullable<IReadHumanViewerCatalogueProps["admission"]>,
      peek: NonNullable<IReadHumanViewerCatalogueProps["admission"]> = judge,
    ): void => {
      admission = judge;
      peekAdmission = peek;
    },
  };
}
