import { createHash } from "node:crypto";
import fs from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";

import type { IHumanViewerNodeAuthority } from "./IHumanViewerNodeAuthority.js";
import type { IHumanViewerNodeWorkerData } from "./IHumanViewerNodeWorkerData.js";

/**
 * Rehash supplied inputs after this numerical entry loads and refuse changed bytes. Source execution records its installed compiler and entry-relative project; published JavaScript records native Node execution with no compiler or project receipt. Input membership is the supplied startup witness.
 *
 * @evidence contracts/common.md#principled-implementation Rehashes every supplied input after loading and refuses changed bytes; source entries report their compiler metadata while JavaScript entries report native Node with null compiler/project.
 * @evidence contracts/common.md#clear-and-simple-design One fresh input map and byte comparison separate executed Node authority from browser compile-label observations.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Changed bytes cannot pass by copying an old browser stamp; source compiler metadata must contain a version and published execution never claims a checked loader.
 * @evidence contracts/common.md#meaningful-documentation The comment assigns byte confirmation to the actual checked realm and distinguishes Node/runtime facts from browser identity.
 * @evidence contracts/performance.md#efficient-algorithms Each selected file is read and SHA-256 hashed once, then key comparison is linear in selected input count.
 * @evidence contracts/performance.md#reuse-equivalent-work Fresh hashes are compared with this realm's startup witness rather than cached as another generation's success.
 * @evidence contracts/performance.md#bound-retention-and-release-resources File buffers are transient and the returned digest map retains one string per selected file, with no separate worker or browser owner.
 */
export function readHumanViewerNodeAuthority(
  input: IHumanViewerNodeWorkerData,
): IHumanViewerNodeAuthority {
  const inputs: Record<string, string> = Object.fromEntries(
    Object.keys(input.inputs).map((file: string): [string, string] => [
      file,
      createHash("sha256").update(fs.readFileSync(file)).digest("hex"),
    ]),
  );
  const changed: string[] = Object.keys(inputs).filter(
    (file: string): boolean => inputs[file] !== input.inputs[file],
  );
  if (changed.length !== 0)
    throw new Error(
      "The Node numerical source changed while its checked realm loaded: " +
        changed.join(", "),
    );
  const require: ReturnType<typeof createRequire> = createRequire(input.entry);
  const source: boolean = input.entry.endsWith(".ts");
  const compiler: Record<string, unknown> = source
    ? (JSON.parse(
        fs.readFileSync(require.resolve("ttsc/package.json"), "utf8"),
      ) as Record<string, unknown>)
    : {};
  if (source && typeof compiler.version !== "string")
    throw new Error("The installed Node compiler has no version authority.");
  return {
    revision: input.revision,
    loader: source ? "ttsc/register" : "node",
    project: source
      ? path.resolve(path.dirname(input.entry), "../../../tsconfig.json")
      : null,
    node: process.version,
    compiler: source ? (compiler.version as string) : null,
    inputs,
  };
}
