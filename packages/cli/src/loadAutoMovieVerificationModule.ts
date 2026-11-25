import { createHash } from "node:crypto";
import { realpathSync, statSync } from "node:fs";
import {
  type LoadHookSync,
  type ResolveHookSync,
  createRequire,
  registerHooks,
} from "node:module";
import * as path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import type { IAutoMovieVerification } from "./IAutoMovieVerification";
import { createAutoMovieVerificationInputScope } from "./createAutoMovieVerificationInputScope";
import { importAutoMovieVerificationEntry } from "./importAutoMovieVerificationEntry.mjs";
import { readAutoMovieErrorCode } from "./readAutoMovieErrorCode";

export async function loadAutoMovieVerificationModule(
  root: string,
  module: string,
): Promise<{
  readonly targets: readonly IAutoMovieVerification[];
  readonly sources: (file: string | undefined) => ReadonlyMap<string, string>;
}> {
  const directory: string = realpathSync.native(root);
  const load: NodeJS.Require = createRequire(
    path.join(directory, "package.json"),
  );
  const entry: string = realpathSync.native(
    load.resolve(path.resolve(directory, module)),
  );
  const entryUrl: string = pathToFileURL(entry).href;
  const isJson: boolean = path.extname(entry) === ".json";
  const prior: Set<NodeJS.Module | undefined> = new Set(
    Object.values(load.cache),
  );
  const names: Map<string, string> = new Map([[entry, entry]]);
  const local = (file: string): string | undefined => {
    if (
      !path.isAbsolute(file) ||
      path.relative(directory, file).split(path.sep).includes("node_modules")
    )
      return undefined;
    const known: string | undefined = names.get(file);
    if (known !== undefined) return known;
    const physical: string = realpathSync.native(file);
    names.set(file, physical);
    return physical;
  };
  const fromUrl = (url: string | undefined): string | undefined =>
    url?.startsWith("file:") === true ? fileURLToPath(url) : undefined;
  const edges: Map<string, Set<string>> = new Map([[entry, new Set()]]);
  const digests: Map<string, string | null> = new Map();
  let entryFormat: ReturnType<LoadHookSync>["format"];
  const trackResolve: ResolveHookSync = (specifier, context, next) => {
    const importer: string | undefined = fromUrl(context.parentURL);
    const parent: string | undefined =
      importer === undefined ? undefined : names.get(importer);
    const children: Set<string> | undefined =
      parent === undefined ? undefined : edges.get(parent);
    const result: ReturnType<ResolveHookSync> =
      children !== undefined && parent !== undefined
        ? resolveProjectImport(directory, parent, specifier, context, next)
        : next(specifier, context);
    if (children !== undefined || specifier === entryUrl) {
      const filename: string | undefined = fromUrl(result.url);
      const child: string | undefined =
        filename === undefined ? undefined : local(filename);
      if (child !== undefined) {
        children?.add(child);
        if (!edges.has(child)) edges.set(child, new Set());
      }
    }
    return result;
  };
  const trackLoad: LoadHookSync = (url, context, next) => {
    const result: ReturnType<LoadHookSync> = next(url, context);
    const filename: string | undefined = fromUrl(url);
    const file: string | undefined =
      filename === undefined ? undefined : names.get(filename);
    if (file !== undefined && edges.has(file)) {
      if (
        (result.format === "module" || result.format === "module-typescript") &&
        context.conditions.includes("require")
      )
        throw new Error(
          `Use a native import to verify the source of ${path.relative(directory, file)}. CommonJS require can return an earlier ES module evaluation.`,
        );

      if (file === entry) entryFormat = result.format;
      const raw: typeof result.source = result.source;
      const measured: string | null =
        raw === null || raw === undefined
          ? null
          : createHash("sha256")
              .update(raw instanceof ArrayBuffer ? new Uint8Array(raw) : raw)
              .digest("hex");
      const former: string | null | undefined = digests.get(file);
      digests.set(
        file,
        former === undefined || former === measured ? measured : null,
      );
    }
    return result;
  };
  const hooks: ReturnType<typeof registerHooks> = registerHooks({
    resolve: trackResolve,
    load: trackLoad,
  });
  let namespace: { default?: unknown } | null | undefined;
  try {
    namespace = (
      isJson ? load(entry) : await importAutoMovieVerificationEntry(entryUrl)
    ) as typeof namespace;
  } finally {
    hooks.deregister();
  }

  const common: Map<string, NodeJS.Module> = new Map();
  for (const [native, file] of names) {
    const loaded: NodeJS.Module | undefined = load.cache[native];
    if (loaded !== undefined) common.set(file, loaded);
  }
  for (const [file, children] of edges) {
    const parent: NodeJS.Module | undefined = common.get(file);
    if (parent === undefined) continue;
    if (prior.has(parent)) digests.set(file, null);
    for (const child of parent.children) {
      const dependency: string | undefined = local(child.filename);
      if (dependency === undefined) continue;
      children.add(dependency);
      common.set(dependency, child);
      if (!edges.has(dependency)) edges.set(dependency, new Set());
      if (prior.has(child)) digests.set(dependency, null);
    }
  }
  const sources = (file: string | undefined): ReadonlyMap<string, string> => {
    const selected: string = file ?? entry;
    const visited: Set<string> = new Set([selected]);
    const measured: Map<string, string> = new Map();
    for (const current of visited) {
      const reference: string = path.relative(directory, current);
      const hash: string | null | undefined = digests.get(current);
      if (!edges.has(current))
        throw new Error(
          `Verification source was not loaded by ${module}: ${reference}.`,
        );
      if (typeof hash !== "string")
        throw new Error(
          `Verification source could not be observed: ${reference}. Run verify in a fresh process.`,
        );
      measured.set(reference, hash);
      for (const child of edges.get(current)!) visited.add(child);
    }
    return new Map(
      [...measured].sort(([left], [right]) =>
        left < right ? -1 : left > right ? 1 : 0,
      ),
    );
  };
  await createAutoMovieVerificationInputScope(directory).verifySources(
    sources(undefined),
  );
  const targets: unknown =
    entryFormat === "commonjs" || entryFormat === "commonjs-typescript"
      ? (namespace?.default as typeof namespace)?.default
      : namespace?.default;
  if (!Array.isArray(targets))
    throw new Error(`${module} must default-export verification targets.`);
  return { targets, sources };
}

