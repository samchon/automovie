import type { AutoMovieComposition } from "@automovie/engine";

import type { IFilm } from "../../IFilm";
import type { IFilmProduction } from "../../IFilmProduction";
import { RingStage } from "../scenes/kickboxing/RingStage";
import { composeKickboxing } from "./composeKickboxing";

/**
 * The kickboxing film of `docs/body/screenplay/kickboxing.md`: the twelve
 * continuous scenes of one round in screenplay order, ten fifteen-second
 * fighting phases to the finish at 150.000, then the count and the
 * celebration aligned to their anchors, with the camera's widening into the
 * finish view at 143 s. It runs 180 s at 30 fps, one take with no cut,
 * title, subtitle, music or grade beyond the ring's light.
 *
 * ```ts
 * films.kickboxing.create(progress); // the mounted production
 * ```
 *
 * @returns The film.
 * @evidence docs/body/screenplay/kickboxing.md The screenplay file: every scene in order, one continuous take, 180 seconds.
 * @evidence docs/body/screenplay/kickboxing.md#s10-b03 The camera begins widening at 143 s and holds to the end.
 */
export function kickboxing(): IFilm {
  const duration: number = 180;
  return {
    durationSeconds: duration,
    fps: 30,
    create: async (
      progress?: (message: string) => void,
    ): Promise<IFilmProduction> => {
      const stage: RingStage = new RingStage();
      const composition: AutoMovieComposition = composeKickboxing(
        stage.cast,
        duration,
      );
      const mounted: RingStage.IMounted = await stage.mount(
        composition,
        duration,
        "kickboxing",
        progress,
      );
      return {
        scene: mounted.scene,
        camera: mounted.camera,
        performance: {
          bodies: mounted.bodies,
          frame: mounted.frame,
          contacts: () => [],
          maximumContacts: 1,
          metresPerNewton: 0.001,
        },
        soundtrack: { cues: mounted.cues, assets: RingStage.SOUND },
        report: {
          violations: mounted.violations,
          findings: mounted.findings,
          measures: mounted.measures,
        },
        seek: mounted.seek,
        dispose: mounted.dispose,
      };
    },
  };
}
