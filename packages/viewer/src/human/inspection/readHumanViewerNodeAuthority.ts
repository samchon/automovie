import { createHash } from "node:crypto";
import fs from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";

import type { IHumanViewerNodeAuthority } from "./IHumanViewerNodeAuthority.js";
import type { IHumanViewerNodeWorkerData } from "./IHumanViewerNodeWorkerData.js";

/**
 * Confirm the source bytes after the public checked loader admitted this realm.
 * A changed byte refuses readiness; the Node version and owning project come
 * from this execution, and no browser compilation identity is manufactured.
 *
 * @evidence contracts/common.md#principled-implementation Loaded-source witnesses must equal the host's pre-start bytes before any request can run.
 * @evidence contracts/common.md#clear-and-simple-design One readiness receipt separates Node loading from browser transformations.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Rehashes original host-witnessed files and reads the actual installed loader version rather than borrowing a browser compile stamp or accepting altered startup bytes.
 * @evidence contracts/common.md#meaningful-documentation States actual loader authority and source-change refusal.
 */
export function readHumanViewerNodeAuthority(
  input: IHumanViewerNodeWorkerData,
): IHumanViewerNodeAuthority {
  const inputs = Object.fromEntries(Object.keys(input.inputs).map((file) => [
    file,
    createHash("sha256").update(fs.readFileSync(file)).digest("hex"),
  ]));
  const changed = Object.keys(inputs).filter((file) => inputs[file] !== input.inputs[file]);
  if (changed.length !== 0)
    throw new Error("The Node numerical source changed while its checked realm loaded: " + changed.join(", "));
  const require = createRequire(input.entry);
  const compiler = JSON.parse(fs.readFileSync(require.resolve("ttsc/package.json"), "utf8")) as Record<string, unknown>;
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
