import { FILM_FPS } from "../takes/FILM_FPS";

/**
 * Frames a second a scene's take is posed at: film's rate on twos, the
 * animator's convention of holding each drawing for two film frames. A pose
 * costs tens of milliseconds, so this halves a card's wait against posing
 * every film frame, and `SceneTrack.sample` interpolates between the frames.
 */
export const SCENE_FPS: number = FILM_FPS / 2;
