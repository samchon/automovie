import type { IAutoMovieFilmOptics } from "@automovie/interface";
import type * as THREE from "three";

import type { AutoMovieRenderFilmAlpha } from "../scene/AutoMovieRenderFilmAlpha";
import type { AutoMovieRenderFilmResponseStage } from "../scene/AutoMovieRenderFilmResponseStage";
import type { IAutoMovieRenderFilmResponseRenderer } from "../scene/IAutoMovieRenderFilmResponseRenderer";

/** Inputs for accumulating the film samples of one frame. */
export interface IAutoMovieRenderAccumulateFilmSamplesProps {
  /** The stage that sums the samples. */
  stage: Pick<AutoMovieRenderFilmResponseStage, "accumulate">;
  /** The renderer. */
  renderer: IAutoMovieRenderFilmResponseRenderer;
  /** The scene drawn. */
  scene: THREE.Scene;
  /** The film optics at `seconds`, with `samples` set. */
  optics: IAutoMovieFilmOptics;
  /** The frame's second, placed again after the last sample. */
  seconds: number;
  /** The film's frame rate. */
  fps: number;
  /** The delivery camera's vertical field of view in degrees. */
  fovY: number;
  /** Drawn raster width in pixels. */
  width: number;
  /** Drawn raster height in pixels. */
  height: number;
  /** Place the scene at a second. */
  seek: (seconds: number) => Promise<void>;
  /** The drawing camera resolved at a second, after `seek` to it. */
  camera: (seconds: number) => THREE.Camera;
  /** A camera the lens samples are drawn through; overwritten each sample. */
  scratch: THREE.PerspectiveCamera;
  /** Alpha policy for a transparent clear; absent accumulates an opaque frame. */
  alpha?: AutoMovieRenderFilmAlpha;
  /** Wrap each sample's draw to measure its occlusion, when required. */
  around?: (
    sample: { camera: THREE.Camera; seconds: number; index: number },
    draw: () => void,
  ) => void;
}
