import type { IAutoMovieCamera } from "@automovie/interface";
import type * as THREE from "three";
import type { IAutoMovieViewerCameraDepthPrecisionReport } from "./IAutoMovieViewerCameraDepthPrecisionReport.js";

/**
 * Observe the currently bound draw framebuffer and compare it with one
 * resolved camera.
 *
 * The engine's metric is conservative at `minimumDepthBits`; a standard viewer
 * with at least that many actual bits can only provide equal or finer adjacent
 * steps. Logarithmic and reversed projection are refused because they implement
 * a different metric rather than silently appearing as extra capability.
 *
 * This compares near/far properties and the currently bound framebuffer's bits,
 * not the camera matrix contents, shader depth writes or measured surface error.
 * The caller must have installed the declared standard projection before use.
 *
 * @evidence contracts/common.md#principled-implementation Queries WebGL DEPTH_BITS on the current draw target and accepts integer capability at least the declared fixed-point minimum only with exact near/far parity and standard renderer mode; validates finite positive source distances/budget, but does not re-evaluate the engine's maximum-step bound or inspect a stale/custom projection matrix.
 * @evidence contracts/common.md#clear-and-simple-design Returns one portable report with ordered refusal statuses; framebuffer observation and admission stay together, while the throwing wrapper only renders that result as a caller error.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Uses actual WebGL state and renderer capabilities with no host-name whitelist or fallback 24-bit value; unavailable bits remain null and nonstandard projection is refused rather than compensated.
 * @evidence contracts/common.md#meaningful-documentation Documents the current draw-target query, standard fixed-point comparison, nonstandard modes and the distinction between property/capability parity and measured scene/projection correctness.
 * @evidence contracts/performance.md#efficient-algorithms Performs one WebGL capability query plus fixed-count scalar checks and report construction; CPU space is constant, though getParameter may synchronize with the driver and is intended as a capability gate rather than per-pixel work.
 * @evidence contracts/performance.md#reuse-equivalent-work Shares the report with the assertion wrapper; no cache is retained because framebuffer binding, capabilities and camera clips jointly determine the observation and may change between requests.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Borrows renderer/context/camera for one synchronous query and returns scalars; no framebuffer ownership, GPU allocation, retained browser handle or running task is acquired.
 */
export const evaluateAutoMovieViewerCameraDepthPrecision: (props: { renderer: THREE.WebGLRenderer; source: Pick<IAutoMovieCamera, "id" | "near" | "far" | "depthPrecision">; realized: THREE.PerspectiveCamera; }) => IAutoMovieViewerCameraDepthPrecisionReport = (props: {
  /** Viewer renderer whose currently bound draw framebuffer receives the shot. */
  renderer: THREE.WebGLRenderer;
  /** Portable resolved camera declaration. */
  source: Pick<IAutoMovieCamera, "id" | "near" | "far" | "depthPrecision">;
  /** Three camera built from that declaration. */
  realized: THREE.PerspectiveCamera;
}): IAutoMovieViewerCameraDepthPrecisionReport => {
  const logarithmic: boolean = props.renderer.capabilities.logarithmicDepthBuffer;
  const reversed: boolean = props.renderer.capabilities.reversedDepthBuffer;
  const projection: IAutoMovieViewerCameraDepthPrecisionReport["projection"] =
    logarithmic
      ? reversed
        ? "logarithmic-reversed"
        : "logarithmic"
      : reversed
        ? "reversed"
        : "standard";
  const context: WebGLRenderingContext | WebGL2RenderingContext = props.renderer.getContext();
  const observed: unknown = context.getParameter(context.DEPTH_BITS) as unknown;
  const observedDepthBits: number | null =
    typeof observed === "number" && Number.isFinite(observed) ? observed : null;
  const base: { camera: string; sourceNear: number | null; sourceFar: number | null; realizedNear: number | null; realizedFar: number | null; minimumDepthBits: number | null; observedDepthBits: number | null; projection: "standard" | "logarithmic" | "reversed" | "logarithmic-reversed"; } = {
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
  const levels: number = 2 ** props.source.depthPrecision.minimumDepthBits - 1;
  if (
    props.source.id.trim().length === 0 ||
    !Number.isFinite(props.source.near) ||
    props.source.near <= 0 ||
    !Number.isFinite(props.source.far) ||
    props.source.far <= props.source.near ||
    !Number.isSafeInteger(props.source.depthPrecision.minimumDepthBits) ||
    props.source.depthPrecision.minimumDepthBits <= 0 ||
    !Number.isSafeInteger(levels) ||
    !Number.isFinite(props.source.depthPrecision.maximumStepMeters) ||
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
  if (
    observedDepthBits === null ||
    !Number.isSafeInteger(observedDepthBits) ||
    observedDepthBits < 0
  )
    return { ...base, status: "invalid-capability", passed: false };
  if (observedDepthBits < props.source.depthPrecision.minimumDepthBits)
    return { ...base, status: "insufficient-capability", passed: false };
  return { ...base, status: "satisfied", passed: true };
};

const finiteOrNull: (value: number) => number | null = (value: number): number | null =>
  Number.isFinite(value) ? value : null;
