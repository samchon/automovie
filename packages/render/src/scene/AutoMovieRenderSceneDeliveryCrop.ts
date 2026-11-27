import { type IAutoMovieDeliveryCrop } from "@automovie/interface";
import type * as THREE from "three";

import {
  applyAutoMovieDeliveryCrop as applyAutoMovieDeliveryCropImplementation,
} from "./internal/applyAutoMovieDeliveryCrop.js";
import { readAutoMovieDeliveryCrop as readAutoMovieDeliveryCropImplementation } from "./internal/readAutoMovieDeliveryCrop.js";

/** Public camera operations for the normalized delivery window. */
export namespace AutoMovieRenderSceneDeliveryCrop {
  /** Apply a normalized delivery window to a perspective camera. */
  export function apply(
    camera: THREE.PerspectiveCamera,
    crop: IAutoMovieDeliveryCrop | undefined,
  ): void {
    applyAutoMovieDeliveryCropImplementation(camera, crop);
  }

  /**
   * Read the normalized delivery window currently installed on a perspective
   * camera. Disabled and whole-gate views return `undefined`; other view offsets
   * are normalized and resolved with the Engine's crop contract.
   */
  export function read(
    camera: THREE.PerspectiveCamera,
  ): IAutoMovieDeliveryCrop | undefined {
    return readAutoMovieDeliveryCropImplementation(camera);
  }
}