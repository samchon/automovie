import type {
  IAutoMovieMotionTake,
  IAutoMovieMotionTakeProvenance,
} from "@automovie/interface";
import path from "node:path";
import { pathToFileURL } from "node:url";

import type { IMotionTakeSource } from "./IMotionTakeSource";
import { assertMotionTakeBindings } from "./assertMotionTakeBindings";
import { collectMotionTakeFiles } from "./collectMotionTakeFiles";
import { hashMotionTakeFile } from "./hashMotionTakeFile";
import { readMotionTakeInstalledLock } from "./readMotionTakeInstalledLock";
import { readMotionTakePackageVersion } from "./readMotionTakePackageVersion";
import { resolveMotionTakePath } from "./resolveMotionTakePath";

/**
 * Measure and rebuild the source explicitly selected by the production author.
 * A saved manifest can verify input bytes before the source is evaluated.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States who chooses the module, the pre-import guard and the provenance this host measures.
 * @evidence contracts/development/implementation.md#principled-implementation Measures the selected source's static files and installed identities against the saved provenance before importing the author-selected module. Calls its fixed export, checks callable owner inputs by binding identity and includes explicit assets in the provenance the caller verifies.
 * @evidence contracts/development/implementation.md#efficient-algorithms Builds one static graph per call to measure the current inputs. Reuses each static digest for explicit assets with the same reference and hashes the remaining assets after the provider returns. The process retains one digest per measured static file path and one identity per root and install ID to detect changes after a module has loaded. Those records last until process exit, and the call holds no persistent handles.
 */
export async function readMotionTakeSource(
  root: string,
  module: string,
  saved?: IAutoMovieMotionTake,
): Promise<{
  recipe: IMotionTakeSource;
  provenance: IAutoMovieMotionTakeProvenance;
}> {
  const exportName: string = "createMotionTakeSource";
  if (
    saved &&
    (saved.source.module !== module || saved.source.export !== exportName)
  )
    throw new Error(
      "take-provenance: independently selected source differs from the saved source",
    );

  const graph: Awaited<ReturnType<typeof collectMotionTakeFiles>> =
    await collectMotionTakeFiles(root, module);
  const measured: Map<string, string> = new Map(
    graph.files.map(({ path, sha256 }): [string, string] => [path, sha256]),
  );
  const expected: Map<string, string> = new Map(
    saved?.provenance.files.map(({ path, sha256 }): [string, string] => [
      path,
      sha256,
    ]),
  );
  for (const [reference, digest] of measured) {
    if (saved && digest !== expected.get(reference))
      throw new Error(
        `take-provenance: files[${reference}].sha256 changed since save`,
      );
    const loaded: string | undefined = LOADED_FILES.get(
      path.join(root, reference),
    );
    if (loaded !== undefined && loaded !== digest)
      throw new Error(
        `take-provenance: source changed in this process at ${reference}; reopen in a fresh process`,
      );
  }

  const installed: Map<string, string> = new Map();
  const resolved: Set<string> = new Set();
  for (const { name, issuer } of [
    { name: "@automovie/engine", issuer: "package.json" },
    { name: "@automovie/motions", issuer: "package.json" },
    ...graph.packages,
  ]) {
    const key: string = `${path.dirname(issuer)}\u0000${name}`;
    if (resolved.has(key)) continue;
    resolved.add(key);
    const version: string = await readMotionTakePackageVersion(
      root,
      name,
      issuer,
    );
    const id: string = `npm:${name}`;
    const previous: string | undefined = installed.get(id);
    if (previous !== undefined && previous !== version)
      throw new Error(
        `take-provenance: ${name} resolves to multiple versions in the source graph`,
      );
    installed.set(id, version);
  }
  const lock: string | undefined = await readMotionTakeInstalledLock(root);
  if (lock !== undefined) installed.set("install:pnpm-lock", lock);
  const currentInstall: Map<string, string> = new Map(installed);
  if (lock === undefined) currentInstall.set("install:pnpm-lock", "");
  for (const [id, version] of currentInstall) {
    const loaded: string | undefined = LOADED_INSTALL.get(`${root}\u0000${id}`);
    if (loaded !== undefined && loaded !== version)
      throw new Error(
        `take-provenance: installed dependency changed in this process at ${id}; reopen in a fresh process`,
      );
  }
  const expectedInstalled: Map<string, string> = new Map(
    saved?.provenance.providers
      .filter(({ id }) => /^(?:npm|install):/u.test(id))
      .map(({ id, version }): [string, string] => [id, version]),
  );
  if (
    saved &&
    (expectedInstalled.size !== installed.size ||
      [...installed].some(
        ([id, version]) => expectedInstalled.get(id) !== version,
      ))
  )
    throw new Error(
      "take-provenance: installed dependency versions or lockfile changed since save",
    );

  const sourcePath: string = await resolveMotionTakePath(root, module, "read");
  for (const [reference, digest] of measured)
    LOADED_FILES.set(path.join(root, reference), digest);
  for (const [id, version] of currentInstall)
    LOADED_INSTALL.set(`${root}\u0000${id}`, version);
  const producer: {
    createMotionTakeSource?: () =>
      | IMotionTakeSource
      | Promise<IMotionTakeSource>;
  } = await import(pathToFileURL(sourcePath).href);
  if (typeof producer.createMotionTakeSource !== "function")
    throw new Error(`Motion take source ${module} must export ${exportName}()`);
  const recipe: IMotionTakeSource = await producer.createMotionTakeSource();
  assertMotionTakeBindings(recipe);

  const files: IAutoMovieMotionTakeProvenance["files"][number][] = [];
  for (const path of [
    ...new Set([...graph.files.map((file) => file.path), ...recipe.assets]),
  ].sort((left, right) => (left < right ? -1 : left > right ? 1 : 0))) {
    const sha256: string =
      measured.get(path) ??
      (await hashMotionTakeFile(
        await resolveMotionTakePath(root, path, "read"),
      ));
    files.push({ path, sha256 });
  }
  return {
    recipe,
    provenance: {
      files,
      providers: [
        ...[...installed].map(([id, version]) => ({ id, version })),
        ...recipe.bindings.map(({ id, version }) => ({ id, version })),
      ],
      seeds: [
        ...recipe.seeds,
        ...Object.entries(recipe.human).map(([shot, input]) => ({
          id: `human:${shot}`,
          value: input.seed,
        })),
      ],
    },
  };
}

/** File digests associated with source modules already loaded by this process. */
const LOADED_FILES: Map<string, string> = new Map();

/** Installed dependency identities already used under each production root. */
const LOADED_INSTALL: Map<string, string> = new Map();
