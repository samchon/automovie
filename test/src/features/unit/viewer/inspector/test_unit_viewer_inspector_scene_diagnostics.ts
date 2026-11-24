import type {
  IAutoMovieCapturePlanRequest,
  IAutoMovieInspectionDiagnostics,
  IAutoMovieInspectionLegendEntry,
} from "@automovie/interface";
import type { IAutoMovieDrawScene } from "@automovie/render";
import {
  AutoMovieInspectorPlayhead,
  type IAutoMovieInspectorScene,
  type IAutoMovieInspectorSceneHost,
  mountAutoMovieInspectorScene,
  readAutoMovieInspectorAddress,
} from "@automovie/viewer";
import { TestValidator } from "@nestia/e2e";
import * as THREE from "three";

import { filmResponseRendererFields } from "../../../internal/filmResponseRendererFields";
import { nclose } from "../../../internal/nclose";

/**
 * An opted-in Inspector reads the actual asynchronous placement before its
 * review selection changes the scene.
 *
 * Scenarios:
 *
 * 1. The initial seek admits the subject. The framed draw's later pending seek
 *    emits no observation until it resolves.
 * 2. With an object hidden by the review request and a named review camera, the
 *    provider sees the original visibility, the settled world transform and the
 *    delivery camera at the delivery raster.
 * 3. One painted sample at frame three reports one confirmed error. Its red
 *    strokes are present only during the render, then leave the scene.
 * 4. Exact neighbors report the worst measured witness once when the episode
 *    closes. A backward replay paints the same cube without duplicate console
 *    evidence.
 * 5. Skipped frames and deferred coverage split episodes. After clearance, a new
 *    failure reports each of two pairs that share one actor.
 * 6. An off-grid playing streak reports its first visit once, and closes as one
 *    `playback` span of two painted samples when a seek interrupts it.
 *    Replaying its first visit is silent.
 * 7. Hidden witnesses draw no red stroke while the sample is still reported;
 *    showing them again redraws the cube. A pending seek completed after
 *    disposal produces no observation or draw.
 */
