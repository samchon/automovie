import type { HumanViewerAddress } from "./HumanViewerAddress.js";
import type { HumanViewerHandle } from "./HumanViewerHandle.js";

/**
 * Binary construction export carried through the browser bridge with its original admission and displayed address/revision readings before export and after byte transfer. The server requires both readings to match its selected request; these observations do not lock the page against an intervening selection that returns to the same address.
 *
 * @evidence contracts/common.md#principled-implementation A data URL transports the exported GLB bytes without expanding them into a JavaScript number array, and the owner admission accompanies the same export.
 * @evidence contracts/common.md#clear-and-simple-design Encoding, original verdict and two existing handle readings travel together; canonical comparison and response headers remain with the GPU route.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Exporting bytes preserves a rejected admission and does not promote construction refusal into an admitted preview.
 * @evidence contracts/common.md#meaningful-documentation The prose identifies binary bridge encoding, original admission and the server checks that still precede HTTP publication.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The transfer type chooses no GLB encoder or base64 decoder implementation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This per-export transfer contains no completed-result memo or authority key for another display state.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Data URL bytes grow with this export and remain owned by its awaited request; the shape acquires no browser or filesystem handle.
 *
 * @author Samchon
 */
export interface IHumanViewerConstructionTransfer {
  /** Displayed state immediately before invoking the original export owner. */
  before: { address: HumanViewerAddress; revision: string };

  /** Displayed state after the original export and FileReader transfer finish. */
  after: { address: HumanViewerAddress; revision: string };

  /** GLB bytes encoded by FileReader as a binary MIME data URL. */
  dataUrl: string;

  /** Original owner's checks, including a rejected construction's failures. */
  admission: NonNullable<ReturnType<HumanViewerHandle["admission"]>>;
}
