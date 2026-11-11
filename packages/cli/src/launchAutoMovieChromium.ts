import type { AutoMovieCaptureBackend } from "./AutoMovieCaptureBackend";
import type { IAutoMovieChromium } from "./IAutoMovieChromium";
import { planAutoMovieChromiumLaunch } from "./planAutoMovieChromiumLaunch";

/** The command that installs the Chromium build Playwright pins for headless use. */
const INSTALL: string = "npx playwright install chromium-headless-shell";

/**
 * Launch headless Chromium for a capture backend, and describe the launch the way a record names it: the backend, then the Chromium version.
 *
 * A launch that fails because the browser executable is missing is rethrown as an error naming `npx playwright install chromium-headless-shell` and `CHROME_PATH`; any other failure is rethrown with the backend named.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what is launched, the description's form and both failures.
 * @evidence contracts/development/implementation.md#principled-implementation Switches come from `planAutoMovieChromiumLaunch`; Playwright reports a missing browser as an executable that does not exist, which is the message matched, so only that case is turned into the install instruction.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Plan, launch, describe.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No other browser or backend is tried after a failure.
 * @evidence contracts/development/implementation.md#efficient-algorithms One launch.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each capture host launches its own browser.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The returned browser is the caller's to close; a failed launch leaves none.
 */
export async function launchAutoMovieChromium(props: {
  /** Playwright's `chromium`, loaded from the production. */
  chromium: IAutoMovieChromium;

  /** How the browser draws. */
  backend: AutoMovieCaptureBackend;

  /** The environment, read for `CHROME_PATH`. */
  env: Readonly<Record<string, string | undefined>>;
}): Promise<{
  /** The launched browser. */
  browser: IAutoMovieChromium.IBrowser;

  /** The backend and Chromium version, such as `swiftshader; Chromium 131.0.6778.33`. */
  backend: string;
}> {
  const plan: ReturnType<typeof planAutoMovieChromiumLaunch> =
    planAutoMovieChromiumLaunch(props.backend, props.env);
  let browser: IAutoMovieChromium.IBrowser;
  try {
    browser = await props.chromium.launch({
      headless: true,
      args: plan.args,
      ...(plan.executablePath === undefined
        ? {}
        : { executablePath: plan.executablePath }),
    });
  } catch (error) {
    const message: string = error instanceof Error ? error.message : String(error);
    if (/executable doesn't exist|executable does not exist/iu.test(message))
      throw new Error(
        `No Chromium is installed for capture; run ${INSTALL} in the production, or set CHROME_PATH to a Chromium executable`,
        { cause: error },
      );
    throw new Error(`Chromium did not start for the ${plan.name} backend`, {
      cause: error,
    });
  }
  return { browser, backend: `${plan.name}; Chromium ${browser.version()}` };
}
