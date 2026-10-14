import type { IAutoMovieShot } from "@automovie/interface";

/** Create the original caption tests' shot with its supplied id and duration, fixed scene/camera and fresh empty performance/motion lists. */
export function createCaptionShot(id: string, duration: number): IAutoMovieShot {
  return {
    id,
    name: null,
    scene: "scene-duel",
    camera: "cam-main",
    cameraMotion: null,
    performances: [],
    objectMotions: [],
    duration,
  };
}
