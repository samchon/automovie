import type { HumanViewerAddress } from "./HumanViewerAddress.js";
import type { HumanViewerStage } from "./HumanViewerStage.js";
import { serializeHumanViewerAddress } from "./serializeHumanViewerAddress.js";

/**
 * Tell the same-origin host which address, document and observed mesh parts the frame displays so its controls can follow the selection.
 *
 * @evidence contracts/common.md#principled-implementation The child posts a serialized displayed address and stage-observed parts to location.origin so the host controls follow actual frame state.
 * @evidence contracts/common.md#clear-and-simple-design The observation message composes existing address serialization and part discovery without owning host UI state.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Document and part identities come from the displayed selection and product observation rather than a preset-specific controls list.
 * @evidence contracts/common.md#meaningful-documentation The comment identifies same-origin delivery and the displayed address/document/mesh-parts payload.
 * @evidence contracts/performance.md#efficient-algorithms Work follows serialized address fields and the stage's part count; one structured-clone message is posted, with no polling or repeated part lookup.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Posting updates host selection and is an effectful notification; equal address text does not justify suppressing independently changed part lists.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The function borrows stage/address and transfers cloned message values without retaining a listener, timer or viewport resource.
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
