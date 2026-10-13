import type * as THREE from "three";

import { createViewerDisplaySave } from "../../createViewerDisplaySave.js";
import type { HumanViewerAddress } from "./HumanViewerAddress.js";
import type { HumanViewerStage } from "./HumanViewerStage.js";
import type { IHumanViewerComposition } from "./IHumanViewerComposition.js";
import { composeHumanViewerReference } from "./composeHumanViewerReference.js";
import { readHumanViewerCameraAddress } from "./readHumanViewerCameraAddress.js";

/**
 * Adapt actual inspection completion and visible reference layers to the shared
 * bitmap saver. The unchanged host owns commitment. Observed camera and loaded
 * source remain distinct from requests; hidden candidates never commit.
 */
export function createHumanViewerDisplaySave(props: {
  canvas: HTMLCanvasElement;
  renderer: THREE.WebGLRenderer;
  stage: () => HumanViewerStage;
  address: () => HumanViewerAddress | undefined;
  revision: () => string;
  composition: () => IHumanViewerComposition | null;
  photo: HTMLImageElement;
  retain: (blob: Blob) => void;
}) {
  return createViewerDisplaySave({
    canvas: props.canvas,
    retain: props.retain,
    observe: () => {
      const requestedAddress = props.address();
      if (requestedAddress === undefined) return undefined;
      const gl = props.renderer.getContext();
      if (gl.isContextLost()) throw new Error("The displayed GPU frame is unavailable for saving.");
      const stage = props.stage();
      stage.finish();
      if (gl.isContextLost() || gl.getError() !== gl.NO_ERROR)
        throw new Error("The displayed GPU frame is unavailable for saving.");
      return {
        revision: props.revision(), renderer: String(stage.renderer()),
        address: readHumanViewerCameraAddress(requestedAddress, stage),
        requestedAddress, camera: stage.observe.camera(),
      };
    },
    paint: (surface) => {
      const composition = props.composition();
      if (composition !== null) {
        composeHumanViewerReference({
          composition, photo: props.photo, landmarks: composition.landmarks,
          render: props.canvas, create: () => surface,
        });
        return;
      }
      surface.width = props.canvas.width;
      surface.height = props.canvas.height;
      const context = surface.getContext("2d");
      if (context === null) throw new Error("A 2D surface is required to retain the completed display.");
      context.drawImage(props.canvas, 0, 0);
    },
  });
}
