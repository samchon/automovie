import type * as THREE from "three";

import type { IFilm } from "../IFilm";
import type { IFilmProduction } from "../IFilmProduction";
import { BoutPlaybackRuntime } from "../physics/BoutPlaybackRuntime";
import { loadBoutPhysicalPlayback } from "../physics/loadBoutPhysicalPlayback";
import { FilmRuntime } from "../runtime/FilmRuntime";
import { FilmPlan } from "../shots/kickboxing/ring-bout/FilmPlan";
import { MovieAudio } from "../sound/MovieAudio";
import { createKickboxingScene } from "./createKickboxingScene";

/**
 * The three-minute kickboxing bout of `docs/body/screenplay/kickboxing.md`:
 * the ring, its lights, the fighters and referee performing the ring-bout
 * shot, and the soundtrack built from the same measured contacts.
 *
 * @evidence contracts/common.md#implementation-and-ownership The film composes the ring asset, the runtime that evaluates the ring-bout shot's modules and the soundtrack configured from that runtime's measured contacts, floor receipts and events; seek evaluates the performance and adopts the planned camera, so every consumer draws the same frame.
 * @evidence contracts/common.md#authoring-interface Call create once per mount; it resolves after contact measurement and sound decoding, reporting progress, and the returned production's dispose releases sound, runtime and ring.
 */
export function kickboxing(): IFilm {
  return {
    durationSeconds: FilmPlan.duration,
    fps: FilmPlan.fps,
    create: async (
      progress?: (message: string) => void,
    ): Promise<IFilmProduction> => {
      const stage: createKickboxingScene.IStage = createKickboxingScene();
      const scene: THREE.Scene = stage.scene;
      const camera: THREE.PerspectiveCamera = stage.camera;

      // The runtime evaluates the ring-bout shot; its contacts are measured
      // once from the displayed bodies before sound is built from them.
      const params: URLSearchParams = new URLSearchParams(location.search);
      const physical: string | null = params.get("physics");
      if (physical !== null && !/^[a-z][a-z0-9-]*$/.test(physical))
        throw new Error("Invalid physical archive name");
      const loaded:
        | Awaited<ReturnType<typeof loadBoutPhysicalPlayback>>
        | undefined = physical
        ? await loadBoutPhysicalPlayback(
            `/.physical/${physical}.amphys`,
            (await import("virtual:bout-physical-source")).default,
          )
        : undefined;
      const runtime: FilmRuntime | BoutPlaybackRuntime = loaded
        ? new BoutPlaybackRuntime(
            loaded.playback,
            loaded.startSeconds,
            undefined,
            loaded.mode,
            loaded.formulaResponses,
          )
        : new FilmRuntime();
      scene.add(runtime.effects.object);
      if (runtime instanceof BoutPlaybackRuntime) {
        runtime.effects.camera = camera;
        scene.add(runtime.overlay.object);
      }
      for (const actor of Object.values(runtime.actors))
        scene.add(actor.person.object);
      const prepared: (id: string, completed: number, total: number) => void = (
        id: string,
        completed: number,
        total: number,
      ): void => progress?.(`Inspecting outcomes ${completed}/${total}: ${id}`);
      if (runtime instanceof BoutPlaybackRuntime)
        await runtime.prepare(prepared, params.get("review") === "1");
      else await runtime.prepare(prepared);
      progress?.("Decoding the soundtrack");
      const audio: MovieAudio = new MovieAudio();
      audio.configure(
        runtime.audioEvents(),
        runtime.contacts(),
        runtime.floorContacts(),
      );
      await audio.prepare();

      const available: readonly [number, number] = loaded
        ? [loaded.startSeconds, loaded.startSeconds + loaded.playback.duration]
        : [0, FilmPlan.duration];
      stage.placeCamera(available[0]);
      return {
        available,
        scene,
        camera,
        audio,
        runtime,
        seek: (seconds: number): void => {
          stage.placeCamera(seconds);
          runtime.evaluate(seconds);
        },
        cameraTarget: (seconds: number): THREE.Vector3 => stage.target(seconds),
        dispose: (): void => {
          const errors: unknown[] = [];
          for (const release of [
            (): void => audio.dispose(),
            (): void => runtime.dispose(),
            (): void => stage.dispose(),
          ])
            try {
              release();
            } catch (error: unknown) {
              errors.push(error);
            }
          if (errors.length)
            throw new AggregateError(errors, "Film release failed");
        },
      };
    },
  };
}
