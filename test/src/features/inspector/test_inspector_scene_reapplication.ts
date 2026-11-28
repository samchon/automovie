import type {
  IAutoMovieCapturePlanRequest,
  IAutoMovieInspectionDiagnostics,
} from "@automovie/interface";
import type { IAutoMovieRenderDrawScene } from "@automovie/render";
import {
  AutoMovieViewerInspectorPlayhead,
  AutoMovieViewerInspector,
  type IAutoMovieViewerInspectorScene,
  type IAutoMovieViewerInspectorSceneHost,
} from "@automovie/viewer";
import { TestValidator } from "@nestia/e2e";
import * as THREE from "three";

import { filmResponseRendererFields } from "../internal/filmResponseRendererFields";

/**
 * An opted-in subject keeps an inspection that leaves the observed scene
 * unchanged, and restores one that changes it before each observation.
 *
 * Scenarios:
 *
 * 1. Under the default request, three painted seconds render with one and the same
 *    inspection overlay group, so the inspection is applied once, and each
 *    observation sees the prop on its own layer.
 * 2. After a request that hides the prop, each of two observations still sees the
 *    prop on its own layer, and each painted second renders with a newly
 *    applied overlay group with the prop off every layer.
 * 3. Returning to a request that changes nothing applies it once more, then keeps
 *    it across the following seconds.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Describes the visible prop, the request that hides it and the return to an ordinary inspection while the diagnostic reader continues seeing the source pose.
 * @evidence contracts/development/testing.md#behavioral-verification Drives the normal Viewer mount with a recording draw host and a physical scene. Its observer records the original masks and the renderer records the current inspection object and applied masks.
 * @evidence contracts/development/testing.md#independent-expectations A stock prop begins on Three.js layer 0, bitmask 1. The explicit hide request sets its drawn mask to 0. Object identity across frames distinguishes the retained neutral overlay from the new overlay built for each changing pose.
 */
export async function test_inspector_scene_reapplication(): Promise<void> {
  const scene: THREE.Scene = new THREE.Scene();
  const prop: THREE.Mesh = new THREE.Mesh(
    new THREE.BoxGeometry(),
    new THREE.MeshBasicMaterial(),
  );
  prop.name = "prop";
  scene.add(prop);
  const observedMasks: number[] = [];
  const subject: IAutoMovieRenderDrawScene = {
    scene,
    camera: new THREE.PerspectiveCamera(50, 16 / 9, 0.1, 50),
    durationSeconds: 1,
    fps: 24,
    width: 640,
    height: 360,
    seek: async (): Promise<void> => {},
    inspectPlaced: (
      sample: IAutoMovieRenderDrawScene.IPlacedSample,
    ): IAutoMovieInspectionDiagnostics => {
      observedMasks.push(prop.layers.mask);
      return { scope: "s", time: sample.time, findings: [], coverage: [] };
    },
    dispose: (): void => {},
  };
  const rendered: { overlay: THREE.Object3D | undefined; mask: number }[] = [];
  let frame: FrameRequestCallback | undefined;
  const host: IAutoMovieViewerInspectorSceneHost = {
    size: (): IAutoMovieViewerInspectorSceneHost.ISize => ({
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
    createRenderer: (): IAutoMovieViewerInspectorSceneHost.ICreated => ({
      compositor: null,
      renderer: {
        ...filmResponseRendererFields(),
        localClippingEnabled: false,
        setPixelRatio: (): void => {},
        setSize: (): void => {},
        dispose: (): void => {},
        render: (): void => {
          rendered.push({
            overlay: scene.children.at(-1),
            mask: prop.layers.mask,
          });
        },
      },
    }),
  };
  const playhead: AutoMovieViewerInspectorPlayhead = new AutoMovieViewerInspectorPlayhead();
  const failures: string[] = [];
  const mounted: IAutoMovieViewerInspectorScene = AutoMovieViewerInspector.mountScene({
    subject: { create: async (): Promise<IAutoMovieRenderDrawScene> => subject },
    name: "s",
    request: AutoMovieViewerInspector.readAddress("at=0"),
    playhead,
    host,
    report: {
      ready: (): void => {},
      legend: (): void => {},
      labels: (): void => {},
      error: (message: string | null): void => {
        if (message !== null) failures.push(message);
      },
      refused: (_: IAutoMovieCapturePlanRequest, message: string): void => {
        failures.push(message);
      },
    },
  });
  let timestamp: number = 0;
  const visit: (seconds: number) => Promise<void> = async (
    seconds: number,
  ): Promise<void> => {
    playhead.seek(seconds);
    frame!((timestamp += 16));
    for (let step: number = 0; step < 4; ++step) await Promise.resolve();
  };
  for (let step: number = 0; step < 4; ++step) await Promise.resolve();

  // 1. The default request is applied once.
  for (const seconds of [0.25, 0.5, 0.75]) await visit(seconds);
  const kept: THREE.Object3D | undefined = rendered[0]?.overlay;
  TestValidator.predicate(
    "the default inspection is kept across painted seconds",
    rendered.length === 3 &&
      kept instanceof THREE.Group &&
      kept.name !== "prop" &&
      rendered.every(
        (entry: (typeof rendered)[number]): boolean => entry.overlay === kept,
      ) &&
      observedMasks.every((mask: number): boolean => mask === 1),
  );

  // 2. A hiding request is restored for every observation.
  mounted.apply(AutoMovieViewerInspector.readAddress("at=0.75&hide=prop"));
  for (const seconds of [0.25, 0.5]) await visit(seconds);
  const hiding: typeof rendered = rendered.slice(3);
  TestValidator.predicate(
    "a hiding inspection is re-applied after each observation of the placed scene",
    hiding.length === 2 &&
      new Set([
        kept,
        ...hiding.map(
          (entry: (typeof rendered)[number]): THREE.Object3D | undefined =>
            entry.overlay,
        ),
      ]).size === 3 &&
      hiding.every(
        (entry: (typeof rendered)[number]): boolean => entry.mask === 0,
      ) &&
      observedMasks.every((mask: number): boolean => mask === 1),
  );

  // 3. Back to a request that changes nothing.
  mounted.apply(AutoMovieViewerInspector.readAddress("at=0.5"));
  for (const seconds of [0.25, 0.75]) await visit(seconds);
  const back: typeof rendered = rendered.slice(5);
  TestValidator.predicate(
    "the returning request is applied once and then kept",
    back.length >= 2 &&
      back.at(-1)!.overlay === back.at(-2)!.overlay &&
      back.at(-1)!.mask === 1 &&
      failures.length === 0,
  );
  mounted.dispose();
}
