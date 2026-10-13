import type { IHumanPreviewArtifact } from "./IHumanPreviewArtifact.js";
import type { IHumanPreviewWorker } from "./IHumanPreviewWorker.js";

/**
 * Document admission, worker allocation and renderer decoding supplied to the
 * disposable preview's generation owner.
 *
 * @author Samchon
 */
export interface IHumanPreviewBuilderProps<Model, Document> {
  /** Admit and serialize the selected numerical document format. */
  serialize: (document: Document) => string;

  /** Allocate the request's disposable worker. */
  worker: () => IHumanPreviewWorker;

  /** Decode one successful numerical artifact into renderer resources. */
  decode: (artifact: IHumanPreviewArtifact) => Promise<Model>;

  /** Release obsolete renderer resources. */
  dispose: (model: Model) => void;
}
