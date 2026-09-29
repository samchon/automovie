// The manor showcase page: build the textured manor in the browser, then let
// the visitor fly through it or jump between its authored views.
//
// Shared spectator input preserves the production's world-up flight and lens
// zoom. The native source still owns scene construction, lighting and authored
// views; this host owns only presentation, deep links and resource lifetime.
import { mountViewer } from "@automovie/viewer";
import {
  type IManorScene,
  createTexturedManorScene,
} from "medieval-baron-manor/textured-scene";
import { mountPreviewNavigation } from "medieval-baron-manor/viewer/preview-navigation";

import { bakeManor } from "./bakeManor";
import { mountSpectatorControls } from "./spectatorControls";

const VIEW_PARAMETER = "view";

/** Authored view ids worth one click, in the order the panel lists them. */
const FEATURED: readonly { id: string; label: string }[] = [
  { id: "01-whole-south-east", label: "Whole manor" },
  { id: "reference-exterior", label: "Exterior" },
  { id: "reference-courtyard", label: "Courtyard" },
  { id: "garden-south", label: "Garden" },
  { id: "hall--corner-b", label: "Great hall" },
  { id: "kitchen--corner-b", label: "Kitchen" },
  { id: "entrance--corner-a", label: "Entrance" },
  { id: "master--corner-a", label: "Master chamber" },
  { id: "stair-turn", label: "Stair" },
  { id: "corridor-west-to-east", label: "Upper corridor" },
  { id: "ground-plan", label: "Ground plan" },
  { id: "upper-plan", label: "Upper plan" },
  { id: "frame-axonometric", label: "Timber frame" },
  { id: "roof-overhead", label: "Roof" },
];

const element = <T extends Element>(selector: string): T => {
  const found = document.querySelector<T>(selector);
  if (found === null)
    throw new Error(`The manor page is missing its ${selector} element.`);
  return found;
};

const canvas = element<HTMLCanvasElement>("#view");
const status = element<HTMLDivElement>("#status");
const loading = element<HTMLDivElement>("#loading");
const phase = element<HTMLDivElement>("#phase");
const featured = element<HTMLDivElement>("#featured");
const panel = element<HTMLElement>("#panel");
const sceneReadout = element<HTMLDivElement>("#scene");
const panelToggle = element<HTMLButtonElement>("#panel-toggle");

// A phone screen cannot hold the scene and the whole panel; it opens folded.
const setPanelCollapsed = (collapsed: boolean): void => {
  panel.classList.toggle("collapsed", collapsed);
  panelToggle.textContent = collapsed ? "Show" : "Hide";
  panelToggle.setAttribute("aria-expanded", String(!collapsed));
};
setPanelCollapsed(window.matchMedia("(max-width: 720px)").matches);
panelToggle.addEventListener("click", () =>
  setPanelCollapsed(!panel.classList.contains("collapsed")),
);

const fail = (error: unknown): void => {
  loading.hidden = false;
  loading.classList.add("failed");
  phase.textContent =
    "The manor could not be built.\n" +
    (error instanceof Error ? error.message : String(error));
};

/** Let the browser paint the phase message before synchronous geometry work. */
const paint = (): Promise<void> =>
  new Promise((resolve) => {
    requestAnimationFrame(() => setTimeout(resolve, 0));
  });

const requestedView = (): string | null =>
  new URLSearchParams(window.location.search).get(VIEW_PARAMETER);

const rememberView = (id: string): void => {
  const url = new URL(window.location.href);
  url.searchParams.set(VIEW_PARAMETER, id);
  window.history.replaceState(null, "", url);
};

