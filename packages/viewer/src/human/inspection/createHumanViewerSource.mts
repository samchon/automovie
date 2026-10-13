/**
 * Disk input and import-graph ownership for the resident viewer. The host
 * creates this once; refreshBases updates the external input digests before
 * the import graph receives a change. Catalogue reads share that same basis
 * identity memo so thumbnails and numerical requests use one cache authority.
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

/**
 * Open the published input and source revision owners for one server directory.
 * The host refreshes basis versions before publishing a source edit batch;
 * catalogue readers share that memo and the graph's current domain digests.
 * Application-owned paths and factories supply every named example. One
 * checked-loader scope feeds both numerical startup witnesses and the browser
 * admission revision; unrelated checked-project edits leave model keys intact.
 *
 * @evidence contracts/common.md#principled-implementation Input-byte versions and reached import graphs jointly identify the numerical generations without rehashing unchanged large bases.
 * @evidence contracts/common.md#clear-and-simple-design One source owner supplies the paths, memo and graph to watching and catalogue publication.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Cache authority follows actual inputs and imports rather than particular subjects or measurement outcomes.
 * @evidence contracts/common.md#meaningful-documentation Describes input ownership, refresh ordering and catalogue dependency.
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-editor-state Shared input and checked-source authority prevents a prepared inspection candidate from becoming the current document result under changed source.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-editor Application-owned examples and one existing checked Node scope feed catalogue, numerical startup and browser admission without replacing domain construction or changing numerical-cache meaning.
 */
