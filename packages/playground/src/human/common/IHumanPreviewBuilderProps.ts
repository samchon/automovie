import type { IHumanPreviewArtifact } from "./IHumanPreviewArtifact";
import type { IHumanPreviewWorker } from "./IHumanPreviewWorker";

/**
 * Document admission, worker allocation and renderer decoding supplied to the
 * disposable preview's generation owner.
 *
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-editor-state Supplies decoding and release of superseded numerical candidates.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-editor Separates numerical transport and renderer ownership through explicit effects.
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
