import type { ICreateHumanViewerAdmissionProps } from "./ICreateHumanViewerAdmissionProps";
import type { IHumanViewerCatalogue } from "./IHumanViewerCatalogue";
import type { createHumanViewerSource } from "./createHumanViewerSource.mjs";

/** Host bindings for catalogue publication and document-owned admission. @author Samchon */
export interface ICreateHumanViewerCatalogueControllerProps {
  /** Disk and immutable-generation facts owned by the source reader. */
  source: ReturnType<typeof createHumanViewerSource>;

  /** Current page availability, including its original failure reason. */
  page: ICreateHumanViewerAdmissionProps["page"];

  /** Domain-owner admission through the current-code frame bridge. */
  admit: ICreateHumanViewerAdmissionProps["admit"];

  /** Replace the host's complete published inventory. */
  publish: (catalogue: IHumanViewerCatalogue) => void;
}
