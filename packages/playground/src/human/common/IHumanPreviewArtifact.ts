import type { IAutoMovieModelCrossing } from "@automovie/engine";
import type { JSONDocument } from "@gltf-transform/core";

/**
 * File bytes and optional readings produced by a disposable preview worker.
 *
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-editor-state Carries one candidate's encoded geometry and readings before publication.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-editor Defines the artifact decoded by the preview's renderer owner.
 * @author Samchon
 */
export interface IHumanPreviewArtifact {
  /** GLB file bytes owned by this result. */
  glb: Uint8Array<ArrayBuffer>;

  /** Structured glTF description corresponding to the file bytes. */
  gltf: JSONDocument;

  /** Number of reported material regions. */
  parts: number;

  /** Absent when not measured; null when this request did not ask. */
  crossings?: IAutoMovieModelCrossing[] | null;

  /** Additional numerical facts, absent when the worker supplies none. */
  extras?: Record<string, unknown>;
}