export function createHumanViewerSource(
  directory: string,
  applicationDirectory: string,
  exampleSources: IHumanViewerExampleSources,
) {
  const root = path.resolve(directory, "../../../../..");
  const storage = humanViewerStorage(
    root,
    process.env.HUMAN_VIEWER_STORAGE_ROOT,
  );
  const referenceDirectory = path.join(
    humanViewerStorage(root, undefined),
    "references",
  );
  const basisFiles = {
    face: path.join(
      root,
      "packages/human/assets/face/basis.json.gz",
    ),
    body: path.join(
      root,
      "packages/human/assets/body/basis.json.gz",
    ),
  };
  /** The published one-skin person generation views, read off the request path. */
  /** The source owner's subject people on the published generation. */
  const { subjectPeopleFile, documentsFile, bodyExamplesFile, cameraPosesFile } = exampleSources;
  const generationFiles: IHumanViewerGenerationFiles = {
    head: path.join(root, "packages/human/assets/person/head.json.gz"),
    body: path.join(root, "packages/human/assets/person/body.json.gz"),
  };
  const inputsDirectory = path.join(storage, "inputs");
  const slash = (file: string): string => file.replaceAll("\\", "/");
  const rootPath = slash(root);
  const human = (file: string): string =>
    `${rootPath}/packages/human/src/${file}`;
  /** Digest and identity of a large input file, recomputed only when it changes on disk. */
  const basisOf = createHumanViewerBasisMemo({
    stamp: (file) => {
      const stat = fs.statSync(file);
      return `${stat.mtimeMs}:${stat.size}`;
    },
    read: (file) => fs.readFileSync(file),
  });
  /** Each input file's entries, kept while the file and what it depends on are unchanged. */
  const inputsMemo = new Map<string, IHumanViewerInputFileRead>();
  /** The face documents, kept while the subject list, face basis and face source are unchanged. */
  const faceMemo: IHumanViewerFaceDocumentsMemo = {
    signature: null,
    value: null,
  };
  /** The published bases and subject list: inputs no import graph names. */
  const basisDigest = (): string =>
    [...Object.values(basisFiles), documentsFile]
      .map((file) => basisOf(file).digest)
      .join("");
  let bases = basisDigest();
  const watched = ["human", "engine", "interface", "viewer", "playground"].map(
    (name) => path.join(root, "packages", name, "src"),
  );
  watched.push(directory, applicationDirectory);
  const numericalRequire = createRequire(path.join(directory, "numerical-worker.mts"));
  const checkedInputs: IHumanViewerNodeInputScope = {
    directories: [...watched],
    files: [
      "pnpm-lock.yaml", "pnpm-workspace.yaml", "config/tsconfig.json",
      "packages/playground/package.json", "packages/playground/tsconfig.json",
      path.join(applicationDirectory, "tsconfig.json"), "packages/playground/lint.config.ts",
      "packages/viewer/tsconfig.json", "packages/viewer/lint.config.ts",
      numericalRequire.resolve("ttsc/register"), numericalRequire.resolve("ttsc/package.json"),
      numericalRequire.resolve("devalue"),
      ...["human", "engine", "interface", "viewer", "playground"].flatMap((name) => [
        path.join(root, "packages", name, "package.json"),
        path.join(root, "packages", name, "tsconfig.json"),
      ]),
    ].map((file) => path.resolve(root, file)),
  };
  watched.push(...checkedInputs.files);
  // Numerical-domain digests follow their existing import graphs. The browser
  // admission digest also includes the complete checked Node byte/membership
  // witness, so a checked project edit can renew a candidate without changing
  // unrelated face, body or person computation-cache keys.
  const revisions = createHumanViewerRevisionsWorker({
    checkedInputs,
    root: rootPath,
    entries: {
      browser: [
        ...["page.mts", "numerical-worker.mts"].map((name) => `${slash(directory)}/${name}`),
        ...["host.mts", "scene.html", "view.html"].map((name) => `${slash(applicationDirectory)}/${name}`),
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
    ].map((file) => `${rootPath}/${file}`),
    bases: () => bases,
    io: createNodeHumanViewerResolveIo(root),
    worker: path.join(directory, "revisions-worker.mts"),
  });
  // Candidate sidecars are read off the request path; when one becomes known
  // the host republishes its catalogue through the registered listener.
  let sidecarListener = (): void => {};
  // The host binds the page's admission once its page exists.
  let admission: IReadHumanViewerCatalogueProps["admission"];
  let peekAdmission: IReadHumanViewerCatalogueProps["admission"];
  const sidecars = createHumanViewerSidecarFacts({
    stamp: (name) => {
      const stat = fs.statSync(path.join(inputsDirectory, name));
      return `${stat.mtimeMs}:${stat.size}`;
    },
    stream: (name) => fs.createReadStream(path.join(inputsDirectory, name)),
    changed: () => sidecarListener(),
    kind: (name) =>
      name.endsWith(".person.json.gz")
        ? "person"
        : name.endsWith(".head.json.gz") || name.endsWith(".body.json.gz")
          ? "view"
          : "basis",
  });
  const views = createHumanViewerSidecarFacts({
    stamp: (file) => {
      const stat = fs.statSync(file);
      return `${stat.mtimeMs}:${stat.size}`;
    },
    stream: (file) => fs.createReadStream(file),
    changed: () => sidecarListener(),
    kind: () => "view",
  });
  const generation = () =>
    readHumanViewerPublishedGeneration({
      files: {
        head: path.relative(root, generationFiles.head).replaceAll("\\", "/"),
        body: path.relative(root, generationFiles.body).replaceAll("\\", "/"),
      },
      exists: (view) => fs.existsSync(generationFiles[view]),
      facts: (view) => views.facts(generationFiles[view]),
    });
  /** An owned sidecar selects its own authority; the input owner still checks every required member and basis identity. */
  const hasOwnInput = (doc: string): boolean => {
    if (!doc.startsWith("file:")) return false;
    const stem = doc.slice(5).split("/")[0];
    if (!/^[A-Za-z0-9._-]+$/.test(stem)) return false;
    return [".basis.json.gz", ".person.json.gz", ".head.json.gz", ".body.json.gz"]
      .some((suffix) => fs.existsSync(path.join(inputsDirectory, stem + suffix)));
  };
  const catalogue = (selectedDoc?: string, admitAll = false) =>
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
    numericalInputs: () => readHumanViewerNodeInputs(root, checkedInputs.directories, checkedInputs.files),
    catalogue,
    hasOwnInput,
    refreshBases: () => {
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
