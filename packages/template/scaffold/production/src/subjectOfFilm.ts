import {
  AutoMovieEngineFilm,
  AutoMovieEnginePhysicalGeometry,
} from "@automovie/engine";
import type {
  IAutoMovieDialogueMouths,
  IAutoMovieFilmOptics,
  IAutoMovieFilmShading,
  IAutoMovieInspectionDiagnostics,
  IAutoMovieMark,
  IAutoMoviePlaybackEvent,
  IAutoMovieRenderSoftPropFrame,
} from "@automovie/interface";
import {
  AutoMovieRenderDraw,
  type IAutoMovieRenderDrawScene,
  type IAutoMovieRenderDrawSubject,
} from "@automovie/render";
import type * as THREE from "three";

import type { IFilm } from "./IFilm";
import type { IFilmProduction } from "./IFilmProduction";
import { clampProductionSeconds } from "./clampProductionSeconds";
import { inspectFilmProduction } from "./inspectFilmProduction";
import { markFilmProduction } from "./markFilmProduction";
import { readFilmVerdicts } from "./readFilmVerdicts";

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
 * the film's `seekShot`. It forwards declared shot-local discontinuities to
 * the shared motion trail sampler. The shot and its shot-local time pass through
 * unclamped, a sample's handle before the trim included, and the film second is
 * clamped. When the playback includes the shots used to approve the cut, the
 * Engine places their interaction cues on the output clock once per mount.
 * Playback without those shots leaves cues absent. A refused projection
 * disposes the mounted film before returning the failure. A film with `speak`
 * takes the dialogue mouths the capture and the render hand the subject, and
 * reads them in its own placements.
 *
 * @param name The film's registered name, which the subject is drawn under.
 * @param film The registered film.
 * @returns The film's draw subject.
 * @evidence contracts/development/common.md#meaningful-documentation Describes the shared draw adapter, raster defaults, placement clocks, reader timing, the authored shots required for played cues, and the declared breaks a trail receives.
 * @evidence contracts/development/implementation.md#principled-implementation Clamps the film clock and forwards the original shot clock. The soft-prop adapter reads after each placement. Draw receives the same shot-local breaks the production supplied. Draw metadata uses `sequenceEventTimeline` with the film's cut and its authored shots and leaves cues absent when those shots are unavailable. A refused projection disposes the film and preserves any disposal failure alongside the original error.
 * @evidence contracts/development/implementation.md#efficient-algorithms Each mount builds the film once and projects supplied cues through the Engine once, copying the read-only shot list for the SDK call. The verdict reader reads the whole performance only on demand. Disposal releases the film and any soft prop resources owned by the draw adapter.
 */
export function subjectOfFilm(
  name: string,
  film: IFilm,
): IAutoMovieRenderDrawSubject {
  return {
    create: async (): Promise<IAutoMovieRenderDrawScene> => {
      const geometry: Awaited<
        ReturnType<typeof AutoMovieEnginePhysicalGeometry.prepare>
      > = await AutoMovieEnginePhysicalGeometry.prepare();
      const production: IFilmProduction = await film.create();
      const playback: IFilmProduction["playback"] = production.playback;
      let playedCues: IAutoMoviePlaybackEvent[] | undefined;
      if (playback?.shots !== undefined) {
        try {
          playedCues = AutoMovieEngineFilm.sequenceEventTimeline(
            playback.sequence,
            [...playback.shots],
          );
        } catch (error) {
          try {
            production.dispose();
          } catch (disposeError) {
            throw new AggregateError(
              [error, disposeError],
              "Played cue projection and film disposal both failed",
            );
          }
          throw error;
        }
      }
      // One reader per mount: a capture or delivery run reads the whole
      // performance once, and the viewer never asks.
      const verdicts: ReturnType<typeof readFilmVerdicts> =
        readFilmVerdicts(production);
      const clamp: (seconds: number) => number = (seconds: number): number =>
        clampProductionSeconds(seconds, film.durationSeconds);
      const subject: IAutoMovieRenderDrawScene = {
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
        ...(playback === undefined
          ? {}
          : {
              cut: playback.timeline,
              sequence: playback.sequence,
              ...(playback.discontinuities === undefined
                ? {}
                : { trailDiscontinuities: playback.discontinuities }),
            }),
        ...(playedCues === undefined ? {} : { playedCues }),
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
          sample: IAutoMovieRenderDrawScene.IPlacedSample,
        ): IAutoMovieInspectionDiagnostics =>
          inspectFilmProduction({
            name,
            production,
            geometry,
            fps: film.fps,
            ...(verdicts === undefined ? {} : { verdicts }),
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
        : AutoMovieRenderDraw.bindAutoMovieDrawSceneSoftProps(
            subject,
            (seconds: number): readonly IAutoMovieRenderSoftPropFrame[] =>
              softPropsAt(clamp(seconds)),
          );
    },
  };
}
