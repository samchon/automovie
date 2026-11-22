import {
  preparePhysicalGeometry,
  validateClipArtifact,
} from "@automovie/engine";
import type {
  IAutoMovieConstraintViolation,
  IAutoMovieInspectionDiagnostics,
} from "@automovie/interface";
import {
  type IAutoMovieDrawScene,
  observeAutoMoviePlacedInspection,
  reduceAutoMovieInspectionEpisodes,
  selectAutoMoviePlacedChecks,
} from "@automovie/render";
import { TestValidator } from "@nestia/e2e";
import * as THREE from "three";

import type { IFilmProduction } from "../../src/IFilmProduction";
import { inspectFilmProduction } from "../../src/inspectFilmProduction";

/** Output frames per second of the inspected film. */
const FPS: number = 10;

/** Output frames of the inspected film. */
const FRAMES: number = 6;

/**
 * Drive the production's own inspection path, `inspectFilmProduction` behind
 * a draw subject mounted as `src/subjects.ts` mounts one, through playback,
 * a reverse seek, capture samples and a delivery pass.
 *
 * Scenarios:
 * 1. Playback reports the planted foot's 5 cm lift on frames 3 and 4 only, with its measured gap, and the raw authored clip's malformed track on every frame.
 * 2. Seeking back to frame 3 after the last frame reports exactly the packet playback reported there.
 * 3. Capture samples fold into one support episode first seen on frame 3.
 * 4. A delivery pass over every frame observes the whole schedule and holds a blocking finding.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Lists the four numbered scenarios and the outcome each pins.
 * @evidence contracts/development/testing.md#behavioral-verification Calls the production's inspectFilmProduction through the placed-inspection host with real Three nodes, the shipped rule supplier, Engine's clip admission, the physical geometry queries and the episode reducer the capture and delivery hosts use.
 * @evidence contracts/development/testing.md#independent-expectations The deck top sits at y = 0.05 m and the foot rises 0.05 m above it on frames 3 and 4, as the seek function states; the clip declares a translation track with one value for two keys.
 * @evidence contracts/development/testing.md#distinguishing-cases Contrasts lifted and planted frames, forward playback with a reverse seek, sparse capture with a complete delivery schedule, and a native measurement with a raw source finding.
 * @evidence contracts/development/testing.md#execution-ownership The unit owns its scene, film clock and declarations and starts no browser, renderer or encoder; the generated production's lint, test and build run it as any other unit test.
 */
