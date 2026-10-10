import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { TtscCompiler } from "ttsc";

import { assertHumanSourceCompilerObservations } from "./assertHumanSourceCompilerObservations.ts";
import { compareHumanSourceNames } from "./compareHumanSourceNames.ts";
import type { IHumanSourceGenerationInput } from "./structures/IHumanSourceGenerationInput.ts";
import type { IHumanSourceProducerClosure } from "./structures/IHumanSourceProducerClosure.ts";
import type { IHumanSourceProducerObservation } from "./structures/IHumanSourceProducerObservation.ts";

/**
 * Directory of the anatomical assembly chain's registration generators. They
 * author the interior parts from a compiled body view and are no input of
 * the head and body source generation, so they stay outside this closure;
 * that chain binds their bytes in its own registration and join receipts.
 */
const ANATOMICAL_ASSEMBLY_PRODUCER = "body-anatomy";

/**
 * Owning project and complete offline source population for another producer.
 * Both paths resolve within the repository; the actual entry must belong to that
 * source directory. Compiler observations retain every resolved dependency.
 *
 * @author Samchon
 */
interface ProducerProjectContext {
  /** Actual owning tsconfig; its directory is the native graph's path base. */
  projectFile: string;

  /** Complete offline producer tree, including its actual entry. */
  sourceDirectory: string;
}

/**
 * Pin a production compiler's language-semantic producer closure.
 *
 * The native compiler's resolved reference graph, including type-only edges,
 * globals and configurations, owns reachability. Portable resolved edges
 * and realized file bytes enter content identity. Absent lookup candidates
 * and directory membership are checked for stability within this run but
 * stay outside content identity: an unused lookup at a different ancestor
 * directory must not give the same resolved program a different identity.
 * A resolved directory resource retains every descendant file's bytes and
 * its directory membership observations; it is not a realized source file.
 * This graph-only pass uses the canonical no-plugin project context; the
 * running ttsx entry and its dependency owners retain their configured
 * checks and transforms. Numerical producers imported from body-basis and
 * the libraries therefore enter the same byte identity as the local source
 * scripts. JSON kernel modules enter through their real resolved edges.
 *
 * The graph comes from the source producer's own project
 * (`tsconfig.human-source.json`): the source scripts and what they import.
 * Review, viewer and assembly scripts belong to other projects, so their
 * type state and edits neither enter this identity nor stop this producer.
 * Another producer may supply its owning project and complete offline source
 * directory; that changes the graph context, never its stability verifier.
 *
 * The local source directory also contains offline producer inputs and an
 * upstream lock, which a TypeScript graph cannot import. Their existing
 * whole-directory population remains covered, except the anatomical assembly
 * chain's generators named above and dependency infrastructure under node_modules.
 * That generated/installed tree is not authored offline input; the native graph
 * independently pins its actually resolved files and directory resources.
 * Compiler artifacts share the repository cache outside the authored population.
 * Package lock and workspace
 * configuration pin external runtime code and tool versions; the graph's
 * external declarations and metadata are addressed by package name/version,
 * never an absolute machine path. Platform executable identity belongs to
 * run-environment evidence, not portable content identity.
 *
 * Raw byte identity includes formatting. A formatter change requires this
 * producer to regenerate and verify the candidate; a layout-only commit
 * cannot retain a stale manifest. The default entry is the full generation
 * compiler; an intermediate production stage supplies its own actual entry
 * so unrelated library consumers do not become that stage's dependencies.
 * A concurrent producer or resolver change
 * is refused before publication by the returned run-local verifier.
 */
