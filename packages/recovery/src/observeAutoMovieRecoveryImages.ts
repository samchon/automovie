import type {
  IAutoMovieRecoveryImageInput,
  IAutoMovieRecoveryImageObservation,
} from "@automovie/interface/recovery";

import type { IAutoMovieRecoveryOperation } from "./IAutoMovieRecoveryOperation";
import { assertRecoveryImageChart } from "./internal/assertRecoveryImageChart";

/**
 * Measure opaque row supports using a supplied fixed RGB background and cameras.
 * This deterministic threshold is suitable for controlled-background captures;
 * shadows, reflections and foreground colours close to the background remain
 * acquisition limitations. No morphology, hole filling or component deletion
 * changes the measured mask. Quantization reports assume correctly classified
 * binary pixels and do not certify segmentation, rigidity or calibration.
 *
 * @evidence contracts/common.md#principled-implementation A declared maximum-channel colour distance segments RGB pixels; contiguous row envelopes map pixel-cell edges and row centres through supplied metric orthographic charts without associating sliding material points.
 * @evidence contracts/common.md#clear-and-simple-design This synchronous owner validates capture budgets before scans and produces only observations; inverse fitting, source-free realization and byte publication remain separate operations.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Empty, clipped, disconnected and holed support refuses rather than being filled, cropped or assigned to a chosen object; no trained model, specimen name, mesh or camera inference changes pixels.
 * @evidence contracts/common.md#meaningful-documentation States fixed-background premises, pixel-cell and row-centre interpretation, borrowed input lifetime, unsupported masks and the conditional meaning of half-pixel quantization.
 * @evidence contracts/performance.md#efficient-algorithms Admission scans V view records before O(P) pixel work, where P is total admitted pixels. Output has O(R) occupied rows bounded by maxRows; no image-sized mask or depth volume is allocated.
 * @evidence contracts/performance.md#reuse-equivalent-work Each pixel is classified once and each measured row supplies both silhouette limits; the operation has no cache or file effect to share across requests.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only O(R+V) observation records escape; pixel arrays are borrowed during the call, copied camera metadata belongs to the result and no global state or event listener survives.
 */
