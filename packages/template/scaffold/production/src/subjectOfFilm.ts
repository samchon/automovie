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
  type IAutoMovieDrawScene,
  type IAutoMovieDrawSubject,
  bindAutoMovieDrawSceneSoftProps,
} from "@automovie/render";
import type * as THREE from "three";

import type { IFilm } from "./IFilm";
import type { IFilmProduction } from "./IFilmProduction";
import { clampProductionSeconds } from "./clampProductionSeconds";
import { inspectFilmProduction } from "./inspectFilmProduction";
import { markFilmProduction } from "./markFilmProduction";

/**
 * One registered film as a draw subject: what the capture, the render and the
 * Viewer create, draw and place.
 *
 * The film is created as the Viewer creates it, at its delivery raster (1280 ×
 * 720 when it states none), placed by its own `seek` at a second clamped to its
 * running time, and marked by `markFilmProduction`. Its `optics`, `shading`,
 * `beforeDraw`, soft props and marks are read for the film as last placed, at
 * the same clamped second, so a capture, a delivered frame and the Viewer show
 * the same state through the same camera response. A film with `playback` hands
 * its timeline over as the subject's `cut`, which the render records in its
 * report, and its sequence, whose transitions every film picture draws through
 * the film's `seekShot`: the shot and its shot-local time pass through
 * unclamped, a sample's handle before the trim included, and the film second is
 * clamped. A film with `speak` takes the dialogue mouths the capture and the
 * render hand the subject, and reads them in its own placements.
 *
 * @param name The film's registered name, which the subject is drawn under.
 * @param film The registered film.
 * @returns The film's draw subject.
 * @evidence contracts/development/common.md#meaningful-documentation States what the subject is, who draws it, how its raster, placements and readers are taken and what passes through `seekShot` unclamped.
 * @evidence contracts/development/implementation.md#principled-implementation Maps the film's placement, readers and shared marks onto the draw contract, clamping only the film second, and binds optional soft surfaces after every placement, a shot placement included.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One mapping of one film; `subjects` maps the registry through it.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No film is named; a member the film lacks is left absent rather than stubbed.
 * @evidence contracts/development/implementation.md#efficient-algorithms Constant work per mapped member; the film is created only when its subject is.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A mapping made once per film and page.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The subject's dispose releases the film, and the render adapter independently releases any soft prop meshes it mounts.
 */
export function subjectOfFilm(
  name: string,
  film: IFilm,
): IAutoMovieDrawSubject {
  return {
    create: async (): Promise<IAutoMovieDrawScene> => {
      const geometry: Awaited<ReturnType<typeof preparePhysicalGeometry>> =
        await preparePhysicalGeometry();
      const production: IFilmProduction = await film.create();
      const clamp: (seconds: number) => number = (seconds: number): number =>
        clampProductionSeconds(seconds, film.durationSeconds);
      const subject: IAutoMovieDrawScene = {
        scene: production.scene,
        camera: production.camera,
        durationSeconds: film.durationSeconds,
        fps: film.fps,
        width: film.width ?? 1280,
        ...(production.delivery === undefined
          ? {}
          : { delivery: production.delivery }),
        ...(production.sound === undefined ? {} : { sound: production.sound }),
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
        ...(production.views === undefined ? {} : { views: production.views }),
        ...(production.optics === undefined
          ? {}
          : {
              optics: (seconds: number): IAutoMovieFilmOptics =>
                production.optics!(clamp(seconds)),
            }),
        ...(production.shading === undefined
          ? {}
          : {
              shading: (seconds: number): IAutoMovieFilmShading =>
                production.shading!(clamp(seconds)),
            }),
        ...(production.beforeDraw === undefined
          ? {}
          : {
              beforeDraw: (
                renderer: THREE.WebGLRenderer,
                seconds: number,
              ): void => production.beforeDraw!(renderer, clamp(seconds)),
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
          production.seek(clamp(seconds)),
        place: (seconds: number): void => production.seek(clamp(seconds)),
        ...(production.seekShot === undefined
          ? {}
          : {
              seekShot: async (
                shot: string,
                time: number,
                seconds: number,
              ): Promise<void> =>
                production.seekShot!(shot, time, clamp(seconds)),
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
              softPropsAt(clamp(seconds)),
          );
    },
  };
}
