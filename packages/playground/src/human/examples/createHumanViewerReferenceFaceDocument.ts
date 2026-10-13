import type { IHumanViewerBasisIdentity } from "@automovie/viewer/human/inspection/IHumanViewerBasisIdentity";
import type { IHumanViewerReferenceFaceDocument } from "@automovie/viewer/human/inspection/IHumanViewerReferenceFaceDocument";
import { humanViewerDefaultDocument } from "./humanViewerDefaultDocument.js";

/**
 * The Playground's neutral connected reference example. Its named empty shape
 * and expression maps are example parameters; only the current published basis
 * identity is supplied by the inspection service.
 */
export function createHumanViewerReferenceFaceDocument(
  face: IHumanViewerBasisIdentity,
): IHumanViewerReferenceFaceDocument {
  return {
    id: humanViewerDefaultDocument,
    name: "CC0 connected reference",
    basis: face.id,
    shape: {},
    expression: {},
  };
}
