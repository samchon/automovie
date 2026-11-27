import { type IAutoMovieDeliveryCrop } from "@automovie/interface";
import type * as THREE from "three";

import {
  applyDeliveryCrop as applyDeliveryCropImplementation,
} from "./internal/applyDeliveryCrop";
import { readDeliveryCrop as readDeliveryCropImplementation } from "./internal/readDeliveryCrop";

/** Public camera operations for the normalized delivery window. */
export namespace AutoMovieRenderSceneDeliveryCrop {
  /** Apply a normalized delivery window to a perspective camera. */
  export function apply(
    camera: THREE.PerspectiveCamera,
    crop: IAutoMovieDeliveryCrop | undefined,
  ): void {
    applyDeliveryCropImplementation(camera, crop);
  }

  /**
   * Read the normalized delivery window currently installed on a perspective
   * camera. Disabled and whole-gate views return `undefined`; other view offsets
   * are normalized and resolved with the Engine's crop contract.
   */
  export function read(
    camera: THREE.PerspectiveCamera,
  ): IAutoMovieDeliveryCrop | undefined {
    return readDeliveryCropImplementation(camera);
  }
}