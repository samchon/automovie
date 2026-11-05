import * as THREE from "three";

import type { IFilm } from "../IFilm";
import type { IFilmProduction } from "../IFilmProduction";
import { createInspectionRing } from "../assets/ring/createInspectionRing";
import { FilmRuntime } from "../runtime/FilmRuntime";
import { FilmPlan } from "../shots/kickboxing/ring-bout/FilmPlan";
import { MovieAudio } from "../sound/MovieAudio";

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
      const scene: THREE.Scene = new THREE.Scene();
      scene.background = new THREE.Color(0x10151e);
      scene.add(new THREE.HemisphereLight(0xe2efff, 0x635c53, 2.1));
      const light: THREE.DirectionalLight = new THREE.DirectionalLight(
        0xfff2dc,
        3,
      );
      light.position.set(2, 7, 4);
      light.castShadow = true;
      light.shadow.mapSize.set(1024, 1024);
      Object.assign(light.shadow.camera, {
        left: -4,
        right: 4,
        top: 4,
        bottom: -4,
        near: 0.1,
        far: 15,
      });
      scene.add(light);
      const ring: createInspectionRing.Result = createInspectionRing();
      scene.add(ring.object);
      const camera: THREE.PerspectiveCamera = new THREE.PerspectiveCamera(
        43,
        1,
        0.02,
        80,
      );

      // The runtime evaluates the ring-bout shot; its contacts are measured
      // once from the displayed bodies before sound is built from them.
      const runtime: FilmRuntime = new FilmRuntime();
      scene.add(runtime.effects.object);
      for (const actor of Object.values(runtime.actors))
        scene.add(actor.person.object);
      await runtime.prepare(
        (id: string, completed: number, total: number): void =>
          progress?.(`Measuring contacts ${completed}/${total}: ${id}`),
      );
      progress?.("Decoding the soundtrack");
      const audio: MovieAudio = new MovieAudio();
      audio.configure(
        runtime.audioEvents(),
        runtime.contacts(),
        runtime.floorContacts(),
      );
      await audio.prepare();

      const view: (seconds: number) => void = (seconds: number): void => {
        const planned: FilmPlan.Camera = FilmPlan.camera(seconds);
        camera.position.set(...planned.position);
        camera.fov = planned.fovDegrees;
        camera.lookAt(new THREE.Vector3(...planned.target));
        camera.updateProjectionMatrix();
      };
      view(0);
      return {
        scene,
        camera,
        audio,
        runtime,
        seek: (seconds: number): void => {
          runtime.evaluate(seconds);
          view(seconds);
        },
        cameraTarget: (seconds: number): THREE.Vector3 =>
          new THREE.Vector3(...FilmPlan.camera(seconds).target),
        dispose: (): void => {
          const errors: unknown[] = [];
          for (const release of [
            (): void => audio.dispose(),
            (): void => runtime.dispose(),
            (): void => ring.dispose(),
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
