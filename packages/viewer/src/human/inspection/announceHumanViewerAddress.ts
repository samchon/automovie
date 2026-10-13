import type { HumanViewerAddress } from "./HumanViewerAddress.js";
import type { HumanViewerStage } from "./HumanViewerStage.js";
import { serializeHumanViewerAddress } from "./serializeHumanViewerAddress.js";

/**
 * Tell the host page what is displayed, so its controls follow the frame.
 *
 * @evidence contracts/common.md#meaningful-documentation States the message's purpose.
 * @evidence contracts/common.md#principled-implementation Serializes the committed address and reads the stage's actual observed part list before posting one origin-restricted host message.
 * @evidence contracts/common.md#clear-and-simple-design One message carries the displayed address, parts and document together so the host does not reconstruct them from requested controls.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Uses the browser postMessage boundary with location.origin and the existing address serializer; it does not replace parent handlers or synthesize displayed geometry.
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
