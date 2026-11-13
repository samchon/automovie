import { TestValidator } from "@nestia/e2e";
import {
  type IAutoMovieChromium,
  launchAutoMovieChromium,
  planAutoMovieChromiumLaunch,
} from "automovie";

/**
 * The capture host launches Chromium with the switches of the asked backend and describes the launch as a record names it, and the software backend is the default the record states.
 *
 * Scenarios:
 *
 * 1. `software` passes `--use-gl=angle --use-angle=swiftshader` and is named `swiftshader`.
 * 2. `gpu` passes `--use-gl=angle --use-angle=default --ignore-gpu-blocklist` and is named `gpu`.
 * 3. `CHROME_PATH` set to a path becomes the executable; blank or absent leaves Playwright's own build.
 * 4. Launching through a recording Chromium sends a headless launch with the backend's switches, and the description joins the backend's name with the browser's version: `swiftshader; Chromium 151.0.7922.34`.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls the launch planner and the launcher with a recording Chromium and reads the switches it received and the description it returned; a swapped backend, a dropped switch, a non-headless launch or a description without the version fails.
 * @evidence contracts/development/testing.md#independent-expectations The software switches are the ones Chromium's SwiftShader documentation and the campaign issue #3292 name; the GPU switches select ANGLE's default backend as Remotion's GL options describe; the version is the double's.
 * @evidence contracts/development/testing.md#distinguishing-cases Both backends, an executable set, blank and absent. A missing browser is owned by `test_cli_capture_chromium_missing`.
 * @evidence contracts/development/testing.md#execution-ownership A portable unit discovered as `test_cli_capture_backends`; the browser is an in-memory double and none starts.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 4 numbered scenarios it runs, each naming the input and the behavior it pins.
 */
export async function test_cli_capture_backends(): Promise<void> {
  // 1 and 2. Switches and names.
  TestValidator.equals(
    "software",
    planAutoMovieChromiumLaunch("software", {}),
    {
      args: ["--use-gl=angle", "--use-angle=swiftshader"],
      name: "swiftshader",
    },
  );
  TestValidator.equals("gpu", planAutoMovieChromiumLaunch("gpu", {}), {
    args: ["--use-gl=angle", "--use-angle=default", "--ignore-gpu-blocklist"],
    name: "gpu",
  });

  // 3. The executable.
  TestValidator.equals(
    "CHROME_PATH is the executable",
    planAutoMovieChromiumLaunch("software", {
      CHROME_PATH: "C:/chrome/chrome.exe",
    }).executablePath,
    "C:/chrome/chrome.exe",
  );
  TestValidator.equals(
    "a blank CHROME_PATH is ignored",
    planAutoMovieChromiumLaunch("software", { CHROME_PATH: " " })
      .executablePath,
    undefined,
  );

  // 4. The launch and its description.
  const launches: unknown[] = [];
  const chromium: IAutoMovieChromium = {
    launch: async (
      options: Parameters<IAutoMovieChromium["launch"]>[0],
    ): Promise<IAutoMovieChromium.IBrowser> => {
      launches.push(options);
      return {
        version: (): string => "151.0.7922.34",
        newPage: (): never => {
          throw new Error("no page is opened by a launch");
        },
        close: async (): Promise<void> => {},
      };
    },
  };
  const launched: Awaited<ReturnType<typeof launchAutoMovieChromium>> =
    await launchAutoMovieChromium({
      chromium,
      backend: "software",
      env: {},
    });
  TestValidator.equals(
    "a headless launch with the backend's switches",
    launches,
    [{ headless: true, args: ["--use-gl=angle", "--use-angle=swiftshader"] }],
  );
  TestValidator.equals(
    "the record's backend",
    launched.backend,
    "swiftshader; Chromium 151.0.7922.34",
  );
}
