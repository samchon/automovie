import type {
  IAutoMovieRecoveryCameraChartCreationOperation,
  IAutoMovieRecoveryCameraPairInput,
  IAutoMovieRecoveryCameraView,
} from "@automovie/interface";

import { isRecoveryPositiveFinite } from "../../internal/isRecoveryPositiveFinite";
import { isRecoveryPositiveSafeInteger } from "../../internal/isRecoveryPositiveSafeInteger";
import { createRecoveryCameraChart } from "./createRecoveryCameraChart";

/*
 * Admit shared scene assertions and the ordered resident view set. Apply both
 * pixel bounds before any chart is built, and build exactly one chart per
 * admitted source. The caller owns schema, view count and work policy admission.
 */
export function prepareRecoveryCameraViewSet(
  input: Pick<
    IAutoMovieRecoveryCameraPairInput,
    "objectId" | "rigidity" | "cohort" | "views"
  >,
  maximumPixels: number,
  maximumSeedPixels: number,
): IRecoveryCameraViewSet {
  if (
    typeof input.objectId !== "string" ||
    !input.objectId.trim() ||
    input.rigidity !== "asserted-fixed-scene" ||
    !["analytic", "photograph", "inconsistent-stress"].includes(input.cohort)
  )
    throw new Error(
      "camera-admission: scene identity, asserted rigidity and an acquisition cohort are required",
    );

  const ids: Set<string> = new Set();
  let pixels: number = 0;
  for (const [index, view] of input.views.entries()) {
    if (!validView(view) || ids.has(view.id))
      throw new Error(
        `camera-admission: view ${index} requires a unique ID, fixed RGB8 bytes and supplied calibration`,
      );
    ids.add(view.id);
    pixels += view.width * view.height;
    if (index === 1 && pixels > maximumSeedPixels)
      throw new Error(
        "camera-admission: seed pixels exceed the seed pixel budget",
      );
    if (pixels > maximumPixels)
      throw new Error(
        "camera-admission: aggregate pixels exceed the pixel budget",
      );
  }
  return { charts: input.views.map(createRecoveryCameraChart), pixels };
}

function validView(view: IAutoMovieRecoveryCameraView): boolean {
  if (
    !view ||
    typeof view.id !== "string" ||
    !view.id.trim() ||
    typeof view.sourceSha256 !== "string" ||
    !/^[0-9a-f]{64}$/.test(view.sourceSha256) ||
    typeof view.pixelProvenance !== "string" ||
    !view.pixelProvenance.trim() ||
    !isRecoveryPositiveSafeInteger(view.width) ||
    !isRecoveryPositiveSafeInteger(view.height) ||
    !ArrayBuffer.isView(view.rgb8) ||
    Object.prototype.toString.call(view.rgb8) !== "[object Uint8Array]" ||
    view.rgb8.length !== 3 * view.width * view.height ||
    !view.camera
  )
    return false;
  const camera: typeof view.camera = view.camera;
  return (
    camera.type === "pinhole" &&
    camera.calibration === "supplied-intrinsics" &&
    camera.distortion === "caller-corrected" &&
    Array.isArray(camera.focalPx) &&
    camera.focalPx.length === 2 &&
    isRecoveryPositiveFinite(camera.focalPx[0]) &&
    isRecoveryPositiveFinite(camera.focalPx[1]) &&
    Array.isArray(camera.principalPointPx) &&
    camera.principalPointPx.length === 2 &&
    Number.isFinite(camera.principalPointPx[0]) &&
    Number.isFinite(camera.principalPointPx[1]) &&
    Number.isFinite(camera.skewPx) &&
    (camera.uncertaintyPx === null ||
      (Number.isFinite(camera.uncertaintyPx) && camera.uncertaintyPx >= 0))
  );
}

interface IRecoveryCameraViewSet {
  charts: ReturnType<IAutoMovieRecoveryCameraChartCreationOperation.Operation>[];
  pixels: number;
}
