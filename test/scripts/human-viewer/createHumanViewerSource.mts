/**
 * Disk input and import-graph ownership for the resident viewer. The host
 * creates this once; refreshBases updates the external input digests before
 * the import graph receives a change. Catalogue reads share that same basis
 * identity memo so thumbnails and numerical requests use one cache authority.
 */
import fs from "node:fs";
import path from "node:path";

import { createHumanViewerRevisions } from "./createHumanViewerRevisions";
import { createHumanViewerBasisMemo } from "./createHumanViewerBasisMemo";
import type { IReadHumanViewerCatalogueProps } from "./IReadHumanViewerCatalogueProps";
import type { IHumanViewerGenerationFiles } from "./IHumanViewerGenerationFiles";
import { createHumanViewerSidecarFacts } from "./createHumanViewerSidecarFacts";
import { readHumanViewerPublishedGeneration } from "./readHumanViewerPublishedGeneration";
import { readHumanViewerCatalogue } from "./readHumanViewerCatalogue.mjs";

/**
 * Open the published input and source revision owners for one server directory.
 * The host refreshes basis versions before publishing a source edit batch;
 * catalogue readers share that memo and the graph's current domain digests.
 *
 * @evidence contracts/common.md#principled-implementation Input-byte versions and reached import graphs jointly identify the numerical generations without rehashing unchanged large bases.
 * @evidence contracts/common.md#clear-and-simple-design One source owner supplies the paths, memo and graph to watching and catalogue publication.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Cache authority follows actual inputs and imports rather than particular subjects or measurement outcomes.
 * @evidence contracts/common.md#meaningful-documentation Describes input ownership, refresh ordering and catalogue dependency.
 */
export function createHumanViewerSource(directory: string) {
  const root = path.resolve(directory, "../../..");
  const storage = path.join(root, ".shots/human-viewer");
  const basisFiles = {
    face: path.join(
      root,
      "test/studies/human-face/connected-basis/global-face/basis.json.gz",
    ),
    body: path.join(
      root,
      "test/studies/human-body/connected-basis/basis.json.gz",
    ),
  };
  /** The published one-skin person generation views, read off the request path. */
  const generationFiles: IHumanViewerGenerationFiles = {
    head: path.join(root, "test/studies/human-person/generation/head.json.gz"),
    body: path.join(root, "test/studies/human-person/generation/body.json.gz"),
  };
  const documentsFile = path.join(
    root,
    "test/studies/human-face/connected-basis/global-face/subjects.json",
  );
  const inputsDirectory = path.join(storage, "inputs");
  const slash = (file: string): string => file.replaceAll("\\", "/");
  const rootPath = slash(root);
  const playground = (file: string): string =>
    `${rootPath}/packages/playground/src/human/${file}`;
  const readText = (file: string): string | undefined => {
    try {
      return fs.readFileSync(file, "utf8");
    } catch {
      return undefined;
    }
  };
  /** Digest and identity of a large input file, recomputed only when it changes on disk. */
  const basisOf = createHumanViewerBasisMemo({
    stamp: (file) => { const stat = fs.statSync(file); return `${stat.mtimeMs}:${stat.size}`; },
    read: (file) => fs.readFileSync(file),
  });
  /** The published bases and subject list: inputs no import graph names. */
  const basisDigest = (): string =>
    [...Object.values(basisFiles), documentsFile]
      .map((file) => basisOf(file).digest)
      .join("");
  let bases = basisDigest();
  // Each digest covers only what its build imports, so an edit to the eye never
  // invalidates a body document and a test or screen invalidates nothing.
  const revisions = createHumanViewerRevisions({
    root: rootPath,
    entries: {
      browser: ["page.mts", "host.mts", "scene.html", "view.html"].map(
        (name) => `${slash(directory)}/${name}`,
      ),
      face: [
        playground("common/connectedAsset.ts"),
        playground("common/connectedRuntime.ts"),
      ],
      body: [
        playground("common/connectedAsset.ts"),
        playground("body/connectedBodyRuntime.ts"),
      ],
      person: [
        playground("common/connectedAsset.ts"),
        playground("person/createConnectedPersonRuntime.ts"),
      ],
    },
    extra: [
      "pnpm-lock.yaml",
      "config/tsconfig.json",
      "packages/human/tsconfig.json",
      "packages/human/package.json",
      "test/package.json",
    ].map((file) => `${rootPath}/${file}`),
    bases: () => bases,
    io: {
      exists: (file) => fs.existsSync(file) && fs.statSync(file).isFile(),
      read: readText,
    },
  });
  const watched = [
    "human",
    "engine",
    "interface",
    "viewer",
    "playground",
  ].map((name) => path.join(root, "packages", name, "src"));
  watched.push(directory);
  // Candidate sidecars are read off the request path; when one becomes known
  // the host republishes its catalogue through the registered listener.
  let sidecarListener = (): void => {};
  // The host binds the page's admission once its page exists.
  let admission: IReadHumanViewerCatalogueProps["admission"];
  const sidecars = createHumanViewerSidecarFacts({
    stamp: (name) => {
      const stat = fs.statSync(path.join(inputsDirectory, name));
      return `${stat.mtimeMs}:${stat.size}`;
    },
    stream: (name) => fs.createReadStream(path.join(inputsDirectory, name)),
    changed: () => sidecarListener(),
    kind: (name) => name.endsWith(".person.json.gz") ? "person" : "basis",
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
  const generation = () => readHumanViewerPublishedGeneration({
    files: { head: path.relative(root, generationFiles.head).replaceAll("\\", "/"),
      body: path.relative(root, generationFiles.body).replaceAll("\\", "/") },
    exists: (view) => fs.existsSync(generationFiles[view]),
    facts: (view) => views.facts(generationFiles[view]),
  });
  const catalogue = () =>
    readHumanViewerCatalogue({
      basisFiles,
      documentsFile,
      inputsDirectory,
      basisOf,
      revisions: revisions.current(),
      sidecar: sidecars.facts,
      generation,
      admission,
    });
  return { root, storage, basisFiles, generationFiles, documentsFile, inputsDirectory, slash,
    revisions, watched, catalogue, refreshBases: () => { bases = basisDigest(); },
    /** Register the host's republication for sidecars whose facts became known. */
    sidecarsChanged: (listener: () => void): void => { sidecarListener = listener; },
    /** The sidecar reader, whose reads a rescan waits for. */
    sidecars,
    /** The generation view reader, whose reads a rescan waits for too. */
    views,
    /** Bind the page owner's document admission. */
    admitWith: (judge: NonNullable<IReadHumanViewerCatalogueProps["admission"]>): void => { admission = judge; } };
}
