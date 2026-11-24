import type {
  IAutoMovieCapturePlanRequest,
  IAutoMovieFilmOptics,
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

import { createFilmResponseRendererDouble } from "../draw/createFilmResponseRendererDouble";

/**
 * A structural pass never reaches the film response stage: a depth picture of a
 * subject with optics is drawn exactly as the same picture of the subject
 * without them, while its beauty picture goes through the stage.
 *
 * Scenarios:
 *
 * 1. Painting one second under `shade=depth`, a subject whose optics set an ACES
 *    curve, a white balance, glare and a grade draws the same renders as the
 *    same subject without optics: the scene once, straight into the canvas,
 *    under the renderer's own curve and exposure, with no full-frame program,
 *    and its optics are never read.
 * 2. The same holds under `shade=normal` and `shade=mask`.
 * 3. Under the beauty shade, the subject with optics draws the scene into a linear
 *    half-float target and then the response's full-frame pass, so the stage is
 *    what a structural pass skips.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Lists the shades, the optics and the renders each scenario expects.
 * @evidence contracts/development/testing.md#behavioral-verification Mounts the public inspector over a recording renderer and compares what each shade renders with and without optics; a structural pass sent through the stage draws a half-float target and a full-frame program and fails.
 * @evidence contracts/development/testing.md#independent-expectations IAutoMovieRenderSpec and issue #4076 require structural passes (depth, normal, mask, outline) to ignore optics, so with and without optics they must render the same.
 * @evidence contracts/development/testing.md#distinguishing-cases Three structural shades with and without optics, against the beauty shade that does read them. The draw page takes the same branch, every pass but beauty and the graphics plate drawn straight to the canvas, and needs a WebGL renderer, so its pixels belong to a capture; the stage's own response belongs to the test_draw_film_optics tests.
 * @evidence contracts/development/testing.md#execution-ownership In-memory unit over a recording renderer; no browser, timer or graphics context.
 */
export async function test_inspector_structural_pass_optics(): Promise<void> {
  const optics: IAutoMovieFilmOptics = {
    ev100: 12,
    toneMapping: "acesFilmic",
    whiteBalance: 3200,
    glare: { strength: 0.1 },
    grade: {
      slope: [1.2, 1, 0.8],
      offset: [0, 0, 0],
      power: [1, 1, 1],
      saturation: 0.5,
    },
  };

  // 1 and 2. Each structural shade, with and without optics.
  for (const shade of ["depth", "normal", "mask"] as const) {
    const plain: IPainted = await paint(`shade=${shade}`, undefined);
    const lit: IPainted = await paint(`shade=${shade}`, optics);
    TestValidator.predicate(
      `${shade} draws the same with optics as without`,
      plain.failures.length === 0 &&
        lit.failures.length === 0 &&
        plain.renders.length > 0 &&
        JSON.stringify(lit.renders) === JSON.stringify(plain.renders) &&
        lit.renders.every(
          (render: IRender): boolean =>
            render.target === null && render.program === false,
        ) &&
        lit.opticsRead === 0,
    );
  }

  // 3. The beauty shade goes through the stage.
  const beauty: IPainted = await paint("", optics);
  TestValidator.predicate(
    "the beauty shade draws through the response stage",
    beauty.failures.length === 0 &&
      beauty.renders.some(
        (render: IRender): boolean =>
          render.scene && render.target === THREE.HalfFloatType,
      ) &&
      beauty.renders.some((render: IRender): boolean => render.program) &&
      beauty.opticsRead > 0,
  );
}

/** One render as the test compares it. */
interface IRender {
  /** Whether the subject's scene was drawn. */
  scene: boolean;

  /** The target's texel type, or null for the canvas. */
  target: THREE.TextureDataType | null;

  /** The renderer's own curve during the render. */
  toneMapping: THREE.ToneMapping;

  /** The renderer's own exposure during the render. */
  exposure: number;

  /** Whether a full-frame program was drawn. */
  program: boolean;
}

/** What one painted second drew and read. */
interface IPainted {
  /** Every render of the painted frame, in order. */
  renders: IRender[];

  /** How often the subject's optics were read. */
  opticsRead: number;

  /** Errors and refusals the page reported. */
  failures: string[];
}

/**
 * Mount the inspector over a one-box subject with or without `optics`, paint
 * one second under `address` and record the frame's renders.
 */
async function paint(
  address: string,
  optics: IAutoMovieFilmOptics | undefined,
): Promise<IPainted> {
  const scene: THREE.Scene = new THREE.Scene();
  scene.add(
    new THREE.Mesh(new THREE.BoxGeometry(), new THREE.MeshStandardMaterial()),
  );
  let opticsRead: number = 0;
  const subject: IAutoMovieDrawScene = {
    scene,
    camera: new THREE.PerspectiveCamera(50, 16 / 9, 0.1, 50),
    durationSeconds: 1,
    fps: 24,
    width: 64,
    height: 36,
    seek: async (): Promise<void> => {},
    ...(optics === undefined
      ? {}
      : {
          optics: (): IAutoMovieFilmOptics => {
            opticsRead += 1;
            return optics;
          },
        }),
    dispose: (): void => {},
  };
  const double: createFilmResponseRendererDouble.IDouble =
    createFilmResponseRendererDouble({
      toneMapping: THREE.NoToneMapping,
      exposure: 1,
    });
  const renderer: IAutoMovieInspectorSceneHost.IRenderer = Object.assign(
    double.renderer,
    {
      localClippingEnabled: false,
      setPixelRatio: (): void => {},
      setSize: (): void => {},
      dispose: (): void => {},
    },
  );
  let frame: FrameRequestCallback | undefined;
  const host: IAutoMovieInspectorSceneHost = {
    size: (): IAutoMovieInspectorSceneHost.ISize => ({
      width: 64,
      height: 36,
      pixelRatio: 1,
    }),
    requestFrame: (callback: FrameRequestCallback): number => {
      frame = callback;
      return 1;
    },
    cancelFrame: (): void => {
      frame = undefined;
    },
    createRenderer: (): IAutoMovieInspectorSceneHost.IRenderer => renderer,
  };
  const failures: string[] = [];
  const mounted: IAutoMovieInspectorScene = mountAutoMovieInspectorScene({
    subject: { create: async (): Promise<IAutoMovieDrawScene> => subject },
    name: "s",
    request: readAutoMovieInspectorAddress(
      address === "" ? "at=0.5" : `at=0.5&${address}`,
    ),
    playhead: new AutoMovieInspectorPlayhead(),
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
  for (let step: number = 0; step < 4; ++step) await Promise.resolve();
  double.renders.length = 0;
  opticsRead = 0;
  frame?.(16);
  for (let step: number = 0; step < 4; ++step) await Promise.resolve();
  mounted.dispose();
  return {
    renders: double.renders.map(
      (render: createFilmResponseRendererDouble.IRender): IRender => ({
        scene: render.object === scene,
        target: render.target === null ? null : render.target.texture.type,
        toneMapping: render.toneMapping,
        exposure: render.exposure,
        program: render.program !== null,
      }),
    ),
    opticsRead,
    failures,
  };
}
