import { AutoMovieChain } from "@automovie/engine";
import * as THREE from "three";

import { CoverageLaw } from "../../../laws/cinematography/CoverageLaw";

/**
 * The one camera inside the ring: its lens, the Three camera the Viewer
 * renders through, and the screenplay's camera decision as an intent. Where
 * it looks is the coverage interaction's work at every second.
 *
 * ```ts
 * const camera = new RingCamera();
 * camera.holdFinish(37, "s10-b04/3"); // widen into the finish view and hold it
 * ```
 *
 * @evidence docs/body/settings/cinematography/ring-coverage.md#one-camera One camera, one take, a normal-to-short-telephoto lens.
 * @evidence docs/body/settings/cinematography/ring-coverage.md#finish From the last exchange before the finish it widens and holds to the end.
 */
export class RingCamera {
  /** Stable subject id. */
  public readonly id: string = "camera";

  /** The rendered camera. */
  public readonly camera: THREE.PerspectiveCamera;

  /** Build the camera with the coverage law's lens on the 16:9 delivery frame. */
  public constructor() {
    this.camera = new THREE.PerspectiveCamera(
      (CoverageLaw.FIELD_OF_VIEW * 180) / Math.PI,
      16 / 9,
      0.05,
      80,
    );
  }

  /**
   * Widen into the finish view and hold it.
   *
   * @param seconds How long it holds, to the end of the film.
   * @param keep The finishing strike's anchor, whose surface, contact and descending path the view keeps visible.
   * @param anchor Optional anchor id.
   * @returns The chain.
   */
  public holdFinish(
    seconds: number,
    keep: string,
    anchor?: string,
  ): AutoMovieChain {
    return AutoMovieChain.of({
      subject: this.id,
      capability: "frame",
      ...(anchor === undefined ? {} : { anchor }),
      parameters: Object.freeze({
        action: Object.freeze({
          kind: "frame",
          size: "finish",
          seconds,
          keep,
        }),
      }),
    });
  }
}