export async function test_inspect_film_production(): Promise<void> {
  const scene: THREE.Scene = new THREE.Scene();
  const camera: THREE.PerspectiveCamera = new THREE.PerspectiveCamera(
    45,
    16 / 9,
    0.1,
    100,
  );
  camera.position.set(0, 1.5, 5);
  camera.lookAt(0, 0, 0);
  const deck: THREE.Group = new THREE.Group();
  deck.name = "deck";
  const top: THREE.Group = new THREE.Group();
  top.name = "top";
  top.position.y = 0.05;
  deck.add(top);
  const foot: THREE.Group = new THREE.Group();
  foot.name = "foot";
  scene.add(deck, foot);

  const track: IAutoMovieConstraintViolation[] = [];
  validateClipArtifact(
    {
      id: "lantern-motion",
      duration: 1,
      loop: "once",
      tracks: [
        {
          channel: { kind: "node", node: "lantern", path: "translation" },
          times: [0, 1],
          values: [0],
          interpolation: "linear",
        },
      ],
    },
    "film.clips[0]",
    track,
  );

  const production: IFilmProduction = {
    scene,
    camera,
    seek: (seconds: number): void => {
      deck.position.set(0.3 * seconds, 0, 0);
      const frame: number = Math.round(seconds * FPS);
      foot.position.set(
        deck.position.x + 0.2,
        0.05 + (frame === 3 || frame === 4 ? 0.05 : 0),
        0,
      );
      scene.updateMatrixWorld(true);
    },
    inspectionChecks: (
      sample: IAutoMovieDrawScene.IPlacedSample,
    ): ReturnType<NonNullable<IFilmProduction["inspectionChecks"]>> => [
      ...selectAutoMoviePlacedChecks({
        scene: sample.scene,
        time: sample.time,
        fps: FPS,
        supports: [
          {
            key: "foot",
            required: true,
            path: "film.supports[0]",
            paths: ["foot"],
            maxGap: 0.01,
            maxSlip: 0.02,
            phases: [
              {
                from: 0,
                to: FRAMES / FPS,
                socket: foot,
                support: top,
                anchor: { x: 0.2, y: 0, z: 0 },
              },
            ],
          },
        ],
      }),
      {
        key: "lantern-clip",
        required: true,
        input: { kind: "track", path: "film.clips[0]", violations: track },
      },
    ],
    dispose: (): void => {
      scene.clear();
    },
  };
  const geometry: Awaited<ReturnType<typeof preparePhysicalGeometry>> =
    await preparePhysicalGeometry();
  // Mounted as src/subjects.ts mounts a registered film.
  const subject: IAutoMovieDrawScene = {
    scene,
    camera,
    durationSeconds: FRAMES / FPS,
    fps: FPS,
    width: 1280,
    height: 720,
    markKinds: [],
    inspectPlaced: (
      sample: IAutoMovieDrawScene.IPlacedSample,
    ): IAutoMovieInspectionDiagnostics =>
      inspectFilmProduction({ name: "proof", production, geometry, sample }),
    seek: async (seconds: number): Promise<void> => production.seek(seconds),
    dispose: (): void => production.dispose(),
  };
  const observe = async (
    frame: number,
    mode: IAutoMovieDrawScene.IPlacedSample["mode"],
  ): Promise<IAutoMovieInspectionDiagnostics> => {
    await subject.seek(frame / FPS);
    return observeAutoMoviePlacedInspection(subject, frame / FPS, mode)!;
  };
  const gapOf = (
    packet: IAutoMovieInspectionDiagnostics,
  ): number | string | undefined =>
    packet.findings
      .find(
        (finding: IAutoMovieInspectionDiagnostics.IFinding): boolean =>
          finding.check === "support",
      )
      ?.witness.measurements?.find(
        (measure: IAutoMovieInspectionDiagnostics.IMeasurement): boolean =>
          measure.name === "gap",
      )?.value;
  const hasTrack = (packet: IAutoMovieInspectionDiagnostics): boolean =>
    packet.findings.some(
      (finding: IAutoMovieInspectionDiagnostics.IFinding): boolean =>
        finding.check === "authored-track" &&
        finding.paths.some((path: string): boolean =>
          path.startsWith("film.clips[0].tracks[0]"),
        ),
    );

  try {
    const playback: IAutoMovieInspectionDiagnostics[] = [];
    for (let frame: number = 0; frame < FRAMES; ++frame)
      playback.push(await observe(frame, "viewer"));
    TestValidator.equals(
      "playback reports the lift on its frames",
      playback
        .map(gapOf)
        .map((gap: number | string | undefined) =>
          typeof gap === "number" ? Math.round(gap * 1000) / 1000 : gap,
        ),
      [undefined, undefined, undefined, 0.05, 0.05, undefined],
    );
    TestValidator.predicate(
      "playback reports the raw track on every frame",
      playback.every(hasTrack),
    );
    TestValidator.equals(
      "a reverse seek reports the playback packet",
      await observe(3, "viewer"),
      playback[3],
    );

    const capture: IAutoMovieInspectionDiagnostics.IAudit =
      reduceAutoMovieInspectionEpisodes([
        await observe(2, "capture"),
        await observe(3, "capture"),
        await observe(4, "capture"),
      ]);
    const support: IAutoMovieInspectionDiagnostics.IEpisode | undefined =
      capture.episodes.find(
        (episode: IAutoMovieInspectionDiagnostics.IEpisode): boolean =>
          episode.first.finding.check === "support",
      );
    TestValidator.predicate(
      "capture folds the lift into one episode from frame 3",
      support?.first.time.outputFrame === 3 && support.samples === 2,
    );

    const delivery: IAutoMovieInspectionDiagnostics[] = [];
    for (let frame: number = 0; frame < FRAMES; ++frame)
      delivery.push(await observe(frame, "delivery"));
    const audit: IAutoMovieInspectionDiagnostics.IAudit =
      reduceAutoMovieInspectionEpisodes(delivery, FRAMES);
    TestValidator.predicate(
      "a delivery pass observes every frame and is blocked",
      audit.observedOutputFrames === FRAMES && audit.hasBlockingFinding,
    );
  } finally {
    subject.dispose();
  }
}
