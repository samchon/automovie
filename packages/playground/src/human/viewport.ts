import type { IAutoMovieModelCrossing } from "@automovie/engine";
import type { IAutoMovieHumanFaceDocument } from "@automovie/human";
import type { JSONDocument } from "@gltf-transform/core";
import * as THREE from "three";

import { createHumanPreviewBuilder } from "./previewBuilder";
import { disposeHumanPreview, prepareHumanPreview } from "./previewScene";
import { createHumanPreviewStage } from "./previewStage";

type BuiltFace = {
  group: THREE.Group;
  glb: Uint8Array<ArrayBuffer>;
  gltf: JSONDocument;
  parts: number;
  /** Absent when the port does not measure, null when the request did not ask. */
  crossings?: IAutoMovieModelCrossing[] | null;
};
/**
 * Decode disposable worker exports into the shared facial preview stage.
 * Stale builds dispose their decoded resources; publication replaces only a
 * successfully prepared group. Connected numerical previews use the stage
 * directly and do not require this file transport.
 *
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-editor-state Publishes a completed preview and releases the prior group's resources.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-editor Isolates worker generations and disposes obsolete decoded assets.
 */
export function createHumanViewport<Document = IAutoMovieHumanFaceDocument>(
  props: Parameters<typeof createHumanPreviewStage>[0] & {
    serialize: (document: Document) => string;
    worker: Parameters<
      typeof createHumanPreviewBuilder<BuiltFace>
    >[0]["worker"];
    decode: (bytes: ArrayBuffer) => Promise<THREE.Group>;
  },
) {
  const stage = createHumanPreviewStage(props);
  let active: BuiltFace | undefined;
  const dispose = disposeHumanPreview;
  const { build, cancel } = createHumanPreviewBuilder<BuiltFace, Document>({
    serialize: props.serialize,
    worker: props.worker,
    decode: async (result) => {
      const group = await props.decode(
        result.glb.buffer.slice(
          result.glb.byteOffset,
          result.glb.byteOffset + result.glb.byteLength,
        ),
      );
      try {
        prepareHumanPreview(
          group,
          props.renderer.capabilities.getMaxAnisotropy(),
        );
      } catch (error) {
        disposeHumanPreview(group);
        throw error;
      }
      return { ...result, group };
    },
    dispose: (model) => dispose(model.group),
  });
  return {
    ...stage,
    build,
    cancel,
    publish: (built: BuiltFace): void => {
      if (active === built) return;
      stage.publish(built.group);
      if (active !== undefined) dispose(active.group);
      active = built;
    },
    dispose: (model: BuiltFace): void => dispose(model.group),
  };
}
