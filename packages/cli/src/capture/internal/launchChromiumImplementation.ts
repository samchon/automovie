import type { AutoMovieCliCaptureTypes } from "../AutoMovieCliCaptureTypes";
import type { IAutoMovieCliChromium } from "../IAutoMovieCliChromium";
import { planChromiumLaunchImplementation } from "./planChromiumLaunchImplementation";

/*
 * Launch headless Chromium for a capture backend, and describe the launch the
 * way a record names it: the backend, then the Chromium version.
 *
 * A launch that fails because the browser executable is missing is rethrown as
 * an error naming `npx playwright-core install chromium-headless-shell` and
 * `CHROME_PATH`; any other failure is rethrown with the backend named.
 */
export async function launchChromiumImplementation(
  props: AutoMovieCliCaptureTypes.LaunchChromiumProps,
): Promise<AutoMovieCliCaptureTypes.ChromiumLaunch> {
  const plan: ReturnType<typeof planChromiumLaunchImplementation> =
    planChromiumLaunchImplementation(props.backend, props.env);
  let browser: IAutoMovieCliChromium.IBrowser;
  try {
    browser = await props.chromium.launch({
      headless: true,
      args: plan.args,
      ...(plan.executablePath === undefined
        ? {}
        : { executablePath: plan.executablePath }),
    });
  } catch (error) {
    const message: string =
      error instanceof Error ? error.message : String(error);
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

/*
 * The command that installs the Chromium build the production's
 * `playwright-core` pins for headless use; `playwright-core`'s own command, so
 * the revision is the one the production launches.
 */
const INSTALL: string = "npx playwright-core install chromium-headless-shell";
