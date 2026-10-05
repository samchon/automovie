import { faceShapeFitView } from "../face-review/faceShapeFitCamera";
import type { IHumanViewerComposition } from "./IHumanViewerComposition";
import type { IHumanViewerReferenceInfo } from "./IHumanViewerReferenceInfo";
import type { IShowHumanViewerReferenceProps } from "./IShowHumanViewerReferenceProps";
import { drawHumanViewerLandmarks } from "./drawHumanViewerLandmarks";
import { layoutHumanViewerReference } from "./layoutHumanViewerReference";
import { planHumanViewerReference } from "./planHumanViewerReference";

/**
 * Lay out the local reference photograph the address asks for beside, over or
 * across the render, move the camera to where the photograph's camera stood,
 * and draw its landmarks. A failed reference-info request fails the show:
 * a requested comparison is never silently dropped. Returns the composition a
 * capture must reproduce, or null when no photograph is shown.
 *
 * @evidence contracts/common.md#principled-implementation The photograph's own camera places the render, so the comparison is like for like.
 * @evidence contracts/common.md#meaningful-documentation States the failure and the result.
 */
export async function showHumanViewerReference(
  props: IShowHumanViewerReferenceProps,
): Promise<IHumanViewerComposition | null> {
  const { address, stage, display, canvas, reference } = props;
  const info = (await (
    await fetch("/reference-info?" + new URLSearchParams({ doc: address.doc }))
  ).json()) as IHumanViewerReferenceInfo;
  const comparison = planHumanViewerReference(info.available, address.ref, address.opacity);
  let composition: IHumanViewerComposition | null = null;
  reference.style.display = comparison.enabled ? "block" : "none";
  reference.style.clipPath = "";
  reference.style.opacity = "1";
  reference.style.left = "0";
  reference.style.width = `${address.size}px`;
  if (comparison.enabled) {
    reference.src = "/reference?" + new URLSearchParams({ doc: address.doc });
    await reference.decode();
    if (info.camera !== null)
      stage.observe.look({
        position: faceShapeFitView(info.camera, address.size).eye,
        target: info.camera.target,
        fov: info.camera.fov ?? 28,
      });
    if (address.ref === "split") {
      display.style.width = `${address.size * 2}px`;
      canvas.style.width = `${address.size}px`;
      reference.style.left = `${address.size}px`;
    } else {
      canvas.style.width = `${address.size}px`;
      if (address.ref === "overlay")
        reference.style.opacity = String(1 - comparison.renderOpacity);
      else reference.style.clipPath = `inset(0 0 0 ${address.opacity * 100}%)`;
    }
    composition = {
      mode: comparison.mode!,
      opacity: address.opacity,
      size: address.size,
      landmarks: address.landmarks ? info.landmarks : [],
    };
    stage.finish();
  } else canvas.style.width = `${address.size}px`;
  const shown = composition;
  drawHumanViewerLandmarks(
    props.landmarks,
    () => document.createElementNS("http://www.w3.org/2000/svg", "circle"),
    shown === null || !address.landmarks
      ? null
      : (() => {
          const layout = layoutHumanViewerReference(shown.mode, shown.size,
            shown.opacity, { width: reference.naturalWidth, height: reference.naturalHeight },
            info.landmarks);
          return { width: layout.width, height: layout.height,
            radius: layout.markerRadius, markers: layout.markers };
        })(),
  );
  return composition;
}
