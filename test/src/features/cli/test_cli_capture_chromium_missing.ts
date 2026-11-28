import { TestValidator } from "@nestia/e2e";
import { AutoMovieCliCapture, type IAutoMovieCliChromium } from "automovie";

/**
 * A capture on a machine without the Chromium build Playwright pins fails with
 * an error naming the command that installs it, while another launch failure
 * keeps its own cause.
 *
 * Scenarios:
 *
 * 1. A Chromium whose launch rejects with Playwright's "Executable doesn't exist
 *    at …" message makes the launch reject naming `npx playwright-core install
 *    chromium-headless-shell` and `CHROME_PATH`, keeping the original error as
 *    its cause.
 * 2. A launch rejecting for another reason rejects naming the backend, without the
 *    install instruction, and keeps its cause.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the missing Playwright executable and unrelated Chromium launch failure, including the distinct remediation and preserved error causes.
 * @evidence contracts/development/testing.md#behavioral-verification Runs the public launcher with two rejecting Chromium doubles. Checks the install and `CHROME_PATH` message in the missing-executable case, the backend message for the other case, and each caught cause.
 * @evidence contracts/development/testing.md#independent-expectations Supplies two independent Error instances and the missing-executable diagnostic text. Compares cause identity and requires the exact headless-shell install hint only for the missing-browser case.
 */
export async function test_cli_capture_chromium_missing(): Promise<void> {
  const failing: (message: string) => IAutoMovieCliChromium = (
    message: string,
  ): IAutoMovieCliChromium => ({
    launch: async (): Promise<IAutoMovieCliChromium.IBrowser> => {
      throw new Error(message);
    },
  });
  const failure: (chromium: IAutoMovieCliChromium) => Promise<Error | null> = (
    chromium: IAutoMovieCliChromium,
  ): Promise<Error | null> =>
    AutoMovieCliCapture.launchChromium({
      chromium,
      backend: "software",
      env: {},
    })
      .then((): null => null)
      .catch((error: unknown): Error | null =>
        error instanceof Error ? error : null,
      );

  // 1. No browser installed.
  const missing: Error | null = await failure(
    failing(
      "browserType.launch: Executable doesn't exist at C:\\Users\\me\\AppData\\Local\\ms-playwright\\chromium_headless_shell-1234\\chrome.exe",
    ),
  );
  TestValidator.predicate(
    "names the install command and CHROME_PATH",
    missing !== null &&
      missing.message.includes(
        "npx playwright-core install chromium-headless-shell",
      ) &&
      missing.message.includes("CHROME_PATH"),
  );
  TestValidator.predicate(
    "keeps the cause",
    missing?.cause instanceof Error &&
      missing.cause.message.includes("Executable doesn't exist"),
  );

  // 2. Another failure.
  const other: Error | null = await failure(
    failing("Target page, context or browser has been closed"),
  );
  TestValidator.predicate(
    "names the backend without the install command",
    other !== null &&
      other.message.includes("swiftshader") &&
      !other.message.includes("playwright install"),
  );
  TestValidator.predicate(
    "keeps that cause too",
    other?.cause instanceof Error,
  );
}
