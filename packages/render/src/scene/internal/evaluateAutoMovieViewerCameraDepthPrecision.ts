import type { IAutoMovieCamera } from "@automovie/interface";
import type * as THREE from "three";

import { AUTOMOVIE_FLOAT32_MAX } from "./AUTOMOVIE_FLOAT32_MAX.js";
import type { IAutoMovieDepthPrecisionRenderer } from "../IAutoMovieDepthPrecisionRenderer.js";
import type { IAutoMovieViewerCameraDepthPrecisionReport } from "../IAutoMovieViewerCameraDepthPrecisionReport.js";

/**
 * Observe the currently bound draw framebuffer and compare it with one resolved
 * camera.
 *
 * The engine's metric is conservative at `minimumDepthBits`; a standard viewer
 * with at least that many actual bits can only provide equal or finer adjacent
 * steps. Logarithmic and reversed projection are refused because they implement
 * a different metric rather than silently appearing as extra capability.
 *
 * This compares near/far properties and the currently bound framebuffer's bits,
 * not the camera matrix contents, shader depth writes or measured surface
 * error. The caller must have installed the declared standard projection before
 * use.
 */
export const evaluateAutoMovieViewerCameraDepthPrecision: (props: {
  renderer: IAutoMovieDepthPrecisionRenderer;
  source: Pick<IAutoMovieCamera, "id" | "near" | "far" | "depthPrecision">;
  realized: THREE.PerspectiveCamera;
}) => IAutoMovieViewerCameraDepthPrecisionReport = (props: {
  /** Viewer renderer whose currently bound draw framebuffer receives the shot. */
  renderer: IAutoMovieDepthPrecisionRenderer;
  /** Portable resolved camera declaration. */
  source: Pick<IAutoMovieCamera, "id" | "near" | "far" | "depthPrecision">;
  /** Three camera built from that declaration. */
  realized: THREE.PerspectiveCamera;
}): IAutoMovieViewerCameraDepthPrecisionReport => {
  const logarithmic: boolean =
    props.renderer.capabilities.logarithmicDepthBuffer;
  const reversed: boolean = props.renderer.capabilities.reversedDepthBuffer;
  const projection: IAutoMovieViewerCameraDepthPrecisionReport["projection"] =
    logarithmic
      ? reversed
        ? "logarithmic-reversed"
        : "logarithmic"
      : reversed
        ? "reversed"
        : "standard";
  const context: Pick<WebGLRenderingContext, "DEPTH_BITS" | "getParameter"> =
    props.renderer.getContext();
  // WebGL reports DEPTH_BITS as a number.
  const observedDepthBits: number | null = context.getParameter(
    context.DEPTH_BITS,
  );
  const base: {
    camera: string;
    sourceNear: number | null;
    sourceFar: number | null;
    realizedNear: number | null;
    realizedFar: number | null;
    minimumDepthBits: number | null;
    observedDepthBits: number | null;
    projection:
      | "standard"
      | "logarithmic"
      | "reversed"
      | "logarithmic-reversed";
  } = {
    camera: props.source.id,
    sourceNear: finiteOrNull(props.source.near),
    sourceFar: finiteOrNull(props.source.far),
    realizedNear: finiteOrNull(props.realized.near),
    realizedFar: finiteOrNull(props.realized.far),
    minimumDepthBits: finiteOrNull(
      props.source.depthPrecision.minimumDepthBits,
    ),
    observedDepthBits,
    projection,
  };
  if (
    props.source.near <= 0 ||
    props.source.far <= props.source.near ||
    props.source.depthPrecision.minimumDepthBits <= 0 ||
    // The quantized depth levels, 2^bits - 1, must stay an exact integer count.
    2 ** props.source.depthPrecision.minimumDepthBits - 1 >
      Number.MAX_SAFE_INTEGER ||
    props.source.depthPrecision.maximumStepMeters <= 0
  )
    return { ...base, status: "invalid-source", passed: false };
  if (
    props.realized.near !== props.source.near ||
    props.realized.far !== props.source.far
  )
    return { ...base, status: "projection-mismatch", passed: false };
  if (projection !== "standard")
    return { ...base, status: "nonstandard-projection", passed: false };
  if (observedDepthBits === null || observedDepthBits < 0)
    return { ...base, status: "invalid-capability", passed: false };
  if (observedDepthBits < props.source.depthPrecision.minimumDepthBits)
    return { ...base, status: "insufficient-capability", passed: false };
  return { ...base, status: "satisfied", passed: true };
};

/**
 * A depth-report number the depth pipeline can represent, else null: planes and
 * bit counts reach the GPU as float32, so a magnitude beyond the float32
 * maximum, as an unbounded far plane has, is stated as absent.
 */
const finiteOrNull: (value: number) => number | null = (
  value: number,
): number | null => (Math.abs(value) <= AUTOMOVIE_FLOAT32_MAX ? value : null);
