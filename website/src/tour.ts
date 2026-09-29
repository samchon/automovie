/**
 * Browser entry for the temple, suburban and future-house tours. It loads a
 * compressed native transport beneath the site's mount path, then mounts its
 * original scene uploader and shared accessible navigation. The existing manor
 * route retains its richer production-specific flight and inspection views.
 * Readiness follows texture decode, scene construction and the first GPU frame.
 * A disposed page reloads on BFCache restoration to reacquire its GPU resources.
 */
import { mountViewer } from "@automovie/viewer";
import { daylight } from "production-future-daylight";
import { uploadHouse } from "production-future-scene";
import { createTempleDaylight } from "production-temple-daylight";
import { uploadTemple } from "production-temple-scene";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

import { applyTourView, moveTourCamera } from "./tourCamera";
import { buildingFromQuery, readTourData } from "./tourData";
import { createTourFrame } from "./tourFrame";
import { loadTourScene } from "./tourScene";
import { mountTourUi } from "./tourUi";

const canvas = document.querySelector<HTMLCanvasElement>("#view")!;
const loading = document.querySelector<HTMLElement>("#loading")!;
const phase = document.querySelector<HTMLElement>("#phase")!;
const status = document.querySelector<HTMLElement>("#status")!;
const fail = (error: unknown): void => {
  loading.hidden = false;
  loading.classList.add("failed");
  loading.setAttribute("role", "alert");
  phase.textContent = error instanceof Error ? error.message : String(error);
};

const main = async (): Promise<void> => {
  const building = buildingFromQuery(location.search);
  const base = new URL(`../buildings/${building}/`, location.href).href;
  phase.textContent = "Loading the building's 3D data";
  const response = await fetch(new URL("scene.bin", base));
  if (!response.ok || !response.body)
    throw new Error(
      `The building could not be loaded (HTTP ${response.status}).`,
    );
  const data = readTourData(
    await new Response(
      response.body.pipeThrough(new DecompressionStream("gzip")),
    ).json(),
    building,
  );
  phase.textContent = "Preparing materials and geometry";
  const camera = new THREE.PerspectiveCamera();
  let frame: () => boolean = () => true;
  const mounted = mountViewer(
    canvas,
    new THREE.Scene(),
    camera,
    () => frame(),
    {
      pixelRatio: Math.min(devicePixelRatio, 1.5),
      preserveDrawingBuffer: true,
    },
  );
  const renderer = mounted.renderer;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.shadowMap.enabled = true;
  const gl = renderer.getContext();
  const debug = gl.getExtension("WEBGL_debug_renderer_info");
  console.info(
    "RENDERER",
    debug
      ? gl.getParameter(debug.UNMASKED_RENDERER_WEBGL)
      : gl.getParameter(gl.RENDERER),
  );
  const loader = new THREE.TextureLoader();
  let loaded;
  try {
    loaded = await loadTourScene(data, renderer, base, {
      load: (url) => loader.loadAsync(url),
      createTempleDaylight,
      uploadTemple,
      daylight: () => daylight(renderer),
      uploadHouse,
    });
  } catch (error) {
    mounted.stop();
    throw error;
  }
  const drawing = createTourFrame({
    canvas,
    camera,
    scene: loaded.scene,
    renderer,
    finish: () => gl.finish(),
  });
  frame = drawing.frame;
  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = false;
  controls.minDistance = 0.05;
  controls.maxDistance = 250;
  const indices = new Map(data.views.map((view) => [view.id, view]));
  const select = (id: string): void => {
    const view = indices.get(id)!;
    applyTourView(camera, controls.target, view);
    controls.update();
    ui.highlight(id);
    const url = new URL(location.href);
    url.searchParams.set("view", id);
    history.replaceState(null, "", url);
    drawing.invalidate();
  };
  const ui = mountTourUi(document, data, {
    collapsed: matchMedia("(max-width: 720px)").matches,
    select,
    move: (action, pan) => {
      moveTourCamera(camera, controls.target, action, pan);
      controls.update();
      drawing.invalidate();
    },
  });
  const requested = new URLSearchParams(location.search).get("view");
  select(requested && indices.has(requested) ? requested : data.initial);
  document.title = `${data.title} · AutoMovie 3D`;
  controls.addEventListener("change", drawing.invalidate);
  drawing.frame();
  loading.hidden = true;
  status.textContent = "Live 3D · Drag to orbit · Scroll to zoom";
  canvas.addEventListener("webglcontextlost", (event) => {
    event.preventDefault();
    mounted.stop();
    fail(new Error("The 3D context was lost. Reload to continue."));
  });
  window.addEventListener(
    "pagehide",
    () => {
      ui.dispose();
      controls.dispose();
      loaded.dispose();
      mounted.stop();
    },
    { once: true },
  );
  window.addEventListener("pageshow", (event) => {
    if (event.persisted) location.reload();
  });
};
main().catch(fail);
