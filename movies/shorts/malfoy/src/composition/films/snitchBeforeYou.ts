import type { IFilm } from "../../IFilm";
import type { IFilmProduction } from "../../IFilmProduction";
import { PitchStage } from "../scenes/snitch-before-you/PitchStage";
import { composeSnitchBeforeYou } from "./composeSnitchBeforeYou";

/**
 * The `snitch-before-you` film of `docs/body/screenplay/snitch-before-you.md`:
 * one Saturday practice match in seven scenes, sixty seconds at 24 fps on
 * the vertical 720 × 1280 frame, silent, with no title, subtitle, score or
 * grade beyond the pitch's daylight. The stage resolves the composition once
 * per mount and `seek` places any second.
 *
 * ```ts
 * films["snitch-before-you"].create(progress);
 * ```
 *
 * @returns The film.
 * @evidence docs/body/screenplay/snitch-before-you.md The screenplay file: every scene in order, 60 seconds.
 * @evidence contracts/development/composition.md#screenplay-realization Plays every scene in order to 60 s on the delivery profile the commission fixes.
 * @evidence contracts/development/common.md#meaningful-documentation States the film's length, raster and what a mount does.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Each mount owns its scene and releases it in `dispose`.
 */
export function snitchBeforeYou(): IFilm {
  const duration: number = 60;
  return {
    durationSeconds: duration,
    fps: 24,
    width: 720,
    height: 1280,
    create: async (progress?: (message: string) => void): Promise<IFilmProduction> => {
      const stage: PitchStage = new PitchStage();
      const mounted = stage.mount(composeSnitchBeforeYou(stage), duration, progress);
      return {
        scene: mounted.scene,
        camera: mounted.camera,
        seek: mounted.seek,
        dispose: mounted.dispose,
      };
    },
  };
}
