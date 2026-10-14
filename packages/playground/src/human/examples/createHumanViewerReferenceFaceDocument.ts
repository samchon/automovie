import type { IHumanViewerBasisIdentity } from "@automovie/viewer/human/inspection/IHumanViewerBasisIdentity";
import type { IHumanViewerReferenceFaceDocument } from "@automovie/viewer/human/inspection/IHumanViewerReferenceFaceDocument";

import { humanViewerDefaultDocument } from "./humanViewerDefaultDocument.js";

/**
 * The Playground's neutral connected reference example. Its named empty shape and expression maps are example parameters; only the current published basis identity is supplied by the inspection service.
 *
 * @evidence contracts/common.md#principled-implementation Empty authored shape and expression maps request the published basis neutral reference without embedding fitted vertices or a subject measurement.
 * @evidence contracts/common.md#clear-and-simple-design The application owns example identity and parameter defaults while the inspection service supplies current basis authority and the numerical owner admits the document.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The named reference is actual application example content, not a fixture-specific runtime geometry branch, and no successful numerical admission is inferred from constructing its parameters.
 * @evidence contracts/common.md#meaningful-documentation The comment identifies neutral authored maps, application example ownership and the service-supplied current published basis.
 * @evidence contracts/performance.md#efficient-algorithms The factory creates a constant-size record and two empty maps with no mesh traversal or fitted-data allocation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Independent example documents need independently editable maps and the factory coordinates no numerical cache or asynchronous work.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The returned parameter data acquires no numerical frame, worker or GPU handle; its catalogue consumer owns data lifetime.
 */
export function createHumanViewerReferenceFaceDocument(
  face: IHumanViewerBasisIdentity,
): IHumanViewerReferenceFaceDocument {
  return {
    id: humanViewerDefaultDocument,
    name: "Connected reference",
    basis: face.id,
    shape: {},
    expression: {},
  };
}
