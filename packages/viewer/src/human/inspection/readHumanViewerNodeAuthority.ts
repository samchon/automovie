import { createHash } from "node:crypto";
import fs from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";

import type { IHumanViewerNodeAuthority } from "./IHumanViewerNodeAuthority.js";
import type { IHumanViewerNodeWorkerData } from "./IHumanViewerNodeWorkerData.js";

/**
 * Rehash supplied source inputs after the checked loader admits this realm and refuse changed bytes. Node and installed-compiler versions come from this execution. The project path is derived relative to the entry rather than independently read from the loader's selected configuration, and input membership is the supplied startup witness.
 *
 * @evidence contracts/common.md#principled-implementation Rehashes every supplied input after loading and refuses changed bytes; returns actual Node/installed-compiler versions and an entry-relative project path, which is not an independently observed loader-selected configuration receipt.
 * @evidence contracts/common.md#clear-and-simple-design One fresh input map and byte comparison separate executed Node authority from browser compile-label observations.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A changed source cannot pass by copying an old browser stamp; an installed compiler without string version refuses its metadata authority.
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
  const compiler: Record<string, unknown> = JSON.parse(
    fs.readFileSync(require.resolve("ttsc/package.json"), "utf8"),
  ) as Record<string, unknown>;
  if (typeof compiler.version !== "string")
    throw new Error("The installed Node compiler has no version authority.");
  return {
    revision: input.revision,
    loader: "ttsc/register",
    project: path.resolve(path.dirname(input.entry), "../../../tsconfig.json"),
    node: process.version,
    compiler: compiler.version,
    inputs,
  };
}
