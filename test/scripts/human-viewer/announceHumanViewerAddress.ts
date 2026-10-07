import type { HumanViewerAddress } from "./HumanViewerAddress";
import type { HumanViewerStage } from "./HumanViewerStage";
import { serializeHumanViewerAddress } from "./serializeHumanViewerAddress";

/**
 * Tell the host page what is displayed, so its controls follow the frame.
 *
 * @evidence contracts/common.md#meaningful-documentation States the message's purpose.
 */
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
