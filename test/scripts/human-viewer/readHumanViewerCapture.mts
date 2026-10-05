/**
 * Read one GPU page frame through the documented resident viewer bridge.
 * The caller owns revision selection, queue serialization and telemetry, and
 * calls this only while a generation is ready, so the bridge is present. A
 * page that reloaded since has no bridge: the read refuses at once with the
 * generation-change message instead of waiting for a bridge the reloaded page
 * publishes only with its next generation, which would hold the GPU queue
 * for that whole wait. It then measures show and PNG encoding separately
 * without rebuilding in the server.
 */
import type { Page } from "playwright";
import type { HumanViewerAddress } from "./HumanViewerAddress";
import type { IHumanViewerWindow } from "./IHumanViewerWindow";

/** Capture page timing and PNG data under the caller's selected source revision. */
export async function readHumanViewerCapture(
  page: Pick<Page, "evaluate">,
  address: HumanViewerAddress,
  revision: string,
) {
  const waited = performance.now();
  // Passing the viewer explicitly avoids serializing a closure into the page.
  const result = await page.evaluate(
    async (input) => {
      const viewer = (window as unknown as Partial<IHumanViewerWindow>)
        .__humanViewer;
      if (viewer === undefined)
        throw new Error("The source generation was replaced during display (the page reloaded)");
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
        spans: viewer.spans(),
      };
    },
    { address, revision },
  );
  return { ...result, waited };
}
