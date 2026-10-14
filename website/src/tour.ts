/**
 * Browser entry for the temple, suburban and future-house tours. It loads a compressed native transport beneath the site's mount path, then mounts its original scene uploader, shared spectator flight and accessible navigation. The manor route uses the same input with its production-specific scene.
 *
 * The loading overlay is hidden after texture loading, scene construction and the first draw/finish call return; that sequence is not independent visual acceptance or completed-frame observer publication. Teardown retires callback authority before attempting every registered owner cleanup; rollback retains the construction cause and cleanup failures. A disposed page reloads on BFCache restoration to reacquire its GPU resources. Fetch/decode has no cancellation owner when pagehide occurs before lifecycle handlers attach.
 */
import { mountViewer } from "@automovie/viewer";
import { daylight } from "production-future-daylight";
import { uploadHouse } from "production-future-scene";
import { createTempleDaylight } from "production-temple-daylight";
import { uploadTemple } from "production-temple-scene";
import * as THREE from "three";

import { runWebsiteCleanup } from "./internal/runWebsiteCleanup";
import { mountSpectatorControls } from "./spectatorControls";
import { applyTourView } from "./tourCamera";
import { buildingFromQuery, readTourData } from "./tourData";
import { createTourFrame } from "./tourFrame";
import { loadTourScene } from "./tourScene";
import { mountTourUi } from "./tourUi";

const canvas: HTMLCanvasElement =
  document.querySelector<HTMLCanvasElement>("#view")!;
const loading: HTMLElement = document.querySelector<HTMLElement>("#loading")!;
const phase: HTMLElement = document.querySelector<HTMLElement>("#phase")!;
const status: HTMLElement = document.querySelector<HTMLElement>("#status")!;
const fail: (error: unknown) => void = (error: unknown): void => {
  console.error("Tour failed.", error);
  loading.hidden = false;
  loading.classList.add("failed");
  loading.setAttribute("role", "alert");
  phase.textContent = error instanceof Error ? error.message : String(error);
};

const main: () => Promise<void> = async (): Promise<void> => {
  const building: ReturnType<typeof buildingFromQuery> = buildingFromQuery(
    location.search,
  );
  const base: string = new URL(`../buildings/${building}/`, location.href).href;
  phase.textContent = "Loading the building's 3D data";
  const response: Response = await fetch(new URL("scene.bin", base));
  if (!response.ok || !response.body)
    throw new Error(
      `The building could not be loaded (HTTP ${response.status}).`,
    );
  const data: ReturnType<typeof readTourData> = readTourData(
    await new Response(
      response.body.pipeThrough(new DecompressionStream("gzip")),
    ).json(),
    building,
  );
  phase.textContent = "Preparing materials and geometry";
  const camera: THREE.PerspectiveCamera = new THREE.PerspectiveCamera();
  let frame: (elapsed: number) => boolean = (): boolean => true;
  const mounted: ReturnType<typeof mountViewer> = mountViewer(
    canvas,
    new THREE.Scene(),
    camera,
    (elapsed: number): boolean => frame(elapsed),
    {
      pixelRatio: Math.min(devicePixelRatio, 1.5),
      preserveDrawingBuffer: true,
    },
  );
  const renderer: THREE.WebGLRenderer = mounted.renderer;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.shadowMap.enabled = true;
  const gl: ReturnType<typeof renderer.getContext> = renderer.getContext();
  const debug: WEBGL_debug_renderer_info | null = gl.getExtension(
    "WEBGL_debug_renderer_info",
  );
  console.info(
    "RENDERER",
    debug
      ? gl.getParameter(debug.UNMASKED_RENDERER_WEBGL)
      : gl.getParameter(gl.RENDERER),
  );
  const loader: THREE.TextureLoader = new THREE.TextureLoader();
  let loaded: Awaited<ReturnType<typeof loadTourScene>>;
  try {
    loaded = await loadTourScene(data, renderer, base, {
      load: (url: string): Promise<THREE.Texture> => loader.loadAsync(url),
      createTempleDaylight,
      uploadTemple,
      daylight: (): ReturnType<typeof daylight> => daylight(renderer),
      uploadHouse,
    });
  } catch (error) {
    runWebsiteCleanup([mounted.stop], [error]);
    throw error;
  }
  const cleanups: (() => void)[] = [loaded.dispose, mounted.stop];
  let disposed: boolean = false;
  const disposalFailure: unknown[] = [];
  const dispose: () => void = (): void => {
    if (disposed) {
      if (disposalFailure.length !== 0) throw disposalFailure[0];
      return;
    }
    disposed = true;
    try {
      runWebsiteCleanup(cleanups.splice(0));
    } catch (error) {
      disposalFailure.push(error);
      throw error;
    }
  };
  try {
    const drawing: ReturnType<typeof createTourFrame> = createTourFrame({
      canvas,
      camera,
      scene: loaded.scene,
      renderer,
      finish: (): void => gl.finish(),
    });
    const target: THREE.Vector3 = new THREE.Vector3();
    const indices: Map<string, (typeof data.views)[number]> = new Map(
      data.views.map(
        (
          view: (typeof data.views)[number],
        ): [string, (typeof data.views)[number]] => [view.id, view],
      ),
    );
    const select: (id: string) => void = (id: string): void => {
      const view: (typeof data.views)[number] = indices.get(id)!;
      controls.clear();
      applyTourView(camera, target, view);
      ui.highlight(id);
      const url: URL = new URL(location.href);
      url.searchParams.set("view", id);
      history.replaceState(null, "", url);
      drawing.invalidate();
    };
    const ui: ReturnType<typeof mountTourUi> = mountTourUi(document, data, {
      collapsed: matchMedia("(max-width: 720px)").matches,
      select,
    });
    cleanups.unshift(ui.dispose);
    const controls: ReturnType<typeof mountSpectatorControls> =
      mountSpectatorControls({
        canvas,
        camera,
        target,
        reset: (): void => select(data.initial),
        changed: drawing.invalidate,
        notice: (message: string): void => {
          status.textContent = message;
        },
      });
    cleanups.splice(1, 0, controls.dispose);
    frame = (elapsed: number): boolean => {
      if (controls.frame(elapsed)) drawing.invalidate();
      return drawing.frame();
    };
    const requested: string | null = new URLSearchParams(location.search).get(
      "view",
    );
    select(requested && indices.has(requested) ? requested : data.initial);
    document.title = `${data.title} · AutoMovie 3D`;
    drawing.frame();
    loading.hidden = true;
    canvas.addEventListener("webglcontextlost", (event: Event): void => {
      event.preventDefault();
      try {
        runWebsiteCleanup(
          [dispose],
          [new Error("The 3D context was lost. Reload to continue.")],
        );
      } catch (error) {
        fail(error);
      }
    });
    window.addEventListener("pagehide", dispose, { once: true });
    window.addEventListener("pageshow", (event: PageTransitionEvent): void => {
      if (event.persisted) location.reload();
    });
  } catch (error) {
    runWebsiteCleanup([dispose], [error]);
    throw error;
  }
};
main().catch(fail);