export async function test_unit_viewer_inspector_scene_diagnostics(): Promise<void> {
  const scene: THREE.Scene = new THREE.Scene();
  const camera: THREE.PerspectiveCamera = new THREE.PerspectiveCamera(
    50,
    1,
    0.1,
    50,
  );
  const hero: THREE.Mesh = new THREE.Mesh(
    new THREE.BoxGeometry(),
    new THREE.MeshBasicMaterial(),
  );
  const prop: THREE.Mesh = new THREE.Mesh(hero.geometry, hero.material);
  hero.name = "hero";
  prop.name = "prop";
  scene.add(hero, prop);
  let seeks: number = 0;
  let completeSeek: ((value: undefined) => void) | undefined;
  const samples: IAutoMovieDrawScene.IPlacedSample[] = [];
  const propMasks: number[] = [];
  const positions: number[] = [];
  const subject: IAutoMovieDrawScene = {
    scene,
    camera,
    durationSeconds: 1,
    fps: 24,
    width: 640,
    height: 360,
    views: {
      side: () => ({ position: [2, 1, 4], target: [0, 1, 0] }),
    },
    seek: async (seconds: number): Promise<void> => {
      if (++seeks > 1)
        await new Promise<undefined>(
          (resolve: (value: undefined) => void): void => {
            completeSeek = resolve;
          },
        );
      hero.position.x = seeks > 1 ? seconds + 1 : 0;
    },
    inspectPlaced: (
      sample: IAutoMovieDrawScene.IPlacedSample,
    ): IAutoMovieInspectionDiagnostics => {
      samples.push(sample);
      propMasks.push(prop.layers.mask);
      positions.push(hero.matrixWorld.elements[12]!);
      const frameIndex: number | undefined = sample.time.outputFrame;
      const blocking: string[] = [5, 10, 13].includes(frameIndex ?? -1)
        ? []
        : frameIndex === 11
          ? ["prop", "stand"]
          : ["prop"];
      return {
        scope: "shot/duel",
        time: sample.time,
        findings: blocking.map(
          (name: string): IAutoMovieInspectionDiagnostics.IFinding => ({
            check: "collision",
            key: `hero/${name}`,
            code: "penetration",
            paths: ["hero", name],
            category: "error",
            confidence: "confirmed",
            message: `Hero penetrates ${name}.`,
            witness: { point: { x: 1, y: 0, z: 0 }, rank: frameIndex },
          }),
        ),
        coverage: [
          {
            check: "collision",
            key: "hero/prop",
            required: true,
            ...(sample.time.outputFrame === 8
              ? { status: "deferred", reason: "Interactive inspection limit" }
              : { status: "checked" }),
          },
          {
            check: "collision",
            key: "hero/stand",
            required: true,
            status: "checked",
          },
        ],
      };
    },
    dispose: (): void => {
      hero.geometry.dispose();
      (hero.material as THREE.Material).dispose();
    },
  };
  const playhead: AutoMovieInspectorPlayhead = new AutoMovieInspectorPlayhead();
  let frame: FrameRequestCallback | undefined;
  const renders: { camera: THREE.Camera; propMask: number; red: number }[] = [];
  const failures: (string | null)[] = [];
  const reported: IAutoMovieInspectionDiagnostics[] = [];
  const first: IAutoMovieInspectionDiagnostics.IObservation[] = [];
  const episodes: IAutoMovieInspectionDiagnostics.IEpisode[] = [];
  const bases: IAutoMovieInspectorScene.EpisodeBasis[] = [];
  const legends: IAutoMovieInspectionLegendEntry[][] = [];
  const host: IAutoMovieInspectorSceneHost = {
    size: (): IAutoMovieInspectorSceneHost.ISize => ({
      width: 320,
      height: 180,
      pixelRatio: 1,
    }),
    requestFrame: (callback: FrameRequestCallback): number => {
      frame = callback;
      return 1;
    },
    cancelFrame: (): void => {
      frame = undefined;
    },
    createRenderer: (): IAutoMovieInspectorSceneHost.IRenderer => ({
      ...filmResponseRendererFields(),
      localClippingEnabled: false,
      setPixelRatio: (): void => {},
      setSize: (): void => {},
      dispose: (): void => {},
      render: (object: THREE.Object3D, view: THREE.Camera): void => {
        renders.push({
          camera: view,
          propMask: prop.layers.mask,
          red: redStrokes(object),
        });
      },
    }),
  };
  const mounted: IAutoMovieInspectorScene = mountAutoMovieInspectorScene({
    subject: { create: async (): Promise<IAutoMovieDrawScene> => subject },
    name: "duel",
    request: readAutoMovieInspectorAddress("at=0.125&views=side&hide=prop"),
    playhead,
    host,
    report: {
      ready: (): void => {},
      legend: (entries: IAutoMovieInspectionLegendEntry[]): void => {
        legends.push(entries);
      },
      labels: (): void => {},
      error: (message: string | null): void => {
        failures.push(message);
      },
      refused: (
        _request: IAutoMovieCapturePlanRequest,
        message: string,
      ): void => {
        failures.push(message);
      },
      diagnostics: (packet: IAutoMovieInspectionDiagnostics): void => {
        reported.push(packet);
      },
      diagnosticIncident: (entry: IAutoMovieInspectorScene.IIncident): void => {
        if (entry.kind === "first") first.push(entry.observation);
        else {
          episodes.push(entry.episode);
          bases.push(entry.basis);
        }
      },
    },
  });

  await settle();
  frame!(0);
  TestValidator.equals(
    "the pending seek has no diagnostic sample or render",
    [seeks, samples.length, renders.length],
    [2, 0, 0],
  );
  completeSeek!(undefined);
  await settle();
  const packet: IAutoMovieInspectionDiagnostics = reported[0]!;
  const observed: IAutoMovieDrawScene.IPlacedSample = samples[0]!;
  TestValidator.predicate(
    "observation reads the settled unmasked scene and delivery camera",
    propMasks[0] === 1 &&
      nclose(positions[0]!, 1.125) &&
      observed.camera === camera &&
      nclose(camera.aspect, 16 / 9) &&
      observed.width === 640 &&
      observed.height === 360 &&
      observed.mode === "viewer",
  );
  TestValidator.predicate(
    "one exact frame and one red stroke batch, through the review camera",
    packet.time.outputFrame === 3 &&
      nclose(packet.time.filmSeconds, 0.125) &&
      renders.length === 1 &&
      renders[0]!.camera !== camera &&
      renders[0]!.propMask === 0 &&
      renders[0]!.red === 1 &&
      redStrokes(scene) === 0 &&
      legends
        .at(-1)!
        .some(
          (entry: IAutoMovieInspectionLegendEntry): boolean =>
            entry.color === 0xff0000 && entry.count === 1,
        ),
  );

  let timestamp: number = 16;
  const tick: () => Promise<void> = async (): Promise<void> => {
    frame!(timestamp);
    timestamp += 16;
    completeSeek!(undefined);
    await settle();
  };
  const visit: (outputFrame: number) => Promise<void> = async (
    outputFrame: number,
  ): Promise<void> => {
    playhead.seek(outputFrame / 24);
    await tick();
  };
  await visit(4);
  await visit(5);
  await visit(3);
  TestValidator.equals(
    "one span keeps first, worst and last actual frame",
    [
      first.length,
      episodes.length,
      episodes[0]?.first.time.outputFrame,
      episodes[0]?.worst.time.outputFrame,
      episodes[0]?.last.outputFrame,
    ],
    [1, 1, 3, 4, 4],
  );
  TestValidator.equals(
    "replay still paints the red witness",
    renders.at(-1)?.red,
    1,
  );
  await visit(7);
  await visit(8);
  await visit(9);
  await visit(10);
  TestValidator.equals(
    "gaps and deferred observation close the run",
    episodes.length,
    1,
  );
  const beforeTwoPairs: number = first.length;
  await visit(11);
  await visit(12);
  await visit(13);
  TestValidator.equals(
    "a new failure after clearance reports both pairs independently",
    first
      .slice(beforeTwoPairs)
      .map(
        (
          entry: IAutoMovieInspectionDiagnostics.IObservation,
        ): [number | undefined, string] => [
          entry.time.outputFrame,
          entry.finding.key,
        ],
      ),
    [
      [11, "hero/prop"],
      [11, "hero/stand"],
    ],
  );
  TestValidator.equals(
    "only the continuing pair has another multi-frame episode",
    [
      episodes.length,
      episodes[1]?.first.finding.key,
      episodes[1]?.worst.time.outputFrame,
    ],
    [2, "hero/prop", 12],
  );
  const beforePlaying: number = first.length;
  playhead.play();
  await tick();
  const offGrid: IAutoMovieInspectionDiagnostics.ITime = reported.at(-1)!.time;
  await tick();
  playhead.pause();
  playhead.seek(offGrid.filmSeconds);
  await tick();
  TestValidator.predicate(
    "off-grid playing keeps one immediate observation",
    nclose(offGrid.filmSeconds, 13 / 24 + 0.016) &&
      offGrid.outputFrame === undefined &&
      first.length === beforePlaying + 1,
  );
  TestValidator.predicate(
    "the seek closes one playback span of two painted samples without frame indices",
    episodes.length === 3 &&
      bases.join() === "frames,frames,playback" &&
      episodes[2]!.samples === 2 &&
      nclose(episodes[2]!.first.time.filmSeconds, 13 / 24 + 0.016) &&
      nclose(episodes[2]!.last.filmSeconds, 13 / 24 + 0.032) &&
      episodes[2]!.first.time.outputFrame === undefined &&
      episodes[2]!.last.outputFrame === undefined,
  );

  // 7. Hidden witnesses keep the report.
  const reportedBeforeHiding: number = reported.length;
  mounted.overlay(false);
  playhead.seek(20 / 24);
  await tick();
  TestValidator.predicate(
    "hidden witnesses draw no red stroke and the sample is still reported",
    renders.at(-1)!.red === 0 &&
      reported.length === reportedBeforeHiding + 1 &&
      reported.at(-1)!.findings.length === 1,
  );
  mounted.overlay(true);
  await tick();
  TestValidator.equals(
    "shown witnesses redraw the cube",
    renders.at(-1)?.red,
    1,
  );
  const samplesBeforeDispose: number = samples.length;
  const paintsBeforeDispose: number = renders.length;
  playhead.seek(0.5);
  frame!(timestamp);
  mounted.dispose();
  completeSeek!(undefined);
  await settle();
  TestValidator.equals(
    "a disposed late seek paints and reports nothing",
    [seeks, reported.length, renders.length, failures],
    [samplesBeforeDispose + 2, samplesBeforeDispose, paintsBeforeDispose, []],
  );
}

/** Drain the arrival and seek continuations controlled by this test. */
async function settle(): Promise<void> {
  for (let step: number = 0; step < 4; ++step) await Promise.resolve();
}

/** The existing stroke renderer writes per-instance RGB values. */
function redStrokes(scene: THREE.Object3D): number {
  let count: number = 0;
  scene.traverse((object: THREE.Object3D): void => {
    if (!(object instanceof THREE.Mesh)) return;
    const color:
      | THREE.BufferAttribute
      | THREE.InterleavedBufferAttribute
      | undefined = object.geometry.getAttribute("instanceColorStart");
    if (
      color !== undefined &&
      color.getX(0) === 1 &&
      color.getY(0) === 0 &&
      color.getZ(0) === 0
    )
      ++count;
  });
  return count;
}