export function readHumanSourceProducerClosure(
  repository: string,
  entryFile: string = "test/scripts/human-source/compile-source-generation.ts",
  context?: ProducerProjectContext,
): IHumanSourceProducerClosure {
  const projectFile = context === undefined
    ? path.join(repository, "test/tsconfig.human-source.json")
    : path.resolve(repository, context.projectFile);
  // Native graph paths are project-relative, not relative to the process cwd.
  const project = path.dirname(projectFile);
  const sourceDirectory = path.resolve(repository,
    context?.sourceDirectory ?? "test/scripts/human-source");
  if (context !== undefined) {
    for (const file of [projectFile, sourceDirectory]) {
      const relative = path.relative(repository, file);
      if (relative === ".." || relative.startsWith(".." + path.sep) || path.isAbsolute(relative))
        throw new Error("Source producer context must stay within its repository.");
    }
    const relativeEntry = path.relative(sourceDirectory, path.resolve(repository, entryFile));
    if (relativeEntry === ".." || relativeEntry.startsWith(".." + path.sep) || path.isAbsolute(relativeEntry))
      throw new Error("Source producer entry must belong to its declared source directory.");
  }
  const result = new TtscCompiler({
    cwd: project,
    tsconfig: projectFile,
    cacheDir: path.join(repository, "node_modules/.cache/ttsc"),
    plugins: false,
  }).transform();
  if (result.type !== "success")
    throw new Error(
      `Source producer graph could not be compiled: ${JSON.stringify(result)}`,
    );
  const graph = result.graph;
  if (graph === undefined)
    throw new Error(
      "Source producer identity requires the compiler's resolved reference graph.",
    );
  const absolute = (file: string): string => path.resolve(project, file);
  const keyOf = new Map(
    Object.keys(graph.edges).map((file) => [absolute(file), file]),
  );
  const entry = path.join(repository, entryFile);
  if (!keyOf.has(entry))
    throw new Error(
      `Source producer graph does not contain production entry ${entryFile}.`,
    );
  const reached = new Set<string>();
  const pending = [entry];
  while (pending.length !== 0) {
    const file = pending.pop()!;
    if (reached.has(file)) continue;
    reached.add(file);
    const key = keyOf.get(file);
    if (key !== undefined)
      for (const dependency of graph.edges[key])
        pending.push(absolute(dependency));
  }
  const paths = new Set(reached);
  const resolvedFiles = new Set<string>();
  const directoryResources: string[] = [];
  for (const file of reached) {
    const stat = fs.statSync(file);
    if (stat.isFile()) resolvedFiles.add(file);
    else if (stat.isDirectory()) directoryResources.push(file);
    else throw new Error("Resolved producer resource has no file/directory identity: " + file);
  }
  const contentPaths = new Set(resolvedFiles);
  for (const file of [
    ...graph.globals,
    ...graph.configs,
    ...(graph.resolutionInputs ?? []),
    ...(result.hostInputs ?? []),
  ]) {
    const resolved = absolute(file);
    paths.add(resolved);
    if (fs.existsSync(resolved) && fs.statSync(resolved).isFile())
      contentPaths.add(resolved);
  }
  for (const file of reached) {
    const key = keyOf.get(file);
    if (key !== undefined)
      for (const candidate of graph.candidates?.[key] ?? [])
        paths.add(absolute(candidate));
  }
  const failures = Object.entries(graph.inputProofFailures ?? {}).filter(
    ([file]) => paths.has(absolute(file)),
  );
  if (failures.length !== 0)
    throw new Error(
      `Source producer graph has unproved filesystem inputs: ${JSON.stringify(failures)}`,
    );
  const realized = new Set([
    ...resolvedFiles,
    ...graph.globals.map(absolute),
    ...graph.configs.map(absolute),
  ]);
  assertHumanSourceCompilerObservations(graph, project, paths, realized);
  const offline = (directory: string, resource = false, ancestors = new Set<string>()): void => {
    const physical = fs.realpathSync.native(directory);
    if (ancestors.has(physical))
      throw new Error("Producer resource directory contains a physical cycle: " + directory);
    const ancestry = new Set(ancestors).add(physical);
    if (resource) paths.add(directory);
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      if (
        !resource && (entry.name === "__pycache__" || entry.name === "node_modules" ||
          (entry.name === ANATOMICAL_ASSEMBLY_PRODUCER &&
            sourceDirectory === path.resolve(repository, "test/scripts/human-source")))
      )
        continue;
      const file = path.join(directory, entry.name);
      const stat = fs.statSync(file);
      if (stat.isDirectory()) offline(file, resource, ancestry);
      else if (stat.isFile()) {
        paths.add(file);
        contentPaths.add(file);
      } else throw new Error("Producer resource has no file/directory identity: " + file);
    }
  };
  if (context !== undefined) paths.add(sourceDirectory);
  offline(sourceDirectory);
  for (const directory of directoryResources) offline(directory, true);
  paths.add(path.join(repository, "pnpm-lock.yaml"));
  paths.add(path.join(repository, "pnpm-workspace.yaml"));
  contentPaths.add(path.join(repository, "pnpm-lock.yaml"));
  contentPaths.add(path.join(repository, "pnpm-workspace.yaml"));
  const sha = (bytes: Uint8Array | string): string =>
    crypto.createHash("sha256").update(bytes).digest("hex");
  const portable = (file: string): string => {
    const relative = path.relative(repository, file).replaceAll("\\", "/");
    if (
      !relative.startsWith("../") &&
      !path.isAbsolute(relative) &&
      !relative.split("/").includes("node_modules")
    )
      return relative;
    let directory =
      fs.existsSync(file) && fs.statSync(file).isDirectory()
        ? file
        : path.dirname(file);
    for (;;) {
      const manifest = path.join(directory, "package.json");
      if (fs.existsSync(manifest)) {
        const identity = JSON.parse(
          fs.readFileSync(manifest, "utf8"),
        ) as Record<string, unknown>;
        if (
          typeof identity.name === "string" &&
          typeof identity.version === "string"
        )
          return `dependency/${identity.name}@${identity.version}/${path.relative(directory, file).replaceAll("\\", "/")}`;
      }
      const parent = path.dirname(directory);
      if (parent === directory)
        throw new Error(
          `Source producer input has no portable package identity: ${file}`,
        );
      directory = parent;
    }
  };
  const observe = (
    physicalPath: string,
    publicPath: string,
  ): IHumanSourceProducerObservation => {
    const stat = fs.existsSync(physicalPath)
      ? fs.statSync(physicalPath)
      : undefined;
    const kind =
      stat === undefined ? "absent" : stat.isDirectory() ? "directory" : "file";
    const bytes =
      kind === "file"
        ? fs.readFileSync(physicalPath)
        : Buffer.from(
            kind === "directory"
              ? JSON.stringify(
                  fs.readdirSync(physicalPath).sort(compareHumanSourceNames),
                )
              : "absent",
          );
    return {
      physicalPath,
      publicPath,
      kind,
      realpath:
        stat === undefined ? null : fs.realpathSync.native(physicalPath),
      bytes: bytes.length,
      sha256: sha(bytes),
    };
  };
  const observations = [...paths].map((file) =>
    observe(
      file,
      contentPaths.has(file)
        ? portable(file)
        : path.relative(repository, file).replaceAll("\\", "/"),
    ),
  );
  const inputs = new Map<string, IHumanSourceGenerationInput>();
  for (const one of observations) {
    if (!contentPaths.has(one.physicalPath)) continue;
    if (one.kind !== "file")
      throw new Error(
        `Resolved source producer input is not a file: ${one.publicPath}`,
      );
    const old = inputs.get(one.publicPath);
    const role = "producer";
    if (
      old !== undefined &&
      (old.sha256 !== one.sha256 ||
        old.bytes !== one.bytes ||
        old.role !== role)
    )
      throw new Error(
        `Source producer input aliases disagree: ${one.publicPath}`,
      );
    inputs.set(one.publicPath, {
      role,
      path: one.publicPath,
      revision: null,
      bytes: one.bytes,
      sha256: one.sha256,
    });
  }
  const resolvedEdges = [...reached]
    .sort(compareHumanSourceNames)
    .map((file) => {
      const key = keyOf.get(file);
      return [
        portable(file),
        (key === undefined ? [] : graph.edges[key])
          .map((dependency) => portable(absolute(dependency)))
          .sort(compareHumanSourceNames),
      ];
    })
    .sort((a, b) =>
      String(a[0]) < String(b[0]) ? -1 : String(a[0]) > String(b[0]) ? 1 : 0,
    );
  const graphBytes = Buffer.from(
    JSON.stringify({
      edges: resolvedEdges,
      globals: graph.globals
        .map((file) => portable(absolute(file)))
        .sort(compareHumanSourceNames),
      configs: graph.configs
        .map((file) => portable(absolute(file)))
        .sort(compareHumanSourceNames),
    }),
  );
  const graphPath = `${entryFile}#resolved-reference-graph`;
  inputs.set(graphPath, {
    role: "producer resolved graph",
    path: graphPath,
    revision: null,
    bytes: graphBytes.length,
    sha256: sha(graphBytes),
  });
  return {
    inputs: [...inputs.values()].sort((a, b) =>
      a.path < b.path ? -1 : a.path > b.path ? 1 : 0,
    ),
    verifyUnchanged: () => {
      assertHumanSourceCompilerObservations(graph, project, paths, realized);
      const changed = observations.filter((before) => {
        const after = observe(before.physicalPath, before.publicPath);
        return (
          after.kind !== before.kind ||
          after.realpath !== before.realpath ||
          after.bytes !== before.bytes ||
          after.sha256 !== before.sha256
        );
      });
      if (changed.length !== 0)
        throw new Error(
          `Source producer inputs changed during compilation: ${changed.map((one) => one.publicPath).join(", ")}`,
        );
    },
  };
}