function resolveProjectImport(
  root: string,
  parent: string,
  specifier: string,
  context: Parameters<ResolveHookSync>[1],
  next: Parameters<ResolveHookSync>[2],
): ReturnType<ResolveHookSync> {
  try {
    return next(specifier, context);
  } catch (error) {
    const code: unknown = readAutoMovieErrorCode(error);
    if (
      (code !== "ERR_MODULE_NOT_FOUND" &&
        code !== "MODULE_NOT_FOUND" &&
        code !== "ERR_UNSUPPORTED_DIR_IMPORT") ||
      (!specifier.startsWith("./") && !specifier.startsWith("../")) ||
      path.extname(specifier) !== "" ||
      /[?#\\]/u.test(specifier) ||
      !within(root, parent)
    )
      throw error;
    for (const candidate of [
      `${specifier}.ts`,
      `${specifier.replace(/\/$/u, "")}/index.ts`,
    ]) {
      const file: string = path.resolve(path.dirname(parent), candidate);
      if (
        within(root, file) &&
        statSync(file, { throwIfNoEntry: false })?.isFile() === true &&
        within(root, realpathSync.native(file))
      )
        return next(candidate, context);
    }
    throw error;
  }
}

function within(root: string, file: string): boolean {
  const relative: string = path.relative(root, file);
  return (
    !path.isAbsolute(relative) &&
    relative !== ".." &&
    !relative.startsWith(`..${path.sep}`)
  );
}
