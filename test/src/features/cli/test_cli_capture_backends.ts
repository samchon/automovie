import { TestValidator } from "@nestia/e2e";
import { AutoMovieCliCapture, type IAutoMovieCliChromium } from "automovie";

/**
 * The capture host plans Chromium switches for the selected backend and
 * records the backend name with the launched browser's version.
 *
 * Scenarios:
 *
 * 1. `software` passes `--use-gl=angle --use-angle=swiftshader` and is named
 *    `swiftshader`.
 * 2. `gpu` passes `--use-gl=angle --use-angle=default --ignore-gpu-blocklist` and
 *    is named `gpu`.
 * 3. `CHROME_PATH` set to a path becomes the executable; blank or absent leaves
 *    Playwright's own build.
 * 4. Launching through a recording Chromium sends a headless launch with the
 *    backend's switches, and the description joins the backend's name with the
 *    browser's version: `swiftshader; Chromium 151.0.7922.34`.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the software and GPU launch plans, the executable override and the description recorded after launch.
 * @evidence contracts/development/testing.md#behavioral-verification Calls both backend planners and passes a recording Chromium to the launcher. Checks the configured executable, the blank fallback, the exact headless arguments received and the returned backend string.
 * @evidence contracts/development/testing.md#independent-expectations Requires literal ANGLE vectors for SwiftShader and the default GPU backend. The fixture supplies the executable path and version used in the expected launch record.
 */
export async function test_cli_capture_backends(): Promise<void> {
  // 1 and 2. Switches and names.
  TestValidator.equals(
    "software",
    AutoMovieCliCapture.planChromiumLaunch("software", {}),
    {
      args: ["--use-gl=angle", "--use-angle=swiftshader"],
      name: "swiftshader",
    },
  );
  TestValidator.equals(
    "gpu",
    AutoMovieCliCapture.planChromiumLaunch("gpu", {}),
    {
      args: ["--use-gl=angle", "--use-angle=default", "--ignore-gpu-blocklist"],
      name: "gpu",
    },
  );

  // 3. The executable.
  TestValidator.equals(
    "CHROME_PATH is the executable",
    AutoMovieCliCapture.planChromiumLaunch("software", {
      CHROME_PATH: "C:/chrome/chrome.exe",
    }).executablePath,
    "C:/chrome/chrome.exe",
  );
  TestValidator.equals(
    "a blank CHROME_PATH is ignored",
    AutoMovieCliCapture.planChromiumLaunch("software", { CHROME_PATH: " " })
      .executablePath,
    undefined,
  );

  // 4. The launch and its description.
  const launches: unknown[] = [];
  const chromium: IAutoMovieCliChromium = {
    launch: async (
      options: Parameters<IAutoMovieCliChromium["launch"]>[0],
    ): Promise<IAutoMovieCliChromium.IBrowser> => {
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
  const launched: Awaited<
    ReturnType<typeof AutoMovieCliCapture.launchChromium>
  > = await AutoMovieCliCapture.launchChromium({
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
