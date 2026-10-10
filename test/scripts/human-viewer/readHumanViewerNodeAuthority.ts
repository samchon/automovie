import { createHash } from "node:crypto";
import fs from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";

import type { IHumanViewerNodeAuthority } from "./IHumanViewerNodeAuthority";
import type { IHumanViewerNodeWorkerData } from "./IHumanViewerNodeWorkerData";

/**
 * Confirm the source bytes after the public checked loader admitted this realm.
 * A changed byte refuses readiness; the Node version and owning project come
 * from this execution, and no browser compilation identity is manufactured.
 * @evidence contracts/common.md#principled-implementation Loaded-source witnesses must equal the host's pre-start bytes before any request can run.
 * @evidence contracts/common.md#clear-and-simple-design One readiness receipt separates Node loading from browser transformations.
 * @evidence contracts/common.md#meaningful-documentation States actual loader authority and source-change refusal.
 */
export function readHumanViewerNodeAuthority(
  input: IHumanViewerNodeWorkerData,
): IHumanViewerNodeAuthority {
  const inputs = Object.fromEntries(Object.keys(input.inputs).map((file) => [
    file,
    createHash("sha256").update(fs.readFileSync(file)).digest("hex"),
  ]));
  if (Object.keys(inputs).some((file) => inputs[file] !== input.inputs[file]))
    throw new Error("The Node numerical source changed while its checked realm loaded.");
  const require = createRequire(input.entry);
  const compiler = JSON.parse(fs.readFileSync(require.resolve("ttsc/package.json"), "utf8")) as Record<string, unknown>;
  if (typeof compiler.version !== "string")
    throw new Error("The installed Node compiler has no version authority.");
  return {
    revision: input.revision,
    loader: "ttsc/register",
    project: path.join(path.dirname(input.entry), "tsconfig.json"),
    node: process.version,
    compiler: compiler.version,
    inputs,
  };
}
