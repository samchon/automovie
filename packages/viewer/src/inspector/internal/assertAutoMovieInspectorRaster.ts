import type { IAutoMovieDrawScene } from "@automovie/render";

/**
 * Refuse, naming the subject, a subject whose duration, frame rate, width or
 * height is not positive, before the mount gives the playhead its duration: no
 * clock or picture follows from it.
 */
export function assertAutoMovieInspectorRaster(
  name: string,
  instance: Pick<
    IAutoMovieDrawScene,
    "durationSeconds" | "fps" | "width" | "height"
  >,
): void {
  for (const [field, value] of [
    ["duration", instance.durationSeconds],
    ["fps", instance.fps],
    ["width", instance.width],
    ["height", instance.height],
  ] as const)
    if (!(value > 0))
      throw new Error(`Subject "${name}" ${field} ${value} is not positive`);
}
