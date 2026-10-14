import type {
  IAutoMovieHumanBodyBasisDocument,
  IAutoMovieHumanPersonDocument,
} from "@automovie/human";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

import { createAutoMovieResourceRetirement } from "../../createAutoMovieResourceRetirement.js";
import { releaseViewerRenderer } from "../../releaseViewerRenderer.js";
import { restoreAutoMovieRenderModeState } from "../../restoreAutoMovieRenderModeState.js";
import type { IConnectedBodyViewportHost } from "./IConnectedBodyViewportHost.js";
import { createConnectedBodyViewport } from "./createConnectedBodyViewport.js";

/**
 * Mount the connected-body stage with browser-owned GPU and control services.
 * The supplied worker factory transfers each resident connection to the stage.
 * Close first settles stage and worker retirement, then independently releases
 * controls, resize observation and this mount's renderer, preserving failures.
 * Construction failure releases every browser service acquired before it.
 *
 * @evidence contracts/common.md#principled-implementation Keeps browser renderer, OrbitControls and ResizeObserver allocation in Viewer, passing numerical transport and serialization through the existing stage seam; teardown waits for stage retirement before disposing the owned renderer.
 * @evidence contracts/common.md#clear-and-simple-design The browser factory owns IO lifetimes while createConnectedBodyViewport owns scene and numerical-frame publication; callers receive the same stage handle with one complete close operation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Uses ordinary public Three and browser APIs without patching globals; all documents use the same renderer/control setup and failed cleanup remains a rejected completion.
 * @evidence contracts/common.md#meaningful-documentation States worker connection transfer, teardown ordering, independent browser cleanup and construction-failure release; props identify canvas and optional display pixel ratio.
 * @evidence contracts/performance.md#efficient-algorithms Allocates one renderer, one controls object and one observer per mount; texture loads are delegated to the stage's material owner and frame cost remains with the existing stage.
 * @evidence contracts/performance.md#reuse-equivalent-work Reuses the renderer, controls, observer and loader for the mounted stage; createAutoMovieResourceRetirement memoizes one full close outcome including failure.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The mount owns its GPU renderer, orbit listeners and resize subscription until close; stage retirement withdraws the loop and worker connection before renderer release, and setup refusals attempt acquired browser-service cleanup.
 */
export function createConnectedBodyBrowserViewport<
  Document extends
    | IAutoMovieHumanBodyBasisDocument
    | IAutoMovieHumanPersonDocument = IAutoMovieHumanBodyBasisDocument,
>(
  props: Pick<
    IConnectedBodyViewportHost<Document>,
    "worker" | "serialize" | "source"
  > & {
    /** Canvas whose renderer and resize subscription this mount owns. */
    canvas: HTMLCanvasElement;

    /** Display pixel ratio; omission reads the browser device ratio. */
    pixelRatio?: number;
  },
): ReturnType<typeof createConnectedBodyViewport<Document>> {
  const renderer: THREE.WebGLRenderer = new THREE.WebGLRenderer({
    canvas: props.canvas,
    antialias: true,
    preserveDrawingBuffer: true,
  });
  const loader: THREE.TextureLoader = new THREE.TextureLoader();
  let orbit: OrbitControls | undefined;
  let observer: ResizeObserver | undefined;
  const releaseBrowser: (() => void)[] = [
    (): void => {
      renderer.setAnimationLoop(null);
    },
    (): void => {
      observer?.disconnect();
    },
    (): void => {
      orbit?.dispose();
    },
    (): void => {
      releaseViewerRenderer(renderer);
    },
  ];
  try {
    const stage: ReturnType<typeof createConnectedBodyViewport<Document>> =
      createConnectedBodyViewport<Document>({
        ...props,
        pixelRatio: props.pixelRatio ?? devicePixelRatio,
        renderer,
        orbit: (camera: THREE.PerspectiveCamera): OrbitControls => {
          orbit = new OrbitControls(camera, props.canvas);
          return orbit;
        },
        loadTexture: (asset: string): Promise<THREE.Texture> =>
          loader.loadAsync(asset),
        observeResize: (resize: () => void): (() => void) => {
          const subscription: ResizeObserver = new ResizeObserver(resize);
          observer = subscription;
          subscription.observe(props.canvas);
          return (): void => {
            subscription.disconnect();
          };
        },
      });
    const close: () => Promise<void> = createAutoMovieResourceRetirement([
      async (): Promise<void> => {
        let primary: { error: unknown } | undefined;
        try {
          await stage.close();
        } catch (error) {
          primary = { error };
        }
        if (primary === undefined)
          restoreAutoMovieRenderModeState(releaseBrowser);
        else restoreAutoMovieRenderModeState(releaseBrowser, primary);
      },
    ]);
    return { ...stage, close };
  } catch (error) {
    return restoreAutoMovieRenderModeState(releaseBrowser, { error });
  }
}
