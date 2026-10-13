import type { HumanViewerAddress } from "./HumanViewerAddress.js";
import type { HumanViewerStage } from "./HumanViewerStage.js";
import { serializeHumanViewerAddress } from "./serializeHumanViewerAddress.js";

/** Tell the host page what is displayed, so its controls follow the frame. */
export function announceHumanViewerAddress(
  address: HumanViewerAddress,
  stage: HumanViewerStage,
): void {
  parent.postMessage(
    {
      type: "human:address",
      address: serializeHumanViewerAddress(address),
      parts: stage.observe.parts(),
      doc: address.doc,
    },
    location.origin,
  );
}
