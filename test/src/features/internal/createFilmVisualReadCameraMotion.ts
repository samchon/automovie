import type { IAutoMovieClip } from "@automovie/interface";

/** Preserve the original camera clip topology and caller-authored tracks. */
export const createFilmVisualReadCameraMotion = (
  tracks: IAutoMovieClip["tracks"],
): IAutoMovieClip => ({
  id: "cam-move",
  name: null,
  duration: 1,
  loop: false,
  tracks,
});
