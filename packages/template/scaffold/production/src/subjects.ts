import type { IAutoMovieMark } from "@automovie/engine";
import type {
  AutoMovieDrawSubjects,
  IAutoMovieDrawScene,
  IAutoMovieDrawSubject,
} from "@automovie/render";

import type { IFilm } from "./IFilm";
import type { IFilmProduction } from "./IFilmProduction";
import { clampProductionSeconds } from "./clampProductionSeconds";
import { films } from "./composition/films";
import { markFilmProduction } from "./markFilmProduction";

/**
 * The production's films as the subjects its draw-only page offers, one per registered film under the film's name: what `automovie capture --module src/subjects.ts` and the delivery render draw.
 *
 * Each film is created as the Viewer creates it, at its delivery raster (1280 × 720 when it states none), seeked through its own `seek` at a second clamped to its running time, and marked by `markFilmProduction`, so a capture, a delivered frame and the Viewer show the same state.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what each subject is, who draws it, and how its raster, seek and marks are taken.
 * @evidence contracts/development/implementation.md#principled-implementation Wiring only: the film registry, the film's own create and seek, and the shared marks, mapped onto the render package's subject contract.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One mapping per film.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No film is named; the props are not read, since films need none.
 * @evidence contracts/development/implementation.md#efficient-algorithms Linear in the registered films; a film is created only when its subject is.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A mapping made once per page.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The created film is released by the subject's `dispose`.
 */
export const subjects: AutoMovieDrawSubjects = (): Readonly<
  Record<string, IAutoMovieDrawSubject>
> =>
  Object.fromEntries(
    Object.entries(films).map(([name, film]: [string, IFilm]): [string, IAutoMovieDrawSubject] => [
      name,
      {
        create: async (): Promise<IAutoMovieDrawScene> => {
          const production: IFilmProduction = await film.create();
          return {
            scene: production.scene,
            camera: production.camera,
            durationSeconds: film.durationSeconds,
            fps: film.fps,
            width: film.width ?? 1280,
            height: film.height ?? 720,
            ...(production.views === undefined ? {} : { views: production.views }),
            marks: (seconds: number): IAutoMovieMark[] => markFilmProduction(production, seconds),
            seek: async (seconds: number): Promise<void> =>
              production.seek(clampProductionSeconds(seconds, film.durationSeconds)),
            dispose: (): void => production.dispose(),
          };
        },
      },
    ]),
  );
