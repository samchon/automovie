import type * as THREE from "three";

import type { IAutoMovieRenderPrepareSurfaceGraphicsProps } from "./IAutoMovieRenderPrepareSurfaceGraphicsProps";
import type { IAutoMovieRenderSurfaceGraphicsObject } from "./IAutoMovieRenderSurfaceGraphicsObject";
import { hideSurfaceGraphics } from "./surfaceGraphic/internal/hideSurfaceGraphics";
import { prepareSurfaceGraphics } from "./surfaceGraphic/internal/prepareSurfaceGraphics";

/** Mount surface graphics and control their pass visibility. */
export namespace AutoMovieRenderSurfaceGraphic {
  /**
   * Hide the visible graphic roots for a pass that omits surface graphics.
   *
   * The returned function restores those roots. Hidden roots and selected keys
   * retain their previous state.
   *
   * @param scene The scene containing the mounted graphics.
   * @returns The restore function for this pass.
   */
  export function hide(scene: THREE.Scene): () => void {
    return hideSurfaceGraphics(scene);
  }

  /**
   * Mount the graphics of one shot and prepare their key playback.
   *
   * Each track mounts a named group half a millimetre above its surface. A
   * fixed surface rides the mounted model root. An articulated surface rides
   * its built rigid part, keeping the authored model-rest reading frame even
   * when that part is already posed.
   *
   * Each root holds one group per key, clipped to a declared outline. Use the
   * returned `apply` to select the key at a shot-local second. Each placed prop
   * keeps its own key state.
   *
   * Listed fonts decode before graphics are built. Text with no font uses the
   * system UI font. Images carried by the model decode from their PNG bytes.
   * Other images use the supplied loader. Textures use sRGB and start with the
   * image's top row at the face's top.
   *
   * @param props The shot, scene, model registry and mounted model lookup.
   * @returns A shot-owned graphics handle. Dispose it when the shot retires.
   * @throws When a listed font cannot decode or a track lacks its mounted
   *   model, a sized surface, its rigid carrier or a required image. Resources
   *   already created are released on refusal.
   */
  export function prepare(
    props: IAutoMovieRenderPrepareSurfaceGraphicsProps,
  ): Promise<IAutoMovieRenderSurfaceGraphicsObject> {
    return prepareSurfaceGraphics(props);
  }
}
