import type { IFilm } from "../../IFilm";
import type { IFilmProduction } from "../../IFilmProduction";
import { CourtStage } from "../scenes/look-at-me-duel/CourtStage";
import { composeLookAtMeDuel } from "./composeLookAtMeDuel";

/**
 * The `look-at-me-duel` film of `docs/body/screenplay/look-at-me-duel.md`:
 * the four scenes of one private practice duel on the training court in
 * screenplay order, mounted on the court stage. It runs 60 s at 24 fps on
 * the vertical 720 × 1280 raster, silent, with no title, subtitle, score or
 * grade beyond the court's daylight.
 *
 * ```ts
 * films["look-at-me-duel"].create(progress); // the mounted production
 * ```
 *
 * @returns The film.
 * @evidence docs/body/screenplay/look-at-me-duel.md The screenplay file: every scene in order, 60 seconds, vertical, silent.
 * @evidence contracts/development/composition.md#screenplay-realization Plays every scene in order on the delivery profile and fills the running time.
 * @evidence contracts/development/composition.md#composition-only Builds the stage, composes the scenes and mounts them; no calculation.
 * @evidence contracts/development/composition.md#living-scene The scenes own every presence.
 * @evidence contracts/development/common.md#meaningful-documentation States the film's order, length and delivery profile.
 * @evidence contracts/development/implementation.md#principled-implementation A fresh stage and mount per `create`, so playback, seeking and capture read one resolved schedule.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure The film holds its profile and the mount; scenes hold the story.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No special case.
 * @evidence contracts/development/implementation.md#efficient-algorithms One resolution per mount.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The mount's tracks serve every seek.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Each mount owns its scene and disposes it with the page.
 */
export function lookAtMeDuel(): IFilm {
  const duration: number = 60;
  return {
    durationSeconds: duration,
    fps: 24,
    width: 720,
    height: 1280,
    create: async (progress?: (message: string) => void): Promise<IFilmProduction> => {
      const stage: CourtStage = new CourtStage();
      const mounted = stage.mount(composeLookAtMeDuel(stage.cast), duration, progress);
      return { scene: mounted.scene, camera: mounted.camera, seek: mounted.seek, dispose: mounted.dispose };
    },
  };
}
