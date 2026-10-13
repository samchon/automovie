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
 * @evidence requirements/agent-authoring/roles-and-authorities.md#agent-runtime-authority Source facts and page admission are composed into a complete catalogue before the host publishes it.
 * @evidence specifications/authoring-and-authority/delegation-and-decision-authority.md#spec-authoring-runtime-evidence-authority-invariant Source-window readiness and page verdicts come from their owners rather than fabricated catalogue acceptance.
 * @author Samchon
 */
export interface ICreateHumanViewerCatalogueControllerProps {
  /**
   * Disk and immutable-generation facts owned by the source reader.
   *
   * @evidence requirements/agent-authoring/roles-and-authorities.md#agent-runtime-authority Uses the existing source reader for input bytes, immutable generation facts and catalogue composition.
   * @evidence specifications/authoring-and-authority/delegation-and-decision-authority.md#spec-authoring-runtime-evidence-authority-invariant Uses the existing source reader for input bytes, immutable generation facts and catalogue composition.
   */
  source: ReturnType<typeof createHumanViewerSource>;

  /**
   * Current page availability, including its original failure reason.
   *
   * @evidence requirements/agent-authoring/roles-and-authorities.md#agent-runtime-authority Borrows current page availability from the admission boundary instead of treating a listening HTTP server as a ready frame.
   * @evidence specifications/authoring-and-authority/delegation-and-decision-authority.md#spec-authoring-runtime-evidence-authority-invariant Borrows current page availability from the admission boundary instead of treating a listening HTTP server as a ready frame.
   */
  page: ICreateHumanViewerAdmissionProps["page"];

  /**
   * Domain-owner admission through the current-code frame bridge.
   *
   * @evidence requirements/agent-authoring/roles-and-authorities.md#agent-runtime-authority Forwards original domain, document and basis to the same frame-owned admission operation.
   * @evidence specifications/authoring-and-authority/delegation-and-decision-authority.md#spec-authoring-runtime-evidence-authority-invariant Forwards original domain, document and basis to the same frame-owned admission operation.
   */
  admit: ICreateHumanViewerAdmissionProps["admit"];

  /**
   * Replace the host's complete published inventory.
   *
   * @evidence contracts/common.md#principled-implementation A complete catalogue replaces the host's published inventory after descriptor and admission orchestration.
   * @evidence contracts/common.md#clear-and-simple-design Publication remains the host operation while the controller owns composition.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Selected-document settlement cannot silently replace the complete inventory with only that document.
   * @evidence contracts/common.md#meaningful-documentation The callback receives the complete catalogue to publish, without taking source-reader ownership.
   *
   * @evidence requirements/agent-authoring/roles-and-authorities.md#agent-runtime-authority A complete catalogue replaces the host's published inventory after descriptor and admission orchestration.
   * @evidence specifications/authoring-and-authority/delegation-and-decision-authority.md#spec-authoring-runtime-evidence-authority-invariant The callback receives the complete catalogue to publish, without taking source-reader ownership.
   */
  publish: (catalogue: IHumanViewerCatalogue) => void;
}
