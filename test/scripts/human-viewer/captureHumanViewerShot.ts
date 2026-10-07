import fs from "node:fs";
import path from "node:path";

import type { IHumanShotContext } from "./IHumanShotContext";
import { retryHumanViewerFetch } from "./retryHumanViewerFetch";

/**
 * Ask the ready server for one image (`render`, `sheet`, `compare`) or warm
 * answer and write it. An image goes to the requested file or a timestamped
 * file under the selected storage's `captures/`; repository output outside it is
 * refused. The printed record names the revision, staleness, renderer and
 * time. A frame drawn by an older source generation is kept for reference
 * but exits 5, since it does not show the current source.
 *
 * @evidence contracts/common.md#principled-implementation A stale frame is saved but never reported as a current observation.
 * @evidence contracts/common.md#meaningful-documentation States the output location rule, the record and the stale exit code.
 */
export async function captureHumanViewerShot(
  context: IHumanShotContext,
): Promise<void> {
  const response = await retryHumanViewerFetch(
    () => fetch(context.origin + "/" + context.command + "?" + context.query),
    {
      attempts: 3,
      pause: (ms) =>
        new Promise<undefined>((resolve) => {
          setTimeout(resolve, ms);
        }),
    },
  );
  if (!response.ok) throw new Error(await response.text());
  if (context.command === "warm") {
    console.log(await response.text());
    return;
  }
  const filename = path.resolve(
    context.output ??
      path.join(
        context.storage,
        "captures",
        `${Date.now()}-${context.command}.png`,
      ),
  );
  // Parent traversal is a complete path component, not an ordinary name
  // beginning with two dots. Both boundaries use the same platform relation.
  const within = (directory: string): boolean => {
    const relative = path.relative(directory, filename);
    return (
      relative === "" ||
      (relative !== ".." &&
        !relative.startsWith(".." + path.sep) &&
        !path.isAbsolute(relative))
    );
  };
  if (within(context.root) && !within(context.storage))
    throw new Error(
      "Repository render output belongs under " + context.storage,
    );
  fs.mkdirSync(path.dirname(filename), { recursive: true });
  fs.writeFileSync(filename, Buffer.from(await response.arrayBuffer()));
  const stale = response.headers.get("x-human-stale") === "true";
  console.log(
    JSON.stringify({
      file: filename,
      revision: response.headers.get("x-human-revision"),
      stale,
      renderer: response.headers.get("x-renderer"),
      ms: response.headers.get("x-render-ms"),
    }),
  );
  if (stale) {
    console.error(
      "The frame is stale: it was drawn by an older source generation, not the current source",
    );
    process.exitCode = 5;
  }
}
