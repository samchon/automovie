import { AutoMovieEngineFilm } from "@automovie/engine";
import type {
  IAutoMovieEditPlan,
  IAutoMovieFilmOptics,
  IAutoMovieInspectionDiagnostics,
  IAutoMoviePlaybackEntry,
  IAutoMovieShot,
} from "@automovie/interface";
import type { IAutoMovieRenderDrawScene } from "@automovie/render";
import * as THREE from "three";

import type { IFilm } from "../../IFilm";
import type { IFilmProduction } from "../../IFilmProduction";

/**
 * A cart approaches a stop, holds for the second camera, then repeats from a
 * trim at twice speed.
 */
const EDIT: IAutoMovieEditPlan = {
  sequence: { id: "installed-parity", name: "Cart at the stop" },
  fps: 8,
  entries: [
    { shot: "slide", trim: { start: 0, duration: 1 }, transition: null },
    {
      shot: "hold",
      trim: { start: 0, duration: 0.75 },
      transition: { kind: "crossDissolve", duration: 0.5 },
    },
    {
      shot: "slide",
      trim: { start: 0.5, duration: 0.5 },
      playbackRate: 2,
      transition: null,
    },
  ],
  pacing: "Hold the second camera through the stop, then replay the approach.",
  continuity: "Dissolve into the hold and cut back to the source trim.",
};

/**
 * An installed test film with a repeated source shot, a dissolve and a retimed
 * hard cut. Its small delivery raster makes every presented frame inexpensive.
 *
 * @evidence contracts/development/implementation.md#principled-implementation Uses the admitted cut and its normal playback clock; places a cart along a bench with a hold and a source-time colour cue that straddles the delivery shutter. The scene's visible pose, camera and background depend on the actual requested placement. The fixture writes no result files and supplies no encoded frames.
 * @evidence contracts/development/implementation.md#efficient-algorithms One scene is shared by the film's two authored camera views; inspection describes the already placed cart and camera. Prepares at most three timeline entries and moves one cart per sample; the delivered raster is 160 by 96. Reuses both meshes, the camera and the admitted timeline throughout one mount. Each host mounts a fresh scene. The mount owns its geometry and materials and disposes them at unmount.
 */
export function installedParityFilm(): IFilm {
  const shots: IAutoMovieShot[] = [shot("slide"), shot("hold")];
  const cut: ReturnType<typeof AutoMovieEngineFilm.cutSequence> = AutoMovieEngineFilm.cutSequence(EDIT, shots);
  if (!cut.success) throw new Error(JSON.stringify(cut.violations));
  const timeline: ReturnType<typeof AutoMovieEngineFilm.sequenceTimeline> = AutoMovieEngineFilm.sequenceTimeline(
    cut.sequence,
    shots,
  );
  return {
    durationSeconds: timeline.runtime,
    fps: cut.sequence.fps,
    width: 160,
    height: 96,
    create: async (): Promise<IFilmProduction> => {
      const scene: THREE.Scene = new THREE.Scene();
      const background: THREE.Color = new THREE.Color();
      scene.background = background;
      const camera: THREE.PerspectiveCamera = new THREE.PerspectiveCamera(
        40,
        160 / 96,
        0.1,
        12,
      );
      const cart: THREE.Mesh<THREE.BoxGeometry, THREE.MeshBasicMaterial> =
        new THREE.Mesh(
          new THREE.BoxGeometry(0.32, 0.42, 0.3),
          new THREE.MeshBasicMaterial({ color: 0xffffff }),
        );
      cart.name = "cart";
      const bench: THREE.Mesh<THREE.BoxGeometry, THREE.MeshBasicMaterial> =
        new THREE.Mesh(
          new THREE.BoxGeometry(2.6, 0.12, 0.48),
          new THREE.MeshBasicMaterial({ color: 0x808080 }),
        );
      bench.name = "bench";
      bench.position.y = -0.27;
      scene.add(cart, bench);
      let placed: { shot: string; local: number; entry?: number } = {
        shot: "slide",
        local: 0,
        entry: 0,
      };

      /** Place the selected camera, cart and background cue on the shot clock. */
      const place = (shot: string, local: number, entry?: number): void => {
        placed = { shot, local, ...(entry === undefined ? {} : { entry }) };
        const holds: boolean = shot === "hold";
        cart.position.x = holds ? 0.28 : -0.8 + Math.min(local, 0.9) * 1.2;
        camera.position.set(holds ? 0.82 : 0, 0.18, 3);
        camera.lookAt(camera.position.x, 0.06, 0);
        // A cart reaching its mark at source 11/16 turns the room cue green.
        background.setHex(
          holds ? 0x1212e8 : local < 11 / 16 ? 0xe81212 : 0x12e812,
        );
        scene.updateMatrixWorld(true);
        camera.updateMatrixWorld(true);
      };
      return {
        scene,
        camera,
        playback: { sequence: cut.sequence, timeline },
        seek: (seconds: number): void => {
          const entry: IAutoMoviePlaybackEntry = AutoMovieEngineFilm.playbackEntryAt(
            timeline.entries,
            seconds,
          );
          place(entry.shot, AutoMovieEngineFilm.playbackEntryTime(entry, seconds), entry.entry);
        },
        seekShot: (name: string, local: number, seconds: number): void => {
          const layers: ReturnType<typeof AutoMovieEngineFilm.playbackLayersAt> = AutoMovieEngineFilm.playbackLayersAt(
            cut.sequence,
            timeline,
            seconds,
          );
          place(
            name,
            local,
            layers.find((layer): boolean => layer.shot === name)?.entry,
          );
        },
        optics: (): IAutoMovieFilmOptics => ({
          ev100: Math.log2(1 / 1.2),
          toneMapping: "none",
          samples: 2,
          shutter: { angle: 180 },
        }),
        inspectPlaced: (
          sample: IAutoMovieRenderDrawScene.IPlacedSample,
        ): IAutoMovieInspectionDiagnostics => {
          const { shot, local, entry } = placed;
          const path: string = [shot, entry ?? "handle"].join("/");
          // Distinct sample identities retain each witness after episode reduction.
          const key: string = `cart/${sample.time.outputFrame ?? sample.time.filmSeconds}`;
          const message: string = `Cart placement ${path} source=${local} eye=${sample.camera.position.x} cart=${cart.position.x}`;
          return {
            scope: path,
            time: { ...sample.time, shot: { path, seconds: local } },
            findings: [
              {
                check: "installed-parity",
                key,
                code: "cart-placement",
                paths: ["cart"],
                category: "warning",
                confidence: "confirmed",
                message,
                witness: {},
              },
            ],
            coverage: [
              {
                check: "installed-parity",
                key,
                status: "checked",
                required: false,
              },
            ],
          };
        },
        dispose: (): void => {
          cart.geometry.dispose();
          cart.material.dispose();
          bench.geometry.dispose();
          bench.material.dispose();
          scene.clear();
        },
      };
    },
  };
}

/** An authored shot at its original length before any edit trims it. */
function shot(id: string): IAutoMovieShot {
  return {
    id,
    name: null,
    scene: "cart-stop",
    camera: id,
    cameraMotion: null,
    performances: [],
    objectMotions: [],
    duration: 1,
  };
}
