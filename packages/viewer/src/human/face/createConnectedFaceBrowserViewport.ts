import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

import { createAutoMovieResourceRetirement } from "../../createAutoMovieResourceRetirement.js";
import { releaseViewerRenderer } from "../../releaseViewerRenderer.js";
import { restoreAutoMovieRenderModeState } from "../../restoreAutoMovieRenderModeState.js";
import { createConnectedFaceViewport } from "./createConnectedFaceViewport.js";

/**
 * Acquire the existing face editor's browser display services in Viewer.
 * The supplied factory transfers each numerical connection to the face stage;
 * its source selection remains the caller's numerical transport responsibility.
 * Close settles the stage, then releases this mount's controls, observer and
 * renderer independently. Setup refusal attempts acquired browser services too.
 *
 * @evidence contracts/common.md#principled-implementation Realizes the current face canvas with the same antialiased preserved-drawing-buffer renderer, native orbit controls and resize observation as its existing page; numerical source selection stays with worker factory and GPU shutdown follows stage/frame/connection retirement.
 * @evidence contracts/common.md#clear-and-simple-design Moves browser GPU/control acquisition from the face page into its package owner while preserving the existing viewport result surface; the stage owns scene/frame publication and this mount owns only its actual browser services.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Uses supported constructor/dispose APIs and the passed canvas/transport, with no asset-specific camera, fake worker, patched global or replacement native renderer method.
 * @evidence contracts/common.md#meaningful-documentation Gives numerical connection transfer, caller source-selection duty, full close ordering, independent browser cleanup and setup refusal scope; pixel ratio retains the existing browser device default.
 * @evidence contracts/performance.md#efficient-algorithms Mount creates one renderer, one control and one observer plus a reused texture-loader instance; real scene/frame costs remain those of the face stage and material preparation rather than another per-document display allocation.
 * @evidence contracts/performance.md#reuse-equivalent-work Repeated edits use this mount's fixed canvas services, while texture/frame equivalence remains with numerical renderer ownership; repeated/reentrant close requests share one complete retirement promise.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Owns browser renderer/control/resize observation from acquisition through close or setup refusal, and attempts each cleanup despite a preceding failure. Successful stage close rejects pending numerical work and retires frames before browser release; indeterminate native release remains a rejected owner completion.
 */
export function createConnectedFaceBrowserViewport(
  props: Pick<Parameters<typeof createConnectedFaceViewport>[0], "worker"> & {
    /** Canvas whose renderer and observation subscription belong to this mount. */
    canvas: HTMLCanvasElement;

    /** Display ratio; omission uses the browser device ratio. */
    pixelRatio?: number;
  },
): ReturnType<typeof createConnectedFaceViewport> {
  const renderer: THREE.WebGLRenderer = new THREE.WebGLRenderer({
    canvas: props.canvas,
    antialias: true,
    preserveDrawingBuffer: true,
  });
  const loader: THREE.TextureLoader = new THREE.TextureLoader();
  let orbit: OrbitControls | undefined;
  let observer: ResizeObserver | undefined;
  const releaseBrowser: (() => void)[] = [
    (): void => { renderer.setAnimationLoop(null); },
    (): void => { observer?.disconnect(); },
    (): void => { orbit?.dispose(); },
    (): void => { releaseViewerRenderer(renderer); },
  ];
  try {
    const stage: ReturnType<typeof createConnectedFaceViewport> = createConnectedFaceViewport({
      ...props,
      pixelRatio: props.pixelRatio ?? devicePixelRatio,
      renderer,
      orbit: (camera: THREE.PerspectiveCamera): OrbitControls => {
        orbit = new OrbitControls(camera, props.canvas);
        return orbit;
      },
      loadTexture: (asset: string): Promise<THREE.Texture> => loader.loadAsync(asset),
      observeResize: (resize: () => void): (() => void) => {
        const subscription: ResizeObserver = new ResizeObserver(resize);
        observer = subscription;
        subscription.observe(props.canvas);
        return (): void => { subscription.disconnect(); };
      },
    });
    const close: () => Promise<void> = createAutoMovieResourceRetirement([
      async (): Promise<void> => {
        let primary: { error: unknown } | undefined;
        try { await stage.close(); } catch (error) { primary = { error }; }
        if (primary === undefined) restoreAutoMovieRenderModeState(releaseBrowser);
        else restoreAutoMovieRenderModeState(releaseBrowser, primary);
      },
    ]);
    return { ...stage, close };
  } catch (error) {
    return restoreAutoMovieRenderModeState(releaseBrowser, { error });
  }
}
