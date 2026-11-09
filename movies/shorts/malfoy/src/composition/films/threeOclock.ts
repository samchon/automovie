import type { IFilm } from "../../IFilm";
import type { IFilmProduction } from "../../IFilmProduction";
import { CourtyardStage } from "../scenes/three-oclock/CourtyardStage";
import { composeThreeOclock } from "./composeThreeOclock";

/**
 * The `three-oclock` film of `docs/body/screenplay/three-oclock.md`: its
 * three scenes in the side courtyard in screenplay order, mounted on the
 * courtyard stage, as a vertical 60-second silent short at 24 fps and
 * 720 × 1280. It has no title, subtitle, score or grade beyond the set's
 * late-afternoon daylight.
 *
 * ```ts
 * films["three-oclock"].create(progress); // the mounted production
 * ```
 *
 * @returns The film.
 * @evidence docs/body/screenplay/three-oclock.md The screenplay file: every scene in order, 60 seconds, silent, vertical.
 * @evidence contracts/development/composition.md#screenplay-realization Plays every scene in order with the delivery profile the commission fixes.
 * @evidence contracts/development/composition.md#composition-only Builds the stage, composes the scenes and mounts them.
 * @evidence contracts/development/composition.md#living-scene The scenes keep every presence alive; the film adds nothing on top.
 * @evidence contracts/development/common.md#meaningful-documentation States the film's scenes, profile and what it leaves out.
 * @evidence contracts/development/implementation.md#principled-implementation Each mount resolves a fresh stage and composition, so playback, seeking and capture read one frozen schedule.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure The film holds its profile; the stage owns mounting and the scenes own the action.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No special case or timing is added here.
 * @evidence contracts/development/implementation.md#efficient-algorithms One resolution per mount.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work One mounted stage serves every seek of a mount.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The mount owns its scene and releases it through dispose.
 */
export function threeOclock(): IFilm {
  const duration: number = 60;
  return {
    durationSeconds: duration,
    fps: 24,
    width: 720,
    height: 1280,
    create: async (
      progress?: (message: string) => void,
    ): Promise<IFilmProduction> => {
      progress?.("Preparing the courtyard");
      const stage: CourtyardStage = new CourtyardStage();
      const mounted: ReturnType<CourtyardStage["mount"]> = stage.mount(
        composeThreeOclock(stage.cast),
        duration,
        progress,
      );
      return {
        scene: mounted.scene,
        camera: mounted.camera,
        seek: mounted.seek,
        dispose: mounted.dispose,
      };
    },
  };
}
