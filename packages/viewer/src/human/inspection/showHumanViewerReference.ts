import { humanCaptureCameraPosition } from "@automovie/viewer/human/common/observation/humanCaptureCameraPosition";
import type { IHumanViewerComposition } from "./IHumanViewerComposition.js";
import type { IHumanViewerReferenceInfo } from "./IHumanViewerReferenceInfo.js";
import type { IShowHumanViewerReferenceProps } from "./IShowHumanViewerReferenceProps.js";
import { drawHumanViewerLandmarks } from "./drawHumanViewerLandmarks.js";
import { layoutHumanViewerReference } from "./layoutHumanViewerReference.js";
import { planHumanViewerReference } from "./planHumanViewerReference.js";

/**
 * Lay out the local reference photograph the address asks for beside, over or across the render, move the camera to where the photograph's camera stood, and draw its landmarks. A failed reference-info request fails the show: a requested comparison is never silently dropped. Returns the composition a capture must reproduce, or null when no photograph is shown.
 *
 * @evidence contracts/common.md#principled-implementation Checks the reference-info HTTP/envelope before using the existing comparison planner, local image decode, recorded camera and landmark layout.
 * @evidence contracts/common.md#clear-and-simple-design Reference choice/layout remain shared helpers while this function owns the current DOM composition and borrows stage camera/drawing capabilities.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A failed metadata request does not silently hide a requested comparison; envelope admission is not full landmark/camera schema validation and a later decode failure can leave partial DOM changes.
 * @evidence contracts/common.md#meaningful-documentation Documentation identifies optional recorded camera, comparison reproduction and the remaining failure-state and nested-metadata limits.
 * @evidence contracts/performance.md#efficient-algorithms Metadata fetch/decode and photo pixels dominate; landmark layout/drawing is linear in recorded markers and surface style changes are fixed work.
 * @evidence contracts/performance.md#reuse-equivalent-work Reference bytes and metadata may change independently of numerical source, so this call rereads metadata and decodes the selected current image rather than memoizing a comparison.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Display/image/stage nodes are borrowed and browser image ownership retains decoded pixels; this helper installs no retained listener, while landmark replacement belongs to the drawing helper.
 */
export async function showHumanViewerReference(
  props: IShowHumanViewerReferenceProps,
): Promise<IHumanViewerComposition | null> {
  const { address, stage, display, canvas, reference }: IShowHumanViewerReferenceProps = props;
  const response: Response = await fetch("/reference-info?" + new URLSearchParams({ doc: address.doc }));
  if (!response.ok) throw new Error(await response.text());
  const value: unknown = await response.json();
  if (value === null || typeof value !== "object" || Array.isArray(value) ||
      !("available" in value) || typeof value.available !== "boolean" ||
      !("camera" in value) || (value.camera !== null && typeof value.camera !== "object") ||
      !("landmarks" in value) || !Array.isArray(value.landmarks))
    throw new Error("The server returned incompatible reference information.");
  const info: IHumanViewerReferenceInfo = value as IHumanViewerReferenceInfo;
  const comparison: ReturnType<typeof planHumanViewerReference> = planHumanViewerReference(
    info.available,
    address.ref,
    address.opacity,
  );
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
        position: humanCaptureCameraPosition(info.camera),
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
  const shown: IHumanViewerComposition | null = composition;
  drawHumanViewerLandmarks(
    props.landmarks,
    (): SVGCircleElement => document.createElementNS("http://www.w3.org/2000/svg", "circle"),
    shown === null || !address.landmarks
      ? null
      : ((): { width: number; height: number; radius: number; markers: ReturnType<typeof layoutHumanViewerReference>["markers"] } => {
          const layout: ReturnType<typeof layoutHumanViewerReference> = layoutHumanViewerReference(
            shown.mode,
            shown.size,
            shown.opacity,
            { width: reference.naturalWidth, height: reference.naturalHeight },
            info.landmarks,
          );
          return {
            width: layout.width,
            height: layout.height,
            radius: layout.markerRadius,
            markers: layout.markers,
          };
        })(),
  );
  return composition;
}