/** Mount the view shortlist and the searchable list of every authored view. */
const mountViews = (
  manor: IManorScene,
  select: (id: string) => void,
): { removeNavigation: () => void; highlight: (id: string) => void } => {
  const indices = new Map(manor.views.map((view, index) => [view.id, index]));
  const buttons = new Map<string, HTMLButtonElement>();
  for (const item of FEATURED) {
    if (!indices.has(item.id)) continue;
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = item.label;
    button.addEventListener("click", () => select(item.id));
    buttons.set(item.id, button);
    featured.append(button);
  }
  const roomNames = new Map(
    manor.manifest.rooms.map((room) => [room.id, room.label]),
  );
  const removeNavigation = mountPreviewNavigation({
    items: manor.views.map((view) => ({
      id: view.id,
      label: view.id,
      group: roomNames.get(view.room ?? "") ?? view.object ?? "Views",
      keywords: [view.room ?? "", view.object ?? ""],
    })),
    apply: select,
  });
  // The navigator appends itself to the body; the showcase keeps one panel.
  panel.insertBefore(element("#preview-navigation"), element("#keys"));
  return {
    removeNavigation,
    highlight: (id) => {
      for (const [viewId, button] of buttons)
        button.setAttribute("aria-current", String(viewId === id));
    },
  };
};

const main = async (): Promise<void> => {
  const report = async (message: string): Promise<void> => {
    phase.textContent = message;
    await paint();
  };
  const manor = await createTexturedManorScene({ report });
  await report("Merging draw batches");
  const baked = bakeManor(manor.objects);
  const { scene, camera } = manor;
  const indices = new Map(manor.views.map((view, index) => [view.id, index]));
  const select = (id: string): void => {
    const index = indices.get(id);
    if (index === undefined) throw new Error(`Unknown manor view: ${id}`);
    controls.clear();
    manor.applyView(index);
    manor.target.copy(manor.inspection.target.position);
    rememberView(id);
    views.highlight(id);
  };
  const views = mountViews(manor, select);
  const controls = mountSpectatorControls({
    canvas,
    camera,
    target: manor.target,
    reset: () => select("reference-exterior"),
    changed: () => manor.followLighting(),
    notice: (message) => {
      status.textContent = message;
    },
  });
  const initial = requestedView();
  select(
    initial !== null && indices.has(initial) ? initial : manor.views[0]!.id,
  );
  canvas.setAttribute(
    "aria-label",
    "Medieval manor interactive 3D scene. Click for mouse look; WASD or arrows fly; Space rises, C descends; Shift moves slowly; R resets; Escape releases the mouse.",
  );
  let width = 0;
  let height = 0;
  const mounted = mountViewer(
    canvas,
    scene,
    camera,
    (elapsed) => {
      if (canvas.clientWidth !== width || canvas.clientHeight !== height) {
        width = canvas.clientWidth;
        height = canvas.clientHeight;
        mounted.renderer.setSize(
          Math.max(width, 1),
          Math.max(height, 1),
          false,
        );
        camera.aspect = Math.max(width, 1) / Math.max(height, 1);
        camera.updateProjectionMatrix();
      }
      controls.frame(elapsed);
      // Baked meshes replaced the instance sets; only the light follows the eye.
      manor.followLighting();
      return false;
    },
    {
      pixelRatio: Math.min(window.devicePixelRatio, 1.5),
      preserveDrawingBuffer: true,
    },
  );
  mounted.renderer.setClearColor(0x1c1a18, 1);
  manor.configureRenderer(mounted.renderer);
  const count = new Intl.NumberFormat("en-US");
  sceneReadout.textContent =
    `${count.format(manor.instanceState.prototypes)} shared prototypes placed ` +
    `${count.format(manor.instanceState.drawnInstances)} times · ` +
    `${count.format(baked.before)} authored meshes drawn as ` +
    `${count.format(baked.after)} · ` +
    `${count.format(manor.views.length)} authored views`;
  loading.hidden = true;
  canvas.focus();

  const stop = (): void => {
    controls.dispose();
    views.removeNavigation();
    mounted.stop();
    void manor.disposeTextures();
  };
  window.addEventListener("pagehide", stop, { once: true });
  window.addEventListener("pageshow", (event) => {
    if (event.persisted) location.reload();
  });
};

main().catch(fail);
