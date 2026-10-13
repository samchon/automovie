import type { ICreateHumanViewerAdmissionProps } from "./ICreateHumanViewerAdmissionProps.js";
import type { IHumanViewerCatalogue } from "./IHumanViewerCatalogue.js";
import type { createHumanViewerSource } from "./createHumanViewerSource.mjs";

/**
 * Host bindings for catalogue publication and document-owned admission.
 *
 * @evidence contracts/common.md#principled-implementation The controller combines source-owned immutable generation facts with page-owned document admission before publishing the complete catalogue.
 * @evidence contracts/common.md#clear-and-simple-design Shares admission callback types with their owner and keeps publication as the host's single inventory replacement boundary.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Selected-document settlement still publishes complete inventory; it does not replace catalogue authority with a selected slice or page reload.
 * @evidence contracts/common.md#meaningful-documentation States source ownership, current page failure availability and complete publication; basis/source sidecars settle with their document owner.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The props type erases; controller refresh reads the catalogue, while selected settlement narrows awaited sidecar/admission work before full publication.
 * @evidence contracts/performance.md#reuse-equivalent-work Source and admission services are reused; publication requests are coalesced by the controller and verdict equivalence remains document/key-owned.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The host owns source watchers and page bridge; the controller borrows their handles and keeps no separate renderer or document-copy population.
 *
 * @author Samchon
 */
export interface ICreateHumanViewerCatalogueControllerProps {
  /** Disk and immutable-generation facts owned by the source reader. */
  source: ReturnType<typeof createHumanViewerSource>;

  /** Current page availability, including its original failure reason. */
  page: ICreateHumanViewerAdmissionProps["page"];

  /** Domain-owner admission through the current-code frame bridge. */
  admit: ICreateHumanViewerAdmissionProps["admit"];

  /**
   * Replace the host's complete published inventory.
   *
   * @evidence contracts/common.md#principled-implementation Replaces the host's published inventory with the controller's complete catalogue after source/admission state has been read.
   * @evidence contracts/common.md#clear-and-simple-design One callback owns externally visible inventory replacement for ordinary refresh and selected settlement.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Publishing a selected-only slice would lose other documents; even narrowed settlement supplies the complete resulting catalogue here.
   * @evidence contracts/common.md#meaningful-documentation The argument is a borrowed catalogue snapshot including rejected/pending inputs; publication does not command a browser reload.
   * @evidence contracts/performance.md#efficient-algorithms Assignment cost is host-defined, while constructing the catalogue requires the source's document-sized traversal before this callback.
   * @evidence contracts/performance.md#reuse-equivalent-work The controller coalesces refresh notifications; the published snapshot can be reused until source or admission state changes.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The host retains its latest published inventory until replacement; superseded snapshots have no independent lifetime manager in this callback.
   */
  publish: (catalogue: IHumanViewerCatalogue) => void;
}
