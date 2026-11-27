import { type IAutoMovieDeliveryCrop } from "@automovie/interface";
import type * as THREE from "three";

import { readAutoMovieDeliveryCrop as readAutoMovieDeliveryCropImplementation } from "./internal/readAutoMovieDeliveryCrop.js";

/** Public camera operations for the normalized delivery window. */
export namespace AutoMovieRenderSceneDeliveryCrop {
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