import {
  preparePhysicalGeometry,
  validateClipArtifact,
} from "@automovie/engine";
import type {
  IAutoMovieConstraintViolation,
  IAutoMovieInspectionDiagnostics,
  IAutoMovieMotionHumanPerformance,
  IAutoMovieMotionHumanVerdicts,
} from "@automovie/interface";
import { HumanVerdicts } from "@automovie/motions";
import { type IAutoMovieDrawScene, observeAutoMoviePlacedInspection, selectAutoMoviePlacedChecks, AutoMovieRenderInspectionMarks } from "@automovie/render";
import { TestValidator } from "@nestia/e2e";
import * as THREE from "three";

import type { IFilmProduction } from "../../src/IFilmProduction";
import { inspectFilmProduction } from "../../src/inspectFilmProduction";
import { readFilmVerdicts } from "../../src/readFilmVerdicts";
import { overlappingPerformance } from "../helpers/overlappingPerformance";

/** Output frames per second of the inspected film. */
const FPS: number = 10;

/** Output frames of the inspected film. */
const FRAMES: number = 6;

/**
 * Drive the production's own inspection path, `inspectFilmProduction` behind a
 * draw subject mounted as `src/subjects.ts` mounts one, through playback, a
 * reverse seek, capture samples and a delivery pass.
 *
 * Scenarios:
 *
 * 1. Playback reports the planted foot's 5 cm lift on frames 3 and 4 only, with
 *    its measured gap, and the raw authored clip's malformed track on every
 *    frame.
 * 2. Seeking back to frame 3 after the last frame reports exactly the packet
 *    playback reported there.
 * 3. Capture samples produce a support episode first seen on frame 3.
 * 4. A delivery pass over every frame observes the whole schedule and holds a
 *    blocking finding.
 * 5. The film's human performance, two men standing on one point, is asked for
 *    once however many capture and delivery samples read it and never by
 *    playback; each capture packet holds its `partner` verdict at the
 *    violation's own second with each observation at the packet's sample time,
 *    and playback packets hold no verdict finding or coverage.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Lists five scenarios and the outcome each pins.
 * @evidence contracts/development/testing.md#behavioral-verification The generated test runner discovers this integration check. It needs the real placed-inspection host, Three nodes, clip admission, physical queries and episode reducer to verify their shared playback, capture and delivery packets in a small in-memory scene.
 * @evidence contracts/development/testing.md#independent-expectations The fixture defines a 50 mm lift on frames 3 and 4 and a clip with one translation value for two keys. The check rounds the measured gap to millimetres. It compares repeat seeks and capture versus delivery, and checks that the inspection packet forwards the emitted HumanVerdicts time and uses the packet's sample time for an observation without its own time.
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
      name: null,
      duration: 1,
      loop: false,
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

  const performance: IAutoMovieMotionHumanPerformance = overlappingPerformance([
    "a",
    "b",
  ]);
  let asked: number = 0;
  const production: IFilmProduction = {
    scene,
    camera,
    humanPerformance: (): IAutoMovieMotionHumanVerdicts.ISource => {
      ++asked;
      return {
        performance,
        paths: { a: "film.performers[0]", b: "film.performers[1]" },
      };
    },
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
  const verdicts: ReturnType<typeof readFilmVerdicts> =
    readFilmVerdicts(production);
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
      inspectFilmProduction({
        name: "proof",
        production,
        geometry,
        verdicts,
        sample,
      }),
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
  const isVerdict = (row: { check: string }): boolean =>
    row.check.startsWith("human-");
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
    TestValidator.predicate(
      "playback asks for no performance and holds no verdict",
      asked === 0 &&
        playback.every(
          (packet: IAutoMovieInspectionDiagnostics): boolean =>
            !packet.findings.some(isVerdict) &&
            !packet.coverage.some(isVerdict),
        ),
    );

    const sampled: IAutoMovieInspectionDiagnostics[] = [
      await observe(2, "capture"),
      await observe(3, "capture"),
      await observe(4, "capture"),
    ];
    const capture: IAutoMovieInspectionDiagnostics.IAudit =
      AutoMovieRenderInspectionMarks.reduceEpisodes(sampled);
    const support: IAutoMovieInspectionDiagnostics.IEpisode | undefined =
      capture.episodes.find(
        (episode: IAutoMovieInspectionDiagnostics.IEpisode): boolean =>
          episode.first.finding.check === "support",
      );
    TestValidator.predicate(
      "capture folds the lift into one episode from frame 3",
      support?.first.time.outputFrame === 3 && support.samples === 2,
    );

    const violation: IAutoMovieMotionHumanVerdicts.IFinding | undefined =
      HumanVerdicts(performance).findings.find(
        (finding: IAutoMovieMotionHumanVerdicts.IFinding): boolean =>
          finding.check === "partner",
      );
    TestValidator.predicate(
      "the planted violation is a partner finding",
      violation !== undefined,
    );
    for (const packet of sampled) {
      const found: IAutoMovieInspectionDiagnostics.IFinding | undefined =
        packet.findings.find(
          (finding: IAutoMovieInspectionDiagnostics.IFinding): boolean =>
            finding.check === "human-partner",
        );
      TestValidator.equals(
        "each capture packet reports the violation at its second",
        found?.witness.measurements?.find(
          (measure: IAutoMovieInspectionDiagnostics.IMeasurement): boolean =>
            measure.name === "seconds",
        )?.value,
        violation?.seconds,
      );
      TestValidator.predicate(
        "the observation takes the packet's sample time",
        found?.witness.time === undefined &&
          packet.coverage.some(
            (row: IAutoMovieInspectionDiagnostics.ICoverage): boolean =>
              row.check === "human-partner" &&
              row.key === "a+b" &&
              row.status === "checked",
          ),
      );
    }
    const partner: IAutoMovieInspectionDiagnostics.IEpisode | undefined =
      capture.episodes.find(
        (episode: IAutoMovieInspectionDiagnostics.IEpisode): boolean =>
          episode.first.finding.check === "human-partner",
      );
    TestValidator.predicate(
      "capture folds the verdict into one episode from frame 2",
      partner?.first.time.outputFrame === 2 && partner.samples === 3,
    );

    const delivery: IAutoMovieInspectionDiagnostics[] = [];
    for (let frame: number = 0; frame < FRAMES; ++frame)
      delivery.push(await observe(frame, "delivery"));
    const audit: IAutoMovieInspectionDiagnostics.IAudit =
      AutoMovieRenderInspectionMarks.reduceEpisodes(delivery, FRAMES);
    TestValidator.predicate(
      "a delivery pass observes every frame and is blocked",
      audit.observedOutputFrames === FRAMES && audit.hasBlockingFinding,
    );
    TestValidator.equals(
      "the performance is asked for once across capture and delivery",
      asked,
      1,
    );
  } finally {
    subject.dispose();
  }
}
