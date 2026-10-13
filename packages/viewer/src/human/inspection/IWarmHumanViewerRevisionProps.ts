import type { HumanViewerAddress } from "./HumanViewerAddress.js";
import type { IHumanViewerCatalogue } from "./IHumanViewerCatalogue.js";
import type { IHumanViewerWarming } from "./IHumanViewerWarming.js";
import type { createHumanViewerQueue } from "./createHumanViewerQueue.js";

/**
 * The server state one warm pass over a source revision reads.
 *
 * @evidence contracts/common.md#principled-implementation Revision warming reads current catalogue and drawable generation beside the thumbnail key and actual capture operation.
 * @evidence contracts/common.md#clear-and-simple-design The server retains mutable state through accessors while the warm owner uses the shared queue and progress record.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Thumbnail absence stays null and captured bytes carry their requested address without claiming current source from an older picture.
 * @evidence contracts/common.md#meaningful-documentation Documents pass revision, current inventory, ready generation, nullable thumbnail path and page-capture owner.
 * @evidence requirements/rendering/frame-identity-and-content-addressing.md#rendering-current-stale Revision warming reads current catalogue and drawable generation beside the thumbnail key and actual capture operation.
 * @evidence specifications/editorial-render-and-delivery/render-budget-identity-and-recovery.md#spec-render-frame-identity The server retains mutable state through accessors while the warm owner uses the shared queue and progress record.
 * @author Samchon
 */
export interface IWarmHumanViewerRevisionProps {
  /**
   * Source revision to warm.
   *
   * @evidence requirements/rendering/frame-identity-and-content-addressing.md#rendering-current-stale Source revision to warm. Revision warming reads current catalogue and drawable generation beside the thumbnail key and actual capture operation.
   * @evidence specifications/editorial-render-and-delivery/render-budget-identity-and-recovery.md#spec-render-frame-identity Source revision to warm. The server retains mutable state through accessors while the warm owner uses the shared queue and progress record.
   */
  revision: string;

  /**
   * The current catalogue.
   *
   * @evidence contracts/common.md#principled-implementation The warm pass reads the host's current catalogue at use time.
   * @evidence contracts/common.md#clear-and-simple-design Catalogue mutation remains server-owned behind an accessor.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts A stored pass record cannot silently override current document authority.
   * @evidence contracts/common.md#meaningful-documentation Names the catalogue accessor used during revision warming.
   * @evidence requirements/rendering/frame-identity-and-content-addressing.md#rendering-frame-dependency-closure The warm pass reads the host's current catalogue at use time.
   * @evidence specifications/editorial-render-and-delivery/render-budget-identity-and-recovery.md#spec-render-frame-identity Catalogue mutation remains server-owned behind an accessor.
   */
  inventory: () => IHumanViewerCatalogue;

  /**
   * The generation the page can draw now.
   *
   * @evidence contracts/common.md#principled-implementation Warm authority reads the generation the page can presently draw.
   * @evidence contracts/common.md#clear-and-simple-design The page owner retains readiness while the warm pass checks revision agreement.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts A serving source digest does not replace the drawable-generation reading.
   * @evidence contracts/common.md#meaningful-documentation Defines the current ready revision used by the warm pass.
   * @evidence requirements/rendering/frame-identity-and-content-addressing.md#rendering-current-stale Warm authority reads the generation the page can presently draw.
   * @evidence specifications/editorial-render-and-delivery/render-budget-identity-and-recovery.md#spec-render-frame-identity The page owner retains readiness while the warm pass checks revision agreement.
   */
  readyRevision: () => string;

  /**
   * Thumbnail file of a render query, or null when the query names no published document.
   *
   * @evidence contracts/common.md#principled-implementation Thumbnail lookup returns the path for a published render query or null.
   * @evidence contracts/common.md#clear-and-simple-design The thumbnail/key owner retains publication lookup outside warming orchestration.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts A query naming no published document is not assigned an unrelated image path.
   * @evidence contracts/common.md#meaningful-documentation Defines the render-query input and unavailable-thumbnail state.
   * @evidence requirements/rendering/frame-identity-and-content-addressing.md#rendering-output-naming Thumbnail lookup returns the path for a published render query or null.
   * @evidence specifications/editorial-render-and-delivery/render-budget-identity-and-recovery.md#spec-render-frame-identity The thumbnail/key owner retains publication lookup outside warming orchestration.
   */
  thumbnailFile: (search: string) => string | null;

  /**
   * Draw one address on the resident page.
   *
   * @evidence contracts/common.md#principled-implementation Capture draws the supplied address on the owned resident page and returns PNG bytes.
   * @evidence contracts/common.md#clear-and-simple-design The page/capture owner retains hardware execution while the warm pass supplies the address.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Returned image bytes alone are not a whole-Human or source-freshness acceptance verdict.
   * @evidence contracts/common.md#meaningful-documentation Documents address-bound page drawing and the binary capture result.
   * @evidence requirements/actors/facial-authoring/contract.md#actor-face-review Capture draws the supplied address on the owned resident page and returns PNG bytes.
   * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-review The page/capture owner retains hardware execution while the warm pass supplies the address.
   */
  capture: (address: HumanViewerAddress) => Promise<Buffer>;

  /**
   * The server's GPU queue.
   *
   * @evidence requirements/rendering/frame-identity-and-content-addressing.md#rendering-current-stale The server's GPU queue. Revision warming reads current catalogue and drawable generation beside the thumbnail key and actual capture operation.
   * @evidence specifications/editorial-render-and-delivery/render-budget-identity-and-recovery.md#spec-render-frame-identity The server's GPU queue. The server retains mutable state through accessors while the warm owner uses the shared queue and progress record.
   */
  queue: ReturnType<typeof createHumanViewerQueue>;

  /**
   * Progress record `/health` reports.
   *
   * @evidence requirements/rendering/frame-identity-and-content-addressing.md#rendering-current-stale Progress record `/health` reports. Revision warming reads current catalogue and drawable generation beside the thumbnail key and actual capture operation.
   * @evidence specifications/editorial-render-and-delivery/render-budget-identity-and-recovery.md#spec-render-frame-identity Progress record `/health` reports. The server retains mutable state through accessors while the warm owner uses the shared queue and progress record.
   */
  warming: IHumanViewerWarming;
}
