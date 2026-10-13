import type { IHumanViewerCatalogueEntry } from "./IHumanViewerCatalogueEntry.js";
import type { IHumanViewerWarming } from "./IHumanViewerWarming.js";

/**
 * What a warm pass needs from its host: the documents, the cache and capture steps, queue admission and the progress record it updates.
 *
 * @evidence contracts/common.md#principled-implementation A warm pass binds its document population and counters to one source revision and checks the currently drawable authority.
 * @evidence contracts/common.md#clear-and-simple-design The host supplies cache lookup, capture persistence and lowest-lane queue admission while the pass owns ordering.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A newer revision withdraws the pass through source identity, with failed documents retaining their reasons.
 * @evidence contracts/common.md#meaningful-documentation Documents pass authority, readonly documents, cache lookup, queued capture and progress-record ownership.
 * @evidence requirements/rendering/frame-identity-and-content-addressing.md#rendering-current-stale A warm pass binds its document population and counters to one source revision and checks the currently drawable authority.
 * @evidence specifications/editorial-render-and-delivery/render-budget-identity-and-recovery.md#spec-render-frame-identity The host supplies cache lookup, capture persistence and lowest-lane queue admission while the pass owns ordering.
 * @author Samchon
 */
export interface IWarmHumanViewerDocumentsProps {
  /**
   * Source generation this pass warms.
   *
   * @evidence requirements/rendering/frame-identity-and-content-addressing.md#rendering-current-stale Source generation this pass warms. A warm pass binds its document population and counters to one source revision and checks the currently drawable authority.
   * @evidence specifications/editorial-render-and-delivery/render-budget-identity-and-recovery.md#spec-render-frame-identity Source generation this pass warms. The host supplies cache lookup, capture persistence and lowest-lane queue admission while the pass owns ordering.
   */
  revision: string;

  /**
   * Published documents the pass covers.
   *
   * @evidence requirements/rendering/frame-identity-and-content-addressing.md#rendering-current-stale Published documents the pass covers. A warm pass binds its document population and counters to one source revision and checks the currently drawable authority.
   * @evidence specifications/editorial-render-and-delivery/render-budget-identity-and-recovery.md#spec-render-frame-identity Published documents the pass covers. The host supplies cache lookup, capture persistence and lowest-lane queue admission while the pass owns ordering.
   */
  documents: readonly IHumanViewerCatalogueEntry[];

  /**
   * The generation the page can draw now; a different one ends the pass.
   *
   * @evidence contracts/common.md#principled-implementation Current authority reads the source generation the page can actually draw.
   * @evidence contracts/common.md#clear-and-simple-design The page owner supplies its live revision while the warm pass decides whether it is superseded.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts An older ready frame cannot be presented as the new warm revision.
   * @evidence contracts/common.md#meaningful-documentation Defines the current drawable-generation accessor.
   * @evidence requirements/rendering/frame-identity-and-content-addressing.md#rendering-current-stale Current authority reads the source generation the page can actually draw.
   * @evidence specifications/editorial-render-and-delivery/render-budget-identity-and-recovery.md#spec-render-frame-identity The page owner supplies its live revision while the warm pass decides whether it is superseded.
   */
  currentRevision: () => string;

  /**
   * Whether a document already has its thumbnail.
   *
   * @evidence contracts/common.md#principled-implementation Cache lookup asks whether this document already has its current thumbnail.
   * @evidence contracts/common.md#clear-and-simple-design The thumbnail owner retains persistence and freshness decisions.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts A cached answer does not claim construction acceptance for a failed document.
   * @evidence contracts/common.md#meaningful-documentation Names the document-ID thumbnail lookup.
   * @evidence requirements/rendering/frame-identity-and-content-addressing.md#rendering-current-stale Cache lookup asks whether this document already has its current thumbnail.
   * @evidence specifications/editorial-render-and-delivery/render-budget-identity-and-recovery.md#spec-render-frame-identity The thumbnail owner retains persistence and freshness decisions.
   */
  cached: (id: string) => boolean;

  /**
   * Draw one document and store its thumbnail.
   *
   * @evidence contracts/common.md#principled-implementation Capture draws one requested document and persists its thumbnail through the host.
   * @evidence contracts/common.md#clear-and-simple-design The capture owner retains GPU work and storage while the warm pass orders documents.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The operation cannot substitute a different document's image for the requested one.
   * @evidence contracts/common.md#meaningful-documentation Defines document capture and thumbnail persistence completion.
   * @evidence requirements/actors/facial-authoring/contract.md#actor-face-review Capture draws one requested document and persists its thumbnail through the host.
   * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-review The capture owner retains GPU work and storage while the warm pass orders documents.
   */
  capture: (id: string) => Promise<void>;

  /**
   * Admit one capture to the host queue's lowest lane.
   *
   * @evidence contracts/common.md#principled-implementation Queue admission submits one capture into the host's lowest-priority lane.
   * @evidence contracts/common.md#clear-and-simple-design The shared queue retains GPU serialization and interactive scheduling.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts One warm task does not bypass foreground requests or release a slot before its operation settles.
   * @evidence contracts/common.md#meaningful-documentation Documents the document label and queued capture operation.
   * @evidence requirements/rendering/headless-and-platform-determinism.md#rendering-process-isolation Queue admission submits one capture into the host's lowest-priority lane.
   * @evidence specifications/editorial-render-and-delivery/render-schedule-state-and-headless.md#spec-render-headless-platform The shared queue retains GPU serialization and interactive scheduling.
   */
  queue: (id: string, capture: () => Promise<void>) => Promise<unknown>;

  /**
   * Progress record `/health` reports, reset by each pass.
   *
   * @evidence requirements/rendering/frame-identity-and-content-addressing.md#rendering-current-stale Progress record `/health` reports, reset by each pass. A warm pass binds its document population and counters to one source revision and checks the currently drawable authority.
   * @evidence specifications/editorial-render-and-delivery/render-budget-identity-and-recovery.md#spec-render-frame-identity Progress record `/health` reports, reset by each pass. The host supplies cache lookup, capture persistence and lowest-lane queue admission while the pass owns ordering.
   */
  status: IHumanViewerWarming;
}
