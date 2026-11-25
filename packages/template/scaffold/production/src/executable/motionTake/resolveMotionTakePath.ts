import { realpath } from "node:fs/promises";
import path from "node:path";

/**
 * Resolve a production-relative source, data or artifact path under a canonical
 * production root. Creation resolves the existing parent without following an
 * already-present destination.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the path scope and the distinct creation resolution.
 * @evidence contracts/development/implementation.md#principled-implementation Resolves filesystem aliases of the typed production-relative reference and checks confinement on the resolved path. Does not waive the canonical root check on Windows.
 * @evidence contracts/development/implementation.md#efficient-algorithms Filesystem resolution and containment are successive steps. Performs one filesystem resolution. Current filesystem resolution cannot reuse a prior result after aliases change. Retains only a returned path string and opens no file handle.
 */
export async function resolveMotionTakePath(
  root: string,
  reference: string,
  mode: "read" | "create",
): Promise<string> {
  const absolute: string = path.join(root, ...reference.split("/"));
  const check: string = mode === "read" ? absolute : path.dirname(absolute);
  const canonical: string = await realpath(check).catch((cause: unknown) => {
    throw new Error(`Motion take path is unavailable: ${reference}`, { cause });
  });
  const relative: string = path.relative(root, canonical);
  if (
    relative === ".." ||
    relative.startsWith(`..${path.sep}`) ||
    path.isAbsolute(relative)
  )
    throw new Error(`Motion take path escapes the production: ${reference}`);

  return mode === "read"
    ? canonical
    : path.join(canonical, path.basename(absolute));
}
