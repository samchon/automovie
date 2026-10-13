import type { IHumanViewerFaceDocuments } from "./IHumanViewerFaceDocuments.js";

/**
 * The face documents of the last reading and what they were read from.
 *
 * @author Samchon
 */
export interface IHumanViewerFaceDocumentsMemo {
  /**
   * The subject list's stamp, the face basis digest and the face source digest; null before the first reading.
   */
  signature: string | null;

  /** The documents read under that signature. */
  value: IHumanViewerFaceDocuments | null;
}
