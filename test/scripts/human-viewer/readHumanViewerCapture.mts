/**
 * Read one GPU page frame through the documented resident viewer bridge.
 * The caller owns revision selection, queue serialization and telemetry.
 * This reader waits for the page bridge, refuses mismatched modules, then
 * measures show and PNG encoding separately without rebuilding in the server.
 */
import type { Page } from "playwright";
import type { HumanViewerAddress } from "./HumanViewerAddress";

/** Capture page timing and PNG data under the caller's selected source revision. */
export async function readHumanViewerCapture(
  page: Pick<Page, "waitForFunction" | "evaluate">,
  address: HumanViewerAddress,
  revision: string,
) {
  await page.waitForFunction(
    () =>
      Boolean((window as unknown as { __humanViewer?: unknown }).__humanViewer),
    undefined,
    { timeout: 120000 },
  );
  const waited = performance.now();
  // Passing the viewer explicitly avoids serializing a closure into the page.
  const result = await page.evaluate(
    async (input) => {
      const viewer = (
        window as unknown as {
          __humanViewer: {
            show: (address: HumanViewerAddress) => Promise<void>;
            png: () => string;
            revision: () => string;
            builds: () => number;
            buildMs: () => number;
          };
        }
      ).__humanViewer;
      if (viewer.revision() !== input.revision)
        throw new Error("The source revision has not finished loading");
      const before = viewer.builds();
      const t0 = performance.now();
      await viewer.show(input.address);
      const t1 = performance.now();
      const png = viewer.png();
      return {
        png,
        built: viewer.builds() - before,
        buildMs: viewer.buildMs(),
        showMs: t1 - t0,
        pngMs: performance.now() - t1,
      };
    },
    { address, revision },
  );
  return { ...result, waited };
}
