import { AutoMovieComposition } from "@automovie/engine";

import type { IFilm } from "../../IFilm";
import type { IFilmProduction } from "../../IFilmProduction";
import { CorridorStage } from "../scenes/paper-crane-invitation/CorridorStage";
import { teaSideBySide } from "../scenes/paper-crane-invitation/tea-side-by-side/teaSideBySide";
import { theCraneFlies } from "../scenes/paper-crane-invitation/the-crane-flies/theCraneFlies";
import { theTug } from "../scenes/paper-crane-invitation/the-tug/theTug";
import { twoCups } from "../scenes/paper-crane-invitation/two-cups/twoCups";

/**
 * The `paper-crane-invitation` film of
 * `docs/body/screenplay/paper-crane-invitation.md`: its four fifteen-second
 * scenes of one continuous take in the corridor window bay, in screenplay
 * order, mounted on the corridor stage. It runs 60 s at 24 fps on the
 * vertical 720 × 1280 raster, silent, with no title, subtitle, music or
 * grade beyond the bay's light.
 *
 * ```ts
 * films["paper-crane-invitation"].create(progress); // the mounted production
 * ```
 *
 * @returns The film.
 * @evidence docs/body/screenplay/paper-crane-invitation.md The screenplay file: every scene in order, one continuous take, 60 seconds.
 * @evidence contracts/development/composition.md#screenplay-realization Plays the four scenes in screenplay order filling the running time, at the commissioned raster and frame rate.
 * @evidence contracts/development/composition.md#composition-only Orders scenes and hands them to the stage; no calculation.
 * @evidence contracts/development/composition.md#living-scene The scenes own every presence; the film adds none.
 * @evidence contracts/development/common.md#meaningful-documentation States the film's scenes, running time and delivery profile.
 * @evidence contracts/development/implementation.md#principled-implementation Each mount resolves the composition once through the stage.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure The film holds its delivery profile and scene order; the stage owns mounting.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No special case.
 * @evidence contracts/development/implementation.md#efficient-algorithms One resolution per mount.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work One mount serves every seek.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The mount's dispose releases the scene.
 */
export function paperCraneInvitation(): IFilm {
  const duration: number = 60;
  return {
    durationSeconds: duration,
    fps: 24,
    width: 720,
    height: 1280,
    create: async (progress?: (message: string) => void): Promise<IFilmProduction> => {
      progress?.("Preparing the bay");
      const stage: CorridorStage = new CorridorStage();
      const mounted = stage.mount(paperCraneInvitation.compose(stage.cast), duration, progress);
      return {
        scene: mounted.scene,
        camera: mounted.camera,
        seek: mounted.seek,
        dispose: mounted.dispose,
      };
    },
  };
}

/** Companion of {@link paperCraneInvitation}: the film's scene order. */
export namespace paperCraneInvitation {
  /**
   * The film's composition: its four scenes in screenplay order on one cast.
   *
   * ```ts
   * paperCraneInvitation.compose(new CorridorStage().cast);
   * ```
   *
   * @param cast The corridor stage's cast.
   * @returns The composition.
   * @evidence docs/body/screenplay/paper-crane-invitation.md Every scene in screenplay order, one continuous take.
   * @evidence contracts/development/composition.md#screenplay-realization The four scenes in order, each filling its fifteen seconds.
   * @evidence contracts/development/composition.md#composition-only Only orders scenes.
   * @evidence contracts/development/composition.md#living-scene The scenes own every presence.
   * @evidence contracts/development/common.md#meaningful-documentation States the order.
   * @evidence contracts/development/implementation.md#principled-implementation The engine's sequence combinator.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One sequence.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No special case.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant size.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Nothing is shared.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns plain data.
   */
  export function compose(cast: CorridorStage.ICast): AutoMovieComposition {
    return AutoMovieComposition.sequence(theCraneFlies(cast), theTug(cast), twoCups(cast), teaSideBySide(cast));
  }
}
