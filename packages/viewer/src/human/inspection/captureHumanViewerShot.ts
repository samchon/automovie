import fs from "node:fs";
import path from "node:path";

import type { IHumanShotContext } from "./IHumanShotContext.js";
import { retryHumanViewerFetch } from "./retryHumanViewerFetch.js";

/**
 * Ask the ready server for one image (`render`, `sheet`, `compare`) or warm answer and write it. An image goes to the requested file or a timestamped file under the selected storage's `captures/`; repository output outside it is refused. The printed record names the revision, staleness, renderer and time. A frame drawn by an older source generation is kept for reference but exits 5, since it does not show the current source.
 *
 * @evidence contracts/common.md#principled-implementation The command fetches the selected product endpoint, rejects HTTP failure and persists the returned bytes while forwarding actual revision and staleness headers.
 * @evidence contracts/common.md#clear-and-simple-design One endpoint request and one output path policy cover image commands, with warm responses printed directly.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A stale successful image is still marked by exit code 5; repository output outside selected storage is refused by path-component comparison.
 * @evidence contracts/common.md#meaningful-documentation The comment describes output placement, printed provenance and the stale-frame exit contract without certifying image contents.
 * @evidence contracts/performance.md#efficient-algorithms Work is linear in response bytes plus path length; the complete image buffer is materialized once for the synchronous file write.
 * @evidence contracts/performance.md#reuse-equivalent-work The fetch owner retries only according to its bounded transport policy; this command does not cache a previous revision or reuse another command's image.
 * @evidence contracts/performance.md#bound-retention-and-release-resources At most three fetch attempts and their pauses are requested; response bytes live through this invocation, and no timer or image buffer is retained after completion.
 */
export async function captureHumanViewerShot(
  context: IHumanShotContext,
): Promise<void> {
  const response: Response = await retryHumanViewerFetch(
    (): Promise<Response> => fetch(context.origin + "/" + context.command + "?" + context.query),
    {
      attempts: 3,
      pause: (ms: number): Promise<undefined> =>
        new Promise<undefined>((resolve: (value: undefined) => void): void => {
          setTimeout(resolve, ms);
        }),
    },
  );
  if (!response.ok) throw new Error(await response.text());
  if (context.command === "warm") {
    console.log(await response.text());
    return;
  }
  const filename: string = path.resolve(
    context.output ??
      path.join(
        context.storage,
        "captures",
        `${Date.now()}-${context.command}.png`,
      ),
  );
  // Parent traversal is a complete path component, not an ordinary name
  // beginning with two dots. Both boundaries use the same platform relation.
  const within: (directory: string) => boolean = (directory: string): boolean => {
    const relative: string = path.relative(directory, filename);
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
  const stale: boolean = response.headers.get("x-human-stale") === "true";
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
