/**
 * The `userData` key under which `applySceneMedium` attaches a scene's
 * `IAutoMovieMedium` to a built `three.js` scene, and from which
 * `readAutoMovieSceneMedium` reads it back.
 *
 * `three.js` has no participating-medium object, so the declaration rides on
 * the scene the way the film's other scene-wide facts do, where every host that
 * draws the scene can find it.
 */
export const AUTOMOVIE_SCENE_MEDIUM_KEY: string = "automovieMedium";
