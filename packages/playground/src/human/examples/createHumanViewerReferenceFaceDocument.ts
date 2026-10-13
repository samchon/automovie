import type { IHumanViewerBasisIdentity } from "@automovie/viewer/human/inspection/IHumanViewerBasisIdentity";
import type { IHumanViewerReferenceFaceDocument } from "@automovie/viewer/human/inspection/IHumanViewerReferenceFaceDocument";
import { humanViewerDefaultDocument } from "./humanViewerDefaultDocument.js";

/**
 * The Playground's neutral connected reference example. Its named empty shape
 * and expression maps are example parameters; only the current published basis
 * identity is supplied by the inspection service.
 *
 * @evidence contracts/common.md#principled-implementation The application authors a neutral reference parameter document while its basis identity comes from the actual publication.
 * @evidence contracts/common.md#clear-and-simple-design One example factory supplies the reference used by face and person catalogue entries.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Uses the existing neutral parameter maps without a fitted likeness, dedicated vertex data or a library-owned preset.
 * @evidence contracts/common.md#meaningful-documentation States example ownership and the difference between named parameters and supplied basis authority.
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
