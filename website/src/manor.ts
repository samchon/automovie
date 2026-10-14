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
import { runWebsiteAsyncCleanup } from "./internal/runWebsiteAsyncCleanup";
import { runWebsiteCleanup } from "./internal/runWebsiteCleanup";

const VIEW_PARAMETER: string = "view";

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

const element: <T extends Element>(selector: string) => T = <T extends Element>(selector: string): T => {
  const found: T | null = document.querySelector<T>(selector);
  if (found === null)
    throw new Error(`The manor page is missing its ${selector} element.`);
  return found;
};

const canvas: HTMLCanvasElement = element<HTMLCanvasElement>("#view");
const status: HTMLDivElement = element<HTMLDivElement>("#status");
const loading: HTMLDivElement = element<HTMLDivElement>("#loading");
const phase: HTMLDivElement = element<HTMLDivElement>("#phase");
const featured: HTMLDivElement = element<HTMLDivElement>("#featured");
const panel: HTMLElement = element<HTMLElement>("#panel");
const sceneReadout: HTMLDivElement = element<HTMLDivElement>("#scene");
const panelToggle: HTMLButtonElement = element<HTMLButtonElement>("#panel-toggle");

// A phone screen cannot hold the scene and the whole panel; it opens folded.
const setPanelCollapsed: (collapsed: boolean) => void = (collapsed: boolean): void => {
  panel.classList.toggle("collapsed", collapsed);
  panelToggle.textContent = collapsed ? "Show" : "Hide";
  panelToggle.setAttribute("aria-expanded", String(!collapsed));
};
setPanelCollapsed(window.matchMedia("(max-width: 720px)").matches);
panelToggle.addEventListener("click", (): void =>
  setPanelCollapsed(!panel.classList.contains("collapsed")),
);

const fail: (error: unknown) => void = (error: unknown): void => {
  console.error("Manor failed.", error);
  loading.hidden = false;
  loading.classList.add("failed");
  phase.textContent =
    "The manor could not be built.\n" +
    (error instanceof Error ? error.message : String(error));
};

/** Let the browser paint the phase message before synchronous geometry work. */
const paint: () => Promise<void> = (): Promise<void> =>
  new Promise<undefined>((resolve: (value: undefined) => void): void => {
    requestAnimationFrame((): ReturnType<typeof setTimeout> => setTimeout((): void => resolve(undefined), 0));
  });

const requestedView: () => string | null = (): string | null =>
  new URLSearchParams(window.location.search).get(VIEW_PARAMETER);

const rememberView: (id: string) => void = (id: string): void => {
  const url: URL = new URL(window.location.href);
  url.searchParams.set(VIEW_PARAMETER, id);
  window.history.replaceState(null, "", url);
};

/** Mount the authored view shortlist and searchable navigation. Disposal retires selection and highlight authority before attempting each listener removal and native navigation cleanup; a saved failure is reported without repeating those effects. */
const mountViews: (manor: IManorScene, select: (id: string) => void) => { removeNavigation: () => void; highlight: (id: string) => void } = (
  manor: IManorScene,
  select: (id: string) => void,
): { removeNavigation: () => void; highlight: (id: string) => void } => {
  const indices: Map<string, number> = new Map(manor.views.map((view: IManorScene["views"][number], index: number): [string, number] => [view.id, index]));
  const buttons: Map<string, HTMLButtonElement> = new Map<string, HTMLButtonElement>();
  const cleanups: (() => void)[] = [];
  let disposed: boolean = false;
  const failures: unknown[] = [];
  const dispose: () => void = (): void => {
    if (disposed) {
      if (failures.length !== 0) throw failures[0];
      return;
    }
    disposed = true;
    try { runWebsiteCleanup(cleanups.splice(0)); }
    catch (error) {
      failures.push(error);
      throw error;
    }
  };
  try {
  for (const item of FEATURED) {
    if (!indices.has(item.id)) continue;
    const button: HTMLButtonElement = document.createElement("button");
    button.type = "button";
    button.textContent = item.label;
    const click: () => void = (): void => {
      if (!disposed) select(item.id);
    };
    button.addEventListener("click", click);
    cleanups.push((): void => button.removeEventListener("click", click));
    buttons.set(item.id, button);
    featured.append(button);
  }
  const roomNames: Map<string, string> = new Map(
    manor.manifest.rooms.map((room: IManorScene["manifest"]["rooms"][number]): [string, string] => [room.id, room.label]),
  );
  const removeNavigation: () => void = mountPreviewNavigation({
    items: manor.views.map((view: IManorScene["views"][number]): { id: string; label: string; group: string; keywords: string[] } => ({
      id: view.id,
      label: view.id,
      group: roomNames.get(view.room ?? "") ?? view.object ?? "Views",
      keywords: [view.room ?? "", view.object ?? ""],
    })),
    apply: (id: string): void => { if (!disposed) select(id); },
  });
  cleanups.push(removeNavigation);
  // The navigator appends itself to the body; the showcase keeps one panel.
  panel.insertBefore(element("#preview-navigation"), element("#keys"));
  return {
    removeNavigation: dispose,
    highlight: (id: string): void => {
      if (disposed) return;
      for (const [viewId, button] of buttons)
        button.setAttribute("aria-current", String(viewId === id));
    },
  };
  } catch (error) {
    runWebsiteCleanup([dispose], [error]);
    throw error;
  }
};

