import type { IBodyCaptureDocument } from "./IBodyCaptureDocument";

/**
 * A unique submitted state used to share one admitted build across its views.
 * @author Samchon
 */
export interface IBodyCaptureDocumentEntry {
  /** File-local id selected for the render address. */
  id: string;

  /** Newly composed state document; composition does not mutate the authored review state. */
  document: IBodyCaptureDocument;
}
