import type { IAutoMovieCapturePlanRequest } from "@automovie/interface";
import type * as Render from "@automovie/render";
import * as fs from "node:fs";
import * as path from "node:path";

import type { AutoMovieCliInspectTypes } from "../AutoMovieCliInspectTypes";
import { formatInspectUrl } from "./formatInspectUrl";
import { loadProductionModule } from "../../production/internal/loadProductionModule";
import { readInspectHostOptions } from "./readInspectHostOptions";
import { serveInspectorPage } from "./serveInspectorPage";

/*
 * Run `automovie inspect` in a production or package: serve the inspector page
 * over a subject module, print its address with the request as the query, and
 * keep serving until the process is interrupted.
 *
 * Options are read by the production's `readCaptureArguments` and
 * split by `readInspectHostOptions`; the rest is read by
 * `parseCapturePlanRequest`, so a request the capture command would
 * refuse is refused here before anything is served, as is a `--props` file that
 * is not JSON, and an accepted one is written back by
 * `formatCapturePlanRequest` as the address's query.
 * `@automovie/render`, `vite`, and through the page `@automovie/viewer`,
 * `react` and `react-dom`, come from the production. On SIGINT or SIGTERM the
 * server stops, the page is deleted, and the status is 0; a refusal throws to
 * `run`, which prints it.
 *
 * The copied capture command uses the same module and optional props paths from
 * the production's working directory.
 */
export async function inspectProduction(
  props: AutoMovieCliInspectTypes.InspectProps,
): Promise<number> {
  const { root } = props;
  const render: typeof Render = loadProductionModule<typeof Render>(
    root,
    "@automovie/render",
  );
  const options: AutoMovieCliInspectTypes.HostOptions =
    readInspectHostOptions(
      render.AutoMovieRenderCapture.readArguments(props.args),
    );
  const request: IAutoMovieCapturePlanRequest =
    render.AutoMovieRenderCapture.parsePlanRequest(options.request);

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

  const executable: string = path.join(
    __dirname,
    "..",
    "..",
    "..",
    "lib",
    "bin.js",
  );
  const launcher: readonly [string, ...string[]] = fs.existsSync(executable)
    ? [process.execPath, executable]
    : ["automovie"];

  // Vite's CommonJS entry warns once per load; the command loads it on purpose.
  process.env.VITE_CJS_IGNORE_WARNING = "true";
  const page: AutoMovieCliInspectTypes.ServedPage =
    await serveInspectorPage({
      root,
      module: options.module,
      vite: loadProductionModule(root, "vite"),
      port: options.port,
      props: data,
      captureCommand: [
        ...launcher,
        "capture",
        `--module=${options.module}`,
        ...(options.props === null ? [] : [`--props=${options.props}`]),
      ],
    });
  process.stdout.write(
    `inspect ${options.module}: ${formatInspectUrl(page.url, render.AutoMovieRenderCapture.formatPlanRequest(request))}\nPress Ctrl+C to stop.\n`,
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