const main: () => Promise<void> = async (): Promise<void> => {
  const report: (message: string) => Promise<void> = async (message: string): Promise<void> => {
    phase.textContent = message;
    await paint();
  };
  const manor: Awaited<ReturnType<typeof createTexturedManorScene>> = await createTexturedManorScene({ report });
  const cleanups: ((() => void) | (() => Promise<void>))[] = [manor.disposeTextures];
  let stopping: Promise<void> | null = null;
  const stop: () => Promise<void> = (): Promise<void> => {
    if (stopping !== null) return stopping;
    stopping = runWebsiteAsyncCleanup(cleanups.splice(0));
    return stopping;
  };
  try {
  await report("Merging draw batches");
  const baked: ReturnType<typeof bakeManor> = bakeManor(manor.objects);
  const { scene, camera }: Pick<typeof manor, "scene" | "camera"> = manor;
  const indices: Map<string, number> = new Map(manor.views.map((view: IManorScene["views"][number], index: number): [string, number] => [view.id, index]));
  const select: (id: string) => void = (id: string): void => {
    const index: number | undefined = indices.get(id);
    if (index === undefined) throw new Error(`Unknown manor view: ${id}`);
    controls.clear();
    manor.applyView(index);
    manor.target.copy(manor.inspection.target.position);
    rememberView(id);
    views.highlight(id);
  };
  const views: ReturnType<typeof mountViews> = mountViews(manor, select);
  cleanups.unshift(views.removeNavigation);
  const controls: ReturnType<typeof mountSpectatorControls> = mountSpectatorControls({
    canvas,
    camera,
    target: manor.target,
    reset: (): void => select("reference-exterior"),
    changed: (): void => manor.followLighting(),
    notice: (message: string): void => {
      status.textContent = message;
    },
  });
  cleanups.unshift(controls.dispose);
  const initial: string | null = requestedView();
  select(
    initial !== null && indices.has(initial) ? initial : manor.views[0]!.id,
  );
  canvas.setAttribute(
    "aria-label",
    "Medieval manor interactive 3D scene. Click for mouse look; WASD or arrows fly; Space rises, C descends; Shift moves slowly; R resets; Escape releases the mouse.",
  );
  let width: number = 0;
  let height: number = 0;
  const mounted: ReturnType<typeof mountViewer> = mountViewer(
    canvas,
    scene,
    camera,
    (elapsed: number): boolean => {
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
  cleanups.splice(2, 0, mounted.stop);
  mounted.renderer.setClearColor(0x1c1a18, 1);
  manor.configureRenderer(mounted.renderer);
  const count: Intl.NumberFormat = new Intl.NumberFormat("en-US");
  sceneReadout.textContent =
    `${count.format(manor.instanceState.prototypes)} shared prototypes placed ` +
    `${count.format(manor.instanceState.drawnInstances)} times · ` +
    `${count.format(baked.before)} authored meshes drawn as ` +
    `${count.format(baked.after)} · ` +
    `${count.format(manor.views.length)} authored views`;
  loading.hidden = true;
  canvas.focus();

  window.addEventListener("pagehide", (): void => {
    void stop().catch(fail);
  }, { once: true });
  window.addEventListener("pageshow", (event: PageTransitionEvent): void => {
    if (event.persisted) location.reload();
  });
  } catch (error) {
    await runWebsiteAsyncCleanup([stop], [error]);
    throw error;
  }
};

main().catch(fail);
