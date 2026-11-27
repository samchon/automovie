import type { IAutoMovieCamera } from "@automovie/interface";
import type * as THREE from "three";

import { assertAutoMovieViewerCameraDepthPrecision as assertImplementation } from "./internal/assertAutoMovieViewerCameraDepthPrecision.js";
import { evaluateAutoMovieViewerCameraDepthPrecision as evaluateImplementation } from "./internal/evaluateAutoMovieViewerCameraDepthPrecision.js";
import type { IAutoMovieDepthPrecisionRenderer } from "./IAutoMovieDepthPrecisionRenderer.js";
import type { IAutoMovieViewerCameraDepthPrecisionReport } from "./IAutoMovieViewerCameraDepthPrecisionReport.js";

/** Inputs used to compare a declared camera with the viewer's realized camera. */
export interface IAutoMovieRenderViewerCameraDepthPrecisionProps {
  /** Renderer whose currently bound draw framebuffer receives the shot. */
  renderer: IAutoMovieDepthPrecisionRenderer;
  /** Portable resolved camera declaration. */
  source: Pick<IAutoMovieCamera, "id" | "near" | "far" | "depthPrecision">;
  /** Three camera built from that declaration. */
  realized: THREE.PerspectiveCamera;
}

/** Public operations for the viewer camera's declared depth precision. */
export namespace AutoMovieRenderViewerCameraDepthPrecision {
  /**
   * Observe the bound draw framebuffer and compare its depth capability with a
   * resolved camera. The caller must install the declared standard projection
   * before evaluation. This checks camera clip properties and framebuffer depth
   * bits; it does not inspect matrix contents, shader writes or rendered error.
   */
  export function evaluate(
    props: IAutoMovieRenderViewerCameraDepthPrecisionProps,
  ): IAutoMovieViewerCameraDepthPrecisionReport {
    return evaluateImplementation(props);
  }

  /**
   * Enforce the declared fixed-point depth capability gate, returning a passing
   * report or throwing with the observed status, clips, projection and bit count.
   */
  export function assert(
    props: IAutoMovieRenderViewerCameraDepthPrecisionProps,
  ): IAutoMovieViewerCameraDepthPrecisionReport {
    return assertImplementation(props);
  }
}