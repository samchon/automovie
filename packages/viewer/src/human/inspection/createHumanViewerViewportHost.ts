import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

import { createAutoMovieResourceRetirement } from "../../createAutoMovieResourceRetirement.js";
import type { IConnectedBodyViewportHost } from "../body/IConnectedBodyViewportHost.js";
import { drawHumanViewerFrame } from "./drawHumanViewerFrame.js";

/**
 * The host a product viewport is created with: the page's one WebGL renderer behind a facade that keeps each viewport's color, tone and shadow settings of its own, so residents sharing the renderer never see each other's settings. The facade has no animation loop, since captures always finish a frame on demand. `resize` calls the viewport's latest resize observer and `release` independently attempts the orbit controls the viewport created, awaiting one shared completion and retaining every failure. The host borrows the page renderer and never disposes it or ends its context.
 *
 * @evidence contracts/common.md#principled-implementation A renderer facade retains per-viewport color/tone/shadow state, delegates actual draws to the shared settings adapter and owns only controls created through its orbit factory.
 * @evidence contracts/common.md#clear-and-simple-design Borrowed renderer/loader capabilities, one resize callback and a controls list define the host without another animation scheduler.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Resize cleanup uses callback identity so an older viewport cannot detach a newer observer, and host release does not dispose the borrowed page renderer.
 * @evidence contracts/common.md#meaningful-documentation The comment identifies private display settings, explicit frame drawing and independent control retirement with shared completion history.
 * @evidence contracts/performance.md#efficient-algorithms Settings and resize forwarding are constant-time; host release traverses the controls actually created by this host once.
 * @evidence contracts/performance.md#reuse-equivalent-work Residents borrow the same page renderer but retain distinct facade settings; equivalent release requests share the retirement completion rather than disposing controls repeatedly.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Created controls retire on host release and the resize slot is cleared; failed control references remain in the same host list without a retry, control count has no independent cap, while texture, canvas and renderer ownership remain with the page and viewport owners.
 */
export function createHumanViewerViewportHost(
  canvas: HTMLCanvasElement,
  renderer: THREE.WebGLRenderer,
  loader: THREE.TextureLoader,
): {
  props: Omit<IConnectedBodyViewportHost<unknown>, "worker">;
  resize: () => void;
  release: () => Promise<void>;
} {
  const controls: OrbitControls[] = [];
  let resize: () => void = (): void => {};
  const settings: Parameters<typeof drawHumanViewerFrame>[0] & {
    toneMapping: THREE.ToneMapping;
    shadowMap: { type: THREE.ShadowMapType };
  } = {
    outputColorSpace: THREE.SRGBColorSpace as string,
    toneMapping: THREE.LinearToneMapping as THREE.ToneMapping,
    toneMappingExposure: 1,
    shadowMap: {
      enabled: true,
      type: THREE.PCFShadowMap as THREE.ShadowMapType,
      autoUpdate: false,
      needsUpdate: true,
    },
  };
  const props: Omit<IConnectedBodyViewportHost<unknown>, "worker"> = {
    canvas,
    pixelRatio: 1,
    renderer: {
      capabilities: renderer.capabilities,
      shadowMap: settings.shadowMap,
      get outputColorSpace(): string {
        return settings.outputColorSpace;
      },
      set outputColorSpace(value: string) {
        settings.outputColorSpace = value;
      },
      get toneMapping(): THREE.ToneMapping {
        return settings.toneMapping;
      },
      set toneMapping(value: THREE.ToneMapping) {
        settings.toneMapping = value;
      },
      get toneMappingExposure(): number {
        return settings.toneMappingExposure;
      },
      set toneMappingExposure(value: number) {
        settings.toneMappingExposure = value;
      },
      setPixelRatio: (ratio: number): void => renderer.setPixelRatio(ratio),
      setSize: (width: number, height: number, style: boolean): void =>
        renderer.setSize(width, height, style),
      setAnimationLoop: (_callback: (() => void) | null): void => {},
      render: (scene: THREE.Scene, camera: THREE.PerspectiveCamera): void =>
        drawHumanViewerFrame(settings, renderer, (): void =>
          renderer.render(scene, camera),
        ),
      getContext: (): ReturnType<THREE.WebGLRenderer["getContext"]> =>
        renderer.getContext(),
    },
    orbit: (camera: THREE.PerspectiveCamera): OrbitControls => {
      const orbit: OrbitControls = new OrbitControls(camera, canvas);
      controls.push(orbit);
      return orbit;
    },
    observeResize: (observer: () => void): (() => void) => {
      resize = observer;
      return (): void => {
        if (resize === observer) resize = (): void => {};
      };
    },
    loadTexture: (asset: string): Promise<THREE.Texture> =>
      loader.loadAsync(asset),
  };
  return {
    props,
    resize: (): void => resize(),
    release: createAutoMovieResourceRetirement([
      (): void => {
        resize = (): void => {};
      },
      (): Promise<void> =>
        createAutoMovieResourceRetirement(
          controls.map(
            (control: OrbitControls): (() => void) =>
              (): void =>
                control.dispose(),
          ),
        )(),
    ]),
  };
}
