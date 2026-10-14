/**
 * Read one GPU page frame through the documented resident viewer bridge. The caller owns revision selection, queue serialization and telemetry, and calls this only while a generation is ready, so the bridge is present. A page that reloaded since has no bridge: the read refuses at once with the generation-change message instead of waiting for a bridge the reloaded page publishes only with its next generation, which would hold the GPU queue for that whole wait. It then measures show and PNG encoding separately without rebuilding in the server.
 */
import type { Page } from "playwright";

import type { HumanViewerAddress } from "./HumanViewerAddress.js";
import type { IHumanViewerWindow } from "./IHumanViewerWindow.js";
import type { IHumanViewerCaptureReading } from "./IHumanViewerCaptureReading.js";

/**
 * Capture page timing and PNG data under the caller's selected source revision. The actual ready bridge applies the address and finishes its frame; an absent bridge or a different loaded source refuses instead of waiting on another page.
 *
 * @evidence contracts/common.md#principled-implementation The actual page bridge must exist and match the selected revision before show; completed build deltas, page durations and PNG output are returned with the server evaluation-start timestamp.
 * @evidence contracts/common.md#clear-and-simple-design One explicit address/revision evaluation argument avoids serialized server closures and returns the existing bridge's output without server-side numerical rebuilding.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Missing or initially mismatched bridge authority refuses immediately, while final concurrent-edit/staleness checks remain with the capture owner rather than being fabricated here.
 * @evidence contracts/common.md#meaningful-documentation The comment assigns queue/revision ownership to the caller and distinguishes page display/PNG readings from server evaluation timing.
 * @evidence contracts/performance.md#efficient-algorithms One page evaluation invokes show and PNG encoding, whose cost scales with actual construction/pixels; the adapter adds fixed timing and count bookkeeping.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The bridge executes the requested display and reads its completed image; numerical cache equivalence stays with the page and no old PNG is reused here.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The page is borrowed and one returned PNG string remains through capture decoding; this adapter retains no queue slot, browser session or cross-call image cache.
 */
export async function readHumanViewerCapture(
  page: Pick<Page, "evaluate">,
  address: HumanViewerAddress,
  revision: string,
): Promise<IHumanViewerCaptureReading> {
  const waited: number = performance.now();
  // Passing the viewer explicitly avoids serializing a closure into the page.
  const result: Omit<IHumanViewerCaptureReading, "waited"> = await page.evaluate(
    async (input: { address: HumanViewerAddress; revision: string }): Promise<Omit<IHumanViewerCaptureReading, "waited">> => {
      const viewer: IHumanViewerWindow["__humanViewer"] | undefined = (window as unknown as Partial<IHumanViewerWindow>)
        .__humanViewer;
      if (viewer === undefined)
        throw new Error(
          "The source generation was replaced during display (the page reloaded)",
        );
      if (viewer.revision() !== input.revision)
        throw new Error("The source revision has not finished loading");
      const before: number = viewer.builds();
      const t0: number = performance.now();
      await viewer.show(input.address);
      const t1: number = performance.now();
      const png: string = viewer.png();
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
