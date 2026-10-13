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

import type { HumanViewerAddress } from "./HumanViewerAddress.js";
import type { IHumanViewerWindow } from "./IHumanViewerWindow.js";

/**
 * Capture page timing and PNG data under the caller's selected source revision.
 * The actual ready bridge applies the address and finishes its frame; an absent
 * bridge or a different loaded source refuses instead of waiting on another page.
 *
 * @evidence contracts/common.md#principled-implementation Checks the loaded bridge revision before showing and reads PNG, build count and timing from that same actual page operation.
 * @evidence contracts/common.md#clear-and-simple-design One page evaluation owns display and capture ordering; queue serialization and revision selection remain with its caller.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Uses the existing product bridge without server-side geometry rebuilding, synthetic screenshots or a wait for a missing generation to appear.
 * @evidence contracts/common.md#meaningful-documentation States ready-bridge preconditions, source refusal and the difference between numerical build and display timing.
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-review Checks the loaded bridge revision before showing and reads PNG, build count and timing from that same actual page operation.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-review One page evaluation owns display and capture ordering; queue serialization and revision selection remain with its caller.
 */
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
        throw new Error(
          "The source generation was replaced during display (the page reloaded)",
        );
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
