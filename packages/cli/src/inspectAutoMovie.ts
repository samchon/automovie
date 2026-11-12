import type * as Render from "@automovie/render";
import * as fs from "node:fs";
import * as path from "node:path";

import { formatAutoMovieInspectUrl } from "./formatAutoMovieInspectUrl";
import { loadAutoMovieProductionModule } from "./loadAutoMovieProductionModule";
import { readAutoMovieInspectHostOptions } from "./readAutoMovieInspectHostOptions";
import { serveAutoMovieInspectorPage } from "./serveAutoMovieInspectorPage";

/**
 * Run `automovie inspect` in a production or package: serve the inspector page over a subject module, print its address with the request as the query, and keep serving until the process is interrupted.
 *
 * Options are read by the production's `readAutoMovieCaptureArguments` and split by `readAutoMovieInspectHostOptions`; the rest is read by `parseAutoMovieCapturePlanRequest`, so a request the capture command would refuse is refused here before anything is served, as is a `--props` file that is not JSON, and an accepted one is written back by `formatAutoMovieCapturePlanRequest` as the address's query. `@automovie/render`, `vite`, and through the page `@automovie/viewer`, `react` and `react-dom`, come from the production. On SIGINT or SIGTERM the server stops, the page is deleted, and the status is 0; a refusal throws to `run`, which prints it.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States how options are read and checked, what is served and printed, which packages come from the production, how the command ends and its status.
 * @evidence contracts/development/implementation.md#principled-implementation Every rule of the request is the render package's and every rule of the page the viewer's; the command loads them from the production, serves, and reports, as `automovie capture` does.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Read, serve, print, wait, close.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A request is read before the server starts, so a mistyped key never opens a page that silently ignores it.
 * @evidence contracts/development/implementation.md#efficient-algorithms One server for the command's life.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work One page per command.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The server and its page are closed when the process is interrupted; the signal listeners are removed with them.
 */
export async function inspectAutoMovie(props: {
  /** The tokens after `inspect`. */
  args: readonly string[];

  /** The production's or package's root folder, the working directory. */
  root: string;
}): Promise<number> {
  const { root } = props;
  const render: typeof Render = loadAutoMovieProductionModule(
    root,
    "@automovie/render",
  ) as typeof Render;
  const options: ReturnType<typeof readAutoMovieInspectHostOptions> =
    readAutoMovieInspectHostOptions(
      render.readAutoMovieCaptureArguments(props.args),
    );
  const request: Render.IAutoMovieCapturePlanRequest =
    render.parseAutoMovieCapturePlanRequest(options.request);

  // The module's props, read before anything is served.
  let data: unknown = null;
  if (options.props !== null) {
    const file: string = path.resolve(root, options.props);
    try {
      data = JSON.parse(fs.readFileSync(file, "utf8")) as unknown;
    } catch (error) {
      throw new Error(`Inspect --props ${file} is not a readable JSON file`, {
        cause: error,
      });
    }
  }

  // Vite's CommonJS entry warns once per load; the command loads it on purpose.
  process.env.VITE_CJS_IGNORE_WARNING = "true";
  const page: Awaited<ReturnType<typeof serveAutoMovieInspectorPage>> =
    await serveAutoMovieInspectorPage({
      root,
      module: options.module,
      vite: loadAutoMovieProductionModule(root, "vite"),
      port: options.port,
      props: data,
    });
  process.stdout.write(
    `inspect ${options.module}: ${formatAutoMovieInspectUrl(page.url, render.formatAutoMovieCapturePlanRequest(request))}\nPress Ctrl+C to stop.\n`,
  );

  // Serve until interrupted.
  await new Promise<undefined>((resolve: (value: undefined) => void): void => {
    const stop: () => void = (): void => {
      process.off("SIGINT", stop);
      process.off("SIGTERM", stop);
      resolve(undefined);
    };
    process.on("SIGINT", stop);
    process.on("SIGTERM", stop);
  });
  await page.close();
  return 0;
}
