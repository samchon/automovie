import type * as THREE from "three";

import { createViewerDisplaySave } from "../../createViewerDisplaySave.js";
import type { HumanViewerAddress } from "./HumanViewerAddress.js";
import type { HumanViewerStage } from "./HumanViewerStage.js";
import type { IHumanViewerComposition } from "./IHumanViewerComposition.js";
import { composeHumanViewerReference } from "./composeHumanViewerReference.js";
import { readHumanViewerCameraAddress } from "./readHumanViewerCameraAddress.js";

/**
 * Adapt actual inspection completion and visible reference layers to the shared bitmap saver. The unchanged host owns commitment. Observed camera and loaded source remain distinct from requests; hidden candidates never commit.
 *
 * @evidence contracts/common.md#principled-implementation Saving first finishes the original stage, verifies its GPU context and observes actual camera/source facts; reference painting uses the existing composition owner.
 * @evidence contracts/common.md#clear-and-simple-design The adapter supplies observation and paint callbacks to the shared bitmap publication owner rather than duplicating encoding or upload scheduling.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Lost or erroneous GPU output is refused, requested address remains separate from observed camera and no hidden-stage commit is invented here.
 * @evidence contracts/common.md#meaningful-documentation The comment assigns publication commitment to the host and distinguishes loaded source and observed display from requests.
 * @evidence contracts/performance.md#efficient-algorithms Observation performs fixed GPU checks and camera reads; painting scales with output pixels, while encoding and latest-pending coalescing are delegated to the shared saver.
 * @evidence contracts/performance.md#reuse-equivalent-work The current visible canvas and composition are copied on each admitted snapshot; this adapter does not claim a requested frame is equivalent to an earlier completed one.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Canvas, renderer, photo and stage are borrowed host resources; the returned shared publication owner controls pending bitmap release and asynchronous encoding lifetime.
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
}): ReturnType<typeof createViewerDisplaySave> {
  return createViewerDisplaySave({
    canvas: props.canvas,
    retain: props.retain,
    observe: (): ReturnType<
      Parameters<typeof createViewerDisplaySave>[0]["observe"]
    > => {
      const requestedAddress: HumanViewerAddress | undefined = props.address();
      if (requestedAddress === undefined) return undefined;
      const gl: ReturnType<THREE.WebGLRenderer["getContext"]> =
        props.renderer.getContext();
      if (gl.isContextLost())
        throw new Error("The displayed GPU frame is unavailable for saving.");
      const stage: HumanViewerStage = props.stage();
      stage.finish();
      if (gl.isContextLost() || gl.getError() !== gl.NO_ERROR)
        throw new Error("The displayed GPU frame is unavailable for saving.");
      return {
        revision: props.revision(),
        renderer: String(stage.renderer()),
        address: readHumanViewerCameraAddress(requestedAddress, stage),
        requestedAddress,
        camera: stage.observe.camera(),
      };
    },
    paint: (surface: HTMLCanvasElement): void => {
      const composition: IHumanViewerComposition | null = props.composition();
      if (composition !== null) {
        composeHumanViewerReference({
          composition,
          photo: props.photo,
          landmarks: composition.landmarks,
          render: props.canvas,
          create: (): HTMLCanvasElement => surface,
        });
        return;
      }
      surface.width = props.canvas.width;
      surface.height = props.canvas.height;
      const context: CanvasRenderingContext2D | null = surface.getContext("2d");
      if (context === null)
        throw new Error(
          "A 2D surface is required to retain the completed display.",
        );
      context.drawImage(props.canvas, 0, 0);
    },
  });
}
