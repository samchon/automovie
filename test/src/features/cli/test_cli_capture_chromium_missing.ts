import { TestValidator } from "@nestia/e2e";
import { type IAutoMovieChromium, launchAutoMovieChromium } from "automovie";

/**
 * A capture on a machine without the Chromium build Playwright pins fails with an error naming the command that installs it, while another launch failure keeps its own cause.
 *
 * Scenarios:
 *
 * 1. A Chromium whose launch rejects with Playwright's "Executable doesn't exist at …" message makes the launch reject naming `npx playwright-core install chromium-headless-shell` and `CHROME_PATH`, keeping the original error as its cause.
 * 2. A launch rejecting for another reason rejects naming the backend, without the install instruction, and keeps its cause.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls the launcher with Chromium doubles that reject and reads the error; a launcher that hid the install command, named it for an unrelated failure, or dropped the cause fails.
 * @evidence contracts/development/testing.md#independent-expectations The missing-browser message is the one Playwright prints for an absent executable, and the install command is `playwright-core`'s own for the headless shell, the package the production declares, so the browser revision is the one it launches, which the issue's case matrix requires the error to name.
 * @evidence contracts/development/testing.md#distinguishing-cases A missing executable against another failure. Successful launches are owned by `test_cli_capture_backends`.
 * @evidence contracts/development/testing.md#execution-ownership A portable unit discovered as `test_cli_capture_chromium_missing`; no browser exists or starts.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 2 numbered scenarios it runs, each naming the input and the behavior it pins.
 */
export async function test_cli_capture_chromium_missing(): Promise<void> {
  const failing: (message: string) => IAutoMovieChromium = (message: string): IAutoMovieChromium => ({
    launch: async (): Promise<IAutoMovieChromium.IBrowser> => {
      throw new Error(message);
    },
  });
  const failure: (chromium: IAutoMovieChromium) => Promise<Error | null> = (
    chromium: IAutoMovieChromium,
  ): Promise<Error | null> =>
    launchAutoMovieChromium({ chromium, backend: "software", env: {} })
      .then((): null => null)
      .catch((error: unknown): Error | null => (error instanceof Error ? error : null));

  // 1. No browser installed.
  const missing: Error | null = await failure(
    failing(
      "browserType.launch: Executable doesn't exist at C:\\Users\\me\\AppData\\Local\\ms-playwright\\chromium_headless_shell-1234\\chrome.exe",
    ),
  );
  TestValidator.predicate(
    "names the install command and CHROME_PATH",
    missing !== null &&
      missing.message.includes("npx playwright-core install chromium-headless-shell") &&
      missing.message.includes("CHROME_PATH"),
  );
  TestValidator.predicate(
    "keeps the cause",
    missing?.cause instanceof Error && missing.cause.message.includes("Executable doesn't exist"),
  );

  // 2. Another failure.
  const other: Error | null = await failure(failing("Target page, context or browser has been closed"));
  TestValidator.predicate(
    "names the backend without the install command",
    other !== null && other.message.includes("swiftshader") && !other.message.includes("playwright install"),
  );
  TestValidator.predicate("keeps that cause too", other?.cause instanceof Error);
}
