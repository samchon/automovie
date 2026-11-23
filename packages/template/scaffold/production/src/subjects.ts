import { preparePhysicalGeometry } from "@automovie/engine";
import type {
  IAutoMovieDialogueMouths,
  IAutoMovieFilmOptics,
  IAutoMovieFilmShading,
  IAutoMovieInspectionDiagnostics,
  IAutoMovieMark,
  IAutoMovieRenderSoftPropFrame,
} from "@automovie/interface";
import {
  type AutoMovieDrawSubjects,
  type IAutoMovieDrawScene,
  type IAutoMovieDrawSubject,
  bindAutoMovieDrawSceneSoftProps,
} from "@automovie/render";
import type * as THREE from "three";

import type { IFilm } from "./IFilm";
import type { IFilmProduction } from "./IFilmProduction";
import { clampProductionSeconds } from "./clampProductionSeconds";
import { films } from "./composition/films";
import { inspectFilmProduction } from "./inspectFilmProduction";
import { markFilmProduction } from "./markFilmProduction";

/**
 * The production's films as subjects, one per registered film under the film's
 * name: what the draw-only page `automovie capture --module src/subjects.ts`
 * and `automovie render --module src/subjects.ts` build over this module
 * offers, and what `automovie inspect` shows.
 *
 * Each film is created as the Viewer creates it, at its delivery raster (1280 ×
 * 720 when it states none), seeked through its own `seek` at a second clamped
 * to its running time, given its own `optics`, `shading` and `beforeDraw` at
 * the same clamped second, and marked by `markFilmProduction`, so a capture, a
 * delivered frame and the Viewer show the same state through the same camera
 * response. A film with `playback` hands its timeline over as the subject's
 * `cut`, which the render records in its report, and its sequence, whose
 * transitions every film picture draws through the film's `seekShot`, the
 * shot-local time unclamped and the film second clamped. A film with `speak`
 * takes the dialogue mouths the capture and the render hand the subject, and
 * reads them in its own seek.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what each subject is, who draws it, and how its raster, seek and marks are taken.
 * @evidence contracts/development/implementation.md#principled-implementation Maps the film registry, placement and shared marks onto the draw contract, and binds optional soft surfaces after placement at the same clamped second.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One mapping per film.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No film is named; the props are not read, since films need none.
 * @evidence contracts/development/implementation.md#efficient-algorithms Linear in the registered films; a film is created only when its subject is.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A mapping made once per page.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The subject's dispose releases the film, and the render adapter independently releases any soft prop meshes it mounts.
 */
export const subjects: AutoMovieDrawSubjects = (): Readonly<
  Record<string, IAutoMovieDrawSubject>
> =>
  Object.fromEntries(
    Object.entries(films).map(
      ([name, film]: [string, IFilm]): [string, IAutoMovieDrawSubject] => [
        name,
        {
          create: async (): Promise<IAutoMovieDrawScene> => {
            const geometry: Awaited<
              ReturnType<typeof preparePhysicalGeometry>
            > = await preparePhysicalGeometry();
            const production: IFilmProduction = await film.create();
            const subject: IAutoMovieDrawScene = {
              scene: production.scene,
              camera: production.camera,
              durationSeconds: film.durationSeconds,
              fps: film.fps,
              width: film.width ?? 1280,
              ...(production.delivery === undefined
                ? {}
                : { delivery: production.delivery }),
              ...(production.sound === undefined
                ? {}
                : { sound: production.sound }),
              ...(production.speak === undefined
                ? {}
                : {
                    speak: (mouths: IAutoMovieDialogueMouths): void =>
                      production.speak!(mouths),
                  }),
              ...(production.playback === undefined
                ? {}
                : {
                    cut: production.playback.timeline,
                    sequence: production.playback.sequence,
                  }),
              height: film.height ?? 720,
              markKinds: [
                ...(production.markKinds ?? []),
                ...(production.performance === undefined
                  ? []
                  : ["joint", "bone", "contact"]),
                ...(production.performance?.maximumArrowLength === undefined
                  ? []
                  : ["contact/clamped"]),
                ...(production.performance?.supports === undefined
                  ? []
                  : ["support/allocated", "support/shortfall"]),
              ],
              ...(production.views === undefined
                ? {}
                : { views: production.views }),
              ...(production.optics === undefined
                ? {}
                : {
                    optics: (seconds: number): IAutoMovieFilmOptics =>
                      production.optics!(
                        clampProductionSeconds(seconds, film.durationSeconds),
                      ),
                  }),
              ...(production.shading === undefined
                ? {}
                : {
                    shading: (seconds: number): IAutoMovieFilmShading =>
                      production.shading!(
                        clampProductionSeconds(seconds, film.durationSeconds),
                      ),
                  }),
              ...(production.beforeDraw === undefined
                ? {}
                : {
                    beforeDraw: (
                      renderer: THREE.WebGLRenderer,
                      seconds: number,
                    ): void =>
                      production.beforeDraw!(
                        renderer,
                        clampProductionSeconds(seconds, film.durationSeconds),
                      ),
                  }),
              inspectPlaced: (
                sample: IAutoMovieDrawScene.IPlacedSample,
              ): IAutoMovieInspectionDiagnostics =>
                inspectFilmProduction({
                  name,
                  production,
                  geometry,
                  fps: film.fps,
                  sample,
                }),
              marks: (seconds: number): IAutoMovieMark[] =>
                markFilmProduction(production, seconds),
              seek: async (seconds: number): Promise<void> =>
                production.seek(
                  clampProductionSeconds(seconds, film.durationSeconds),
                ),
              place: (seconds: number): void =>
                production.seek(
                  clampProductionSeconds(seconds, film.durationSeconds),
                ),
              ...(production.seekShot === undefined
                ? {}
                : {
                    seekShot: async (
                      shot: string,
                      time: number,
                      seconds: number,
                    ): Promise<void> =>
                      production.seekShot!(
                        shot,
                        time,
                        clampProductionSeconds(seconds, film.durationSeconds),
                      ),
                  }),
              dispose: (): void => production.dispose(),
            };
            const softPropsAt: IFilmProduction["softPropsAt"] =
              production.softPropsAt?.bind(production);
            return softPropsAt === undefined
              ? subject
              : bindAutoMovieDrawSceneSoftProps(
                  subject,
                  (seconds: number): readonly IAutoMovieRenderSoftPropFrame[] =>
                    softPropsAt(
                      clampProductionSeconds(seconds, film.durationSeconds),
                    ),
                );
          },
        },
      ],
    ),
  );
