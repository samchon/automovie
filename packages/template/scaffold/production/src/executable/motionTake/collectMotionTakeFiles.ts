import { type BuildResult, build } from "esbuild";
import { isBuiltin } from "node:module";
import path from "node:path";

import { hashMotionTakeFile } from "./hashMotionTakeFile";
import { resolveMotionTakePath } from "./resolveMotionTakePath";

/**
 * Fingerprint the runtime source graph without executing it. Installed package
 * edges remain external and are returned by name for version measurement.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines the source graph and the boundary with installed packages.
 * @evidence contracts/development/implementation.md#principled-implementation Reads inputs and imports from the existing esbuild resolver's in-memory compilation metadata and hashes the resolved project-relative files. No dynamic module expression that the resolver cannot account for goes unreported, and no bundle is executed or persisted.
 * @evidence contracts/development/implementation.md#efficient-algorithms Discovers and confines project files, then records the independent installed package edges. Builds one graph with packages external and streams the digest of each input once. Multiple imports of the same source produce one canonical graph entry and digest. The in-memory build output and filesystem reads are local to one call.
 */
export async function collectMotionTakeFiles(
  root: string,
  source: string,
): Promise<{
  files: { path: string; sha256: string }[];
  packages: { name: string; issuer: string }[];
}> {
  const module: string = await resolveMotionTakePath(root, source, "read");
  const graph: BuildResult<{ metafile: true; write: false }> = await build({
    absWorkingDir: root,
    entryPoints: [module],
    bundle: true,
    packages: "external",
    platform: "node",
    format: "esm",
    metafile: true,
    write: false,
    logLevel: "silent",
    logOverride: {
      "unsupported-dynamic-import": "error",
      "unsupported-require-call": "error",
    },
  });
  const references: Set<string> = new Set([source, "tsconfig.json"]);
  const packages: { name: string; issuer: string }[] = [];
  for (const [file, input] of Object.entries(graph.metafile.inputs)) {
    references.add(file.split(path.sep).join("/"));
    for (const imported of input.imports) {
      if (!imported.external || isBuiltin(imported.path)) continue;
      const segments: string[] = imported.path.split("/");
      packages.push({
        name: segments
          .slice(0, imported.path.startsWith("@") ? 2 : 1)
          .join("/"),
        issuer: file,
      });
    }
  }

  const files: { path: string; sha256: string }[] = [];
  for (const reference of [...references].sort((left, right) =>
    left < right ? -1 : left > right ? 1 : 0,
  )) {
    files.push({
      path: reference,
      sha256: await hashMotionTakeFile(
        await resolveMotionTakePath(root, reference, "read"),
      ),
    });
  }
  return { files, packages };
}