export function observeAutoMovieRecoveryImages(
  input: IAutoMovieRecoveryImageInput,
  options: IAutoMovieRecoveryOperation.Options = {},
): IAutoMovieRecoveryOperation.Result<IAutoMovieRecoveryImageObservation> {
  const schema: IAutoMovieRecoveryOperation.Result<unknown>["schema"] =
    "automovie-recovery-operation-v1";
  const operator: IAutoMovieRecoveryOperation.Result<unknown>["operator"] =
    "orthographic-images-v1";
  const cancelled: () => boolean = (): boolean =>
    options.signal?.aborted === true;
  if (cancelled())
    return {
      schema,
      operator,
      status: "cancelled",
      diagnostics: ["Cancelled before image admission"],
    };
  let callback: boolean = false;
  try {
    const finite: (value: unknown) => value is number = (
      value: unknown,
    ): value is number => typeof value === "number" && Number.isFinite(value);
    const positiveInteger: (value: unknown) => boolean = (
      value: unknown,
    ): boolean =>
      typeof value === "number" && Number.isSafeInteger(value) && value > 0;
    if (
      !input ||
      input.schema !== "automovie-recovery-images-v1" ||
      typeof input.objectId !== "string" ||
      !input.objectId.trim() ||
      typeof input.frame !== "string" ||
      !input.frame.trim() ||
      input.rigidity !== "asserted-fixed" ||
      !["analytic", "photograph", "inconsistent-stress"].includes(
        input.cohort,
      ) ||
      !input.budget ||
      !positiveInteger(input.budget.maxPixels) ||
      !positiveInteger(input.budget.maxViews) ||
      !positiveInteger(input.budget.maxRows) ||
      !Array.isArray(input.views) ||
      input.views.length < 3 ||
      input.views.length > input.budget.maxViews ||
      !input.background ||
      !Array.isArray(input.background.rgb) ||
      input.background.rgb.length !== 3 ||
      !finite(input.background.threshold) ||
      input.background.threshold <= 0 ||
      input.background.threshold > 255
    )
      throw new Error(
        "invalid-capture: explicit rigid RGB capture, known charts, background and finite budgets required",
      );
    for (let channel: number = 0; channel < 3; channel++)
      if (
        !Number.isInteger(input.background.rgb[channel]) ||
        input.background.rgb[channel] < 0 ||
        input.background.rgb[channel] > 255
      )
        throw new Error(
          "invalid-background: RGB channels must be unsigned bytes",
        );
    const identities: Set<string> = new Set();
    let pixels: number = 0;
    for (let index: number = 0; index < input.views.length; index++) {
      const view: IAutoMovieRecoveryImageInput["views"][number] =
        input.views[index];
      const camera:
        | IAutoMovieRecoveryImageInput["views"][number]["camera"]
        | undefined = view?.camera;
      if (
        !view ||
        typeof view.id !== "string" ||
        !view.id.trim() ||
        identities.has(view.id) ||
        typeof view.sourceSha256 !== "string" ||
        !/^[a-f0-9]{64}$/i.test(view.sourceSha256) ||
        typeof view.pixelProvenance !== "string" ||
        !view.pixelProvenance.trim() ||
        !positiveInteger(view.width) ||
        !positiveInteger(view.height) ||
        !camera ||
        camera.type !== "horizontal-orthographic" ||
        camera.calibration !== "supplied" ||
        !finite(camera.azimuthRadians) ||
        !finite(camera.pixelPitchMm) ||
        camera.pixelPitchMm <= 0 ||
        !Array.isArray(camera.principalPointPx) ||
        camera.principalPointPx.length !== 2 ||
        !finite(camera.principalPointPx[0]) ||
        !finite(camera.principalPointPx[1])
      )
        throw new Error(
          `invalid-view: supplied camera, pixel chart and unique byte identity required at ${index}`,
        );
      const count: number = view.width * view.height;
      pixels += count;
      if (
        !Number.isSafeInteger(count) ||
        !Number.isSafeInteger(pixels) ||
        pixels > input.budget.maxPixels
      )
        throw new Error(
          "budget-exhausted: total image pixels exceed maxPixels",
        );
      if (!(view.rgb8 instanceof Uint8Array) || view.rgb8.length !== 3 * count)
        throw new Error(
          `invalid-pixels: exact RGB8 population required at ${index}`,
        );
      assertRecoveryImageChart(view);
      identities.add(view.id);
    }
    const views: IAutoMovieRecoveryImageObservation["views"] = [];
    let retained: number = 0;
    for (const view of input.views) {
      if (cancelled())
        return {
          schema,
          operator,
          status: "cancelled",
          diagnostics: ["Cancelled between image scans"],
        };
      const rows: IAutoMovieRecoveryImageObservation["views"][number]["rows"] =
        [];
      const chart: ReturnType<typeof assertRecoveryImageChart> =
        assertRecoveryImageChart(view);
      let previousRow: number | undefined;
      for (let row: number = 0; row < view.height; row++) {
        let first: number = view.width,
          last: number = -1,
          count: number = 0;
        for (let column: number = 0; column < view.width; column++) {
          const at: number = 3 * (row * view.width + column);
          const distance: number = Math.max(
            Math.abs(view.rgb8[at] - input.background.rgb[0]),
            Math.abs(view.rgb8[at + 1] - input.background.rgb[1]),
            Math.abs(view.rgb8[at + 2] - input.background.rgb[2]),
          );
          if (distance < input.background.threshold) continue;
          if (count === 0) first = column;
          last = column;
          count++;
        }
        if (count === 0) continue;
        if (
          row === 0 ||
          row + 1 === view.height ||
          first === 0 ||
          last + 1 === view.width
        )
          throw new Error(
            `clipped-foreground: ${view.id} touches an image border`,
          );
        if (
          last - first + 1 !== count ||
          (previousRow !== undefined && previousRow + 1 !== row)
        )
          throw new Error(
            `unsupported-support: ${view.id} has holes or disconnected foreground`,
          );
        if (++retained > input.budget.maxRows)
          throw new Error(
            "budget-exhausted: occupied support rows exceed maxRows",
          );
        const camera: typeof view.camera = view.camera;
        const pitch: number = camera.pixelPitchMm;
        const yMm: number = (camera.principalPointPx[1] - row - 0.5) * pitch;
        const lowerMm: number = (first - camera.principalPointPx[0]) * pitch;
        const upperMm: number = (last + 1 - camera.principalPointPx[0]) * pitch;
        if (![yMm, lowerMm, upperMm].every(Number.isFinite))
          throw new Error(
            "nonfinite-chart: pixel-to-metric conversion exceeded finite arithmetic",
          );
        const measured: (typeof rows)[number] = { yMm, lowerMm, upperMm };
        chart.assertRow(measured, rows.at(-1));
        rows.push(measured);
        previousRow = row;
      }
      if (rows.length < 4)
        throw new Error(
          `insufficient-support: ${view.id} needs at least four occupied rows`,
        );
      rows.reverse();
      views.push({
        id: view.id,
        sourceSha256: view.sourceSha256,
        pixelProvenance: view.pixelProvenance,
        width: view.width,
        height: view.height,
        camera: {
          ...view.camera,
          principalPointPx: [...view.camera.principalPointPx],
        },
        rows,
        quantizationMm: view.camera.pixelPitchMm / 2,
      });
      callback = true;
      options.onProgress?.("image-support", views.length, input.views.length);
      callback = false;
    }
    if (cancelled())
      return {
        schema,
        operator,
        status: "cancelled",
        diagnostics: ["Cancelled before observation transfer"],
      };
    return {
      schema,
      operator,
      status: "complete",
      diagnostics: [],
      value: {
        schema: "automovie-recovery-image-support-v1",
        objectId: input.objectId,
        frame: input.frame,
        cohort: input.cohort,
        method: "fixed-background-channel-distance-v1",
        views,
      },
    };
  } catch (failure: unknown) {
    return {
      schema,
      operator,
      status: cancelled() ? "cancelled" : callback ? "failed" : "refused",
      diagnostics: [
        failure instanceof Error ? failure.message : String(failure),
      ],
    };
  }
}
