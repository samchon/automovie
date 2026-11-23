import type { IAutoMovieInspectorLive } from "./IAutoMovieInspectorLive.js";
import type { IAutoMovieInspectorSceneHost } from "./IAutoMovieInspectorSceneHost.js";

/**
 * Follow the host's drawing size: when every side and the pixel ratio are
 * positive and finite and differ from the size the renderer has, resize the
 * renderer's drawing buffer, leaving the canvas's layout to the page, and mark
 * the mount for a redraw.
 *
 * @returns Whether the size can be drawn at.
 */
export function followAutoMovieInspectorSize(
  now: IAutoMovieInspectorLive,
  size: IAutoMovieInspectorSceneHost.ISize,
): boolean {
  const drawable: boolean = [size.width, size.height, size.pixelRatio].every(
    (value: number): boolean => Number.isFinite(value) && value > 0,
  );
  if (
    drawable &&
    (now.size === undefined ||
      now.size.width !== size.width ||
      now.size.height !== size.height ||
      now.size.pixelRatio !== size.pixelRatio)
  ) {
    now.renderer.setPixelRatio(size.pixelRatio);
    now.renderer.setSize(size.width, size.height, false);
    now.size = size;
    now.dirty = true;
  }
  return drawable;
}
