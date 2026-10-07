import type { IHumanViewerSubmittedDocument } from "./IHumanViewerSubmittedDocument";

/**
 * Authored documents written to the selected viewer input storage and rescanned
 * for admission. The client reports a refusal before attempting a render.
 * @author Samchon
 */
export interface IHumanViewerDropProps {
  /** Input filename stem; the client admits letters, digits, dots, dashes and underscores. */
  label: string;

  /** Caller-owned authored documents; the client serializes them without mutation. */
  documents: IHumanViewerSubmittedDocument[];

  /** Basis file copied beside the input; omitted or null requests no candidate copy. */
  candidateBasis?: string | null;
}
