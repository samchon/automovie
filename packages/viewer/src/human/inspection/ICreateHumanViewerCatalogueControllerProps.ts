import type { ICreateHumanViewerAdmissionProps } from "./ICreateHumanViewerAdmissionProps.js";
import type { IHumanViewerCatalogue } from "./IHumanViewerCatalogue.js";
import type { createHumanViewerSource } from "./createHumanViewerSource.mjs";

/**
 * Host bindings for catalogue publication and document-owned admission.
 *
 * @evidence contracts/common.md#principled-implementation Source facts and page admission are composed into a complete catalogue before the host publishes it.
 * @evidence contracts/common.md#clear-and-simple-design The source reader, verdict owner and host publication remain separate bindings.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Source-window readiness and page verdicts come from their owners rather than fabricated catalogue acceptance.
 * @evidence contracts/common.md#meaningful-documentation The inputs distinguish immutable-generation facts, live page availability, domain verdicts and full catalogue replacement.
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
   * @evidence contracts/common.md#principled-implementation A complete catalogue replaces the host's published inventory after descriptor and admission orchestration.
   * @evidence contracts/common.md#clear-and-simple-design Publication remains the host operation while the controller owns composition.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Selected-document settlement cannot silently replace the complete inventory with only that document.
   * @evidence contracts/common.md#meaningful-documentation The callback receives the complete catalogue to publish, without taking source-reader ownership.
   */
  publish: (catalogue: IHumanViewerCatalogue) => void;
}
