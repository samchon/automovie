import { mountViewer, type IAutoMovieViewerHandle } from "@automovie/viewer";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { LabCase } from "./LabCase";
import { LabDefenseCase } from "./LabDefenseCase";
import { LabCombinationCase } from "./LabCombinationCase";
import type { LabPlayable } from "./LabPlayable";
import { LabFailure } from "./LabFailure";
import type { LabSettings } from "./LabSettings";
import { LabTransport } from "./LabTransport";
import { LabActor } from "./LabActor";
import "./lab.css";

/** Laboratory build identity; every inspection exposes the actual mounted consumer. */
const version: string = "motion-module-lab-013";
/** The dedicated laboratory owns this mount, independent of the retained film candidate. */
const app: HTMLElement | null = document.getElementById("app");
if (!app) throw new Error("Missing motion laboratory mount");
app.innerHTML = `<main><h1>Kickboxing motion modules</h1><p>${version} · original polygon · one reusable action, two independent actors</p><div class="layout"><div><div class="viewport"><canvas id="view" aria-label="Original polygon motion module laboratory"></canvas></div><div class="transport"><button id="play">Play</button><button id="pause">Pause</button><button id="reset">Reset time</button><input id="seek" type="range" min="0" max="1" step="any" value="0" aria-label="Local action time"><output id="time"></output><select id="speed" aria-label="Playback speed"><option value="1">1×</option><option value="0.5">0.5×</option><option value="0.25">0.25×</option></select><button id="side-view">Side view</button><button id="oblique-view">Oblique view</button><button id="feet-view">Feet view</button><button id="snapshot">Save current image</button></div><div id="status" class="status">Preparing the public Viewer and original polygon actors.</div><p id="error" role="alert"></p></div><section class="inputs"><label>Requested action<select id="action"><option>jab</option><option>cross</option><option>hook</option><option>uppercut</option><option>low-kick</option><option>body-kick</option><option>high-kick</option><option>step</option><option>defense</option><option>one-two</option><option>blocked-one-two</option></select></label><label>Requested actor<select id="actor"><option value="a">A · red</option><option value="b">B · cyan</option></select></label><label>Limb<select id="side"><option>left</option><option>right</option></select></label><label>Receiving surface<select id="target"><option>guard</option><option>body</option><option>head</option><option>leg</option><option>miss</option></select></label><label>Defense<select id="defense"><option>cover</option><option>catch</option><option>parry</option><option>slip</option><option>weave</option><option>check</option><option>none</option></select></label><label>Root distance / m<input id="distance" type="number" min="0.4" max="2.5" step="0.05" value="1.1"></label><label>Seed<input id="seed" type="number" min="0" max="4294967295" step="1" value="17"></label><label>Aim bound / m<input id="aim" type="number" min="0" max="0.2" step="0.005" value="0"></label><label>Time variation<input id="timingVariation" type="number" min="0" max="0.5" step="0.01" value="0"></label><label>Timing scale<input id="timingScale" type="number" min="0.25" max="3" step="0.05" value="1"></label><label>Side direction<input id="direction" type="number" min="-1" max="1" step="0.05" value="0"></label><label>Supported entry<input id="entry" type="checkbox" checked></label><button id="apply">Restart movement</button><p class="limits">Changes load immediately. Review either fighter at normal or slow speed, then seek to inspect contact, recovery and feet. Use Home/End for the exact interval endpoints; arrow keys move 1 ms. A startup URL such as ?start=0.1&amp;end=0.3 selects a closed playback segment. Controls describe the requested selection. A refusal pauses playback and keeps the previous loaded action, or the initial stance if none was loaded; the status names the displayed action. The measurements retain the failed request separately.</p></section></div><details><summary>Actual world, contact and support measurements</summary><button id="inspect">Refresh measurements</button><pre id="measurements"></pre></details></main>`;

/**
 * Find a dedicated laboratory control or fail visibly during initialization.
 */
function element<T extends HTMLElement>(selector: string): T {
  const result: T | null = app!.querySelector<T>(selector);
  if (!result) throw new Error(`Missing laboratory control ${selector}`);
  return result;
}

/** Owned native scene, using public Viewer mounting and no film timeline. */
const scene: THREE.Scene = new THREE.Scene();
scene.background = new THREE.Color(0x101722);
/** Free camera remains usable during initialization and module failures. */
const camera: THREE.PerspectiveCamera = new THREE.PerspectiveCamera(43, 1, .02, 30);
/** Real orbit controls inspect bodies, supporting feet and inter-actor distance. */
const controls: OrbitControls = new OrbitControls(camera, element<HTMLCanvasElement>("#view"));
camera.position.set(1.7, 2.1, 4.2);
controls.target.set(0, .9, 0);
controls.update();
scene.add(new THREE.HemisphereLight(0xe2efff, 0x554d46, 2.1));
/** Raking light exposes limb overlap and foot-floor separation. */
const light: THREE.DirectionalLight = new THREE.DirectionalLight(0xffefdd, 3);
light.position.set(2, 6, 4);
scene.add(light);
/** No ropes obscure module support or contact inspection. */
const floorGeometry: THREE.BoxGeometry = new THREE.BoxGeometry(6, .1, 5);
/** The only laboratory floor material is owned by this host. */
const floorMaterial: THREE.MeshStandardMaterial = new THREE.MeshStandardMaterial({ color: 0xabb4b9, roughness: .95 });
/** Visible top is exactly world Y zero, matching Grounding's plane. */
const floor: THREE.Mesh = new THREE.Mesh(floorGeometry, floorMaterial);
floor.position.y = -.05;
scene.add(floor);
/** Metric grid is scenery, never a hidden substitute for actual support geometry. */
const grid: THREE.GridHelper = new THREE.GridHelper(6, 12, 0x4b596a, 0x7c8995);
grid.position.y = .0005;
scene.add(grid);

/** Current module case, replaced only through explicit selection. */
let current: LabPlayable | undefined;
/** One local playback clock, independent of renderer elapsed time. */
let transport: LabTransport | undefined;
/** The host owns exactly two reusable real actors; each case borrows and resets them. */
let actors: Record<"a" | "b", LabActor> | undefined;
/** Requested selection and loaded display are published as separate synchronous outcomes. */
let selection: { status: "empty" | "loading" | "loaded" | "failed"; requested?: LabSettings; loaded?: LabSettings; failed?: { settings: LabSettings; message: string; cause?: unknown; case?: object }; display: "initial-stance" | "loaded-action" } = { status: "empty", display: "initial-stance" };
/** Paused views redraw only after actual scene, camera or viewport changes. */
let dirty: boolean = true;
/** Last draw CPU scheduling cost, distinct from module sampling work. */
let drawMs: number = 0;
/** Latest real sampling cost measured by the host. */
let motionMs: number = 0;
/** Count completed native draws rather than elapsed-time logs. */
let frames: number = 0;

/**
 * Publish actual timing and current action/contact state after a completed draw.
 */
function status(): void {
  const loaded: boolean = selection.status === "loaded" && current !== undefined && transport !== undefined;
  for (const id of ["#play", "#pause", "#reset", "#seek"] as const) element<HTMLButtonElement | HTMLInputElement>(id).disabled = !loaded;
  if (!current || !transport) {
    element("#status").textContent = selection.status === "failed" ? `No action loaded. ${selection.failed?.settings.action} was refused. The initial stance is displayed; playback is stopped.` : "Preparing the original polygon actors.";
    element<HTMLOutputElement>("#time").value = "No action loaded";
    return;
  }
  element<HTMLInputElement>("#seek").min = String(transport.start);
  element<HTMLInputElement>("#seek").max = String(transport.end);
  element<HTMLInputElement>("#seek").value = String(transport.seconds);
  element<HTMLOutputElement>("#time").value = `${transport.seconds.toFixed(3)} / ${transport.duration.toFixed(3)} s`;
  element("#status").textContent = selection.failed ? `${selection.failed.settings.action} was refused. Still showing ${current.settings.action}, paused.\n${current.summary()}` : current.summary();
}

/**
 * Native draw and public completion remain the single actual capture boundary.
 */
function draw(): void {
  controls.update();
  const begun: number = performance.now();
  handle.renderer.render(scene, camera);
  drawMs = performance.now() - begun;
  frames++;
  handle.completeFrame(transport?.seconds ?? 0);
  status();
  dirty = false;
}

/** Keep the public Viewer alive even when a selected motion case refuses. */
const handle: IAutoMovieViewerHandle = mountViewer(element("#view"), scene, camera, (): boolean => {
  try { if (transport?.playing) { transport.tick(); dirty = true; } } catch (error: unknown) { report(error); }
  if (dirty) draw();
  return true;
}, { pixelRatio: 1, redrawCompleted: (seconds: number): void => { if (transport && transport.seconds !== seconds) transport.seek(seconds); draw(); }, freezeCompleted: (): ((resume: boolean) => void) => { const playing: boolean = transport?.playing ?? false; transport?.pause(); return (resume: boolean): void => { if (resume && playing) transport?.play(); }; } });
controls.addEventListener("change", (): void => { dirty = true; });

/**
 * Expose failures without erasing the previously working module case or Viewer.
 */
function report(error: unknown): void {
  transport?.pause();
  element("#error").textContent = error instanceof Error ? error.message : String(error);
  console.error(error);
  dirty = true;
}

/**
 * Read explicit real controls; action constructors validate their own semantic bounds.
 */
function readSettings(): LabSettings {
  return {
    action: element<HTMLSelectElement>("#action").value as LabSettings["action"], actor: element<HTMLSelectElement>("#actor").value as LabSettings["actor"], side: element<HTMLSelectElement>("#side").value as LabSettings["side"], target: element<HTMLSelectElement>("#target").value as LabSettings["target"], defense: element<HTMLSelectElement>("#defense").value as LabSettings["defense"],
    distance: Number(element<HTMLInputElement>("#distance").value), seed: Number(element<HTMLInputElement>("#seed").value), aim: Number(element<HTMLInputElement>("#aim").value), timingVariation: Number(element<HTMLInputElement>("#timingVariation").value), timingScale: Number(element<HTMLInputElement>("#timingScale").value), direction: Number(element<HTMLInputElement>("#direction").value),
    entry: element<HTMLInputElement>("#entry").checked,
  };
}

/** Keep real controls synchronized with cases selected through the public automation seam. */
function writeSettings(settings: LabSettings): void {
  for (const name of ["action", "actor", "side", "target", "defense", "distance", "seed", "aim", "timingVariation", "timingScale", "direction"] as const) element<HTMLInputElement | HTMLSelectElement>(`#${name}`).value = String(settings[name]);
  element<HTMLInputElement>("#entry").checked = settings.entry ?? false;
}

/**
 * Replace one complete case after successful construction, preserving Viewer health on refusal.
 *
 */
function select(settings: LabSettings): void {
  transport?.pause();
  const previous: LabPlayable | undefined = current;
  const previousTransport: LabTransport | undefined = transport;
  selection = { status: "loading", requested: structuredClone(settings), loaded: current?.settings, display: current ? "loaded-action" : "initial-stance" };
  writeSettings(settings);
  let next: LabPlayable | undefined;
  let restore: (() => void)[] = [];
  try {
    if (!actors) {
      const a: LabActor = new LabActor("a", "a", -settings.distance / 2, 0);
      try { actors = { a, b: new LabActor("b", "b", settings.distance / 2, Math.PI) }; }
      catch (error: unknown) { a.dispose(); throw error; }
      scene.add(actors.a.person.object, actors.b.person.object);
    }
    restore = Object.values(actors).map((actor: LabActor): (() => void) => actor.checkpoint());
    next = settings.action === "defense" ? new LabDefenseCase(settings, actors) : settings.action === "one-two" || settings.action === "blocked-one-two" ? new LabCombinationCase(settings, actors) : new LabCase(settings, actors);
    if (next.admissionError) throw new Error(next.admissionError);
    const loadedCase: LabPlayable = next;
    const bounds: { start: number; end: number } = LabTransport.bounds(next.duration, current ? new URLSearchParams() : new URLSearchParams(window.location.search));
    const nextTransport: LabTransport = new LabTransport(next.duration, (seconds: number): void => {
      const begun: number = performance.now();
      loadedCase.evaluate(seconds);
      motionMs = performance.now() - begun;
    }, bounds);
    nextTransport.seek(nextTransport.start);
    current = next; transport = nextTransport;
    selection = { status: "loaded", requested: structuredClone(settings), loaded: next.settings, display: "loaded-action" };
    writeSettings(next.settings);
    element("#error").textContent = "";
    state.ready = true;
    draw();
    previous?.dispose();
  } catch (error: unknown) {
    const failedCase: object | undefined = next?.inspect();
    next?.dispose();
    for (const rollback of restore) rollback();
    current = previous; transport = previousTransport;
    const failure: Error = LabFailure.error("selection", error, { requested: settings, loaded: current?.settings, failedCase });
    selection = { status: "failed", requested: structuredClone(settings), loaded: current?.settings, failed: { settings: structuredClone(settings), message: failure.message, cause: structuredClone(failure.cause), case: failedCase }, display: current ? "loaded-action" : "initial-stance" };
    state.ready = false;
    report(failure); draw();
    throw failure;
  }
}

/** Public laboratory inspection seam consumed by the independent actual browser review. */
const state: { version: string; ready: boolean; select: (settings: LabSettings) => void; seek: (seconds: number) => void; play: () => void; pause: () => void; setSpeed: (speed: number) => void; measureRates: (seconds: number, side: "left" | "right", oneSided: "before" | "after") => object; inspect: () => object } = {
  version, ready: false, select,
  seek: (seconds: number): void => { LabTransport.requireLoaded(transport, selection.status === "loaded").seek(seconds); draw(); },
  play: (): void => { LabTransport.requireLoaded(transport, selection.status === "loaded").play(); },
  pause: (): void => { transport?.pause(); },
  setSpeed: (speed: number): void => { if (![.25, .5, 1].includes(speed)) throw new Error("Supported speeds are .25, .5 and 1"); LabTransport.requireLoaded(transport, selection.status === "loaded").speed = speed; element<HTMLSelectElement>("#speed").value = String(speed); },
  measureRates: (seconds: number, side: "left" | "right", oneSided: "before" | "after"): object => { LabTransport.requireLoaded(transport, selection.status === "loaded"); if (!(current instanceof LabCombinationCase)) throw new Error("Actual overlap rates require a loaded combination case"); return current.ratesAt(seconds, side, 1 / 2400, oneSided); },
  inspect: (): object => structuredClone({ version, ready: state.ready, selection, settings: current?.settings, duration: current?.duration, transport: transport ? { seconds: transport.seconds, start: transport.start, end: transport.end, playing: transport.playing, speed: transport.speed } : null, case: current?.inspect(), displayedActors: !current && actors ? { a: actors.a.inspect(), b: actors.b.inspect() } : undefined, performance: { drawCpuMs: drawMs, motionCpuMs: motionMs, completedDraws: frames, triangles: handle.renderer.info.render.triangles, calls: handle.renderer.info.render.calls }, review: { movingPicture: "not-watched", listening: "no-audio-in-module-lab", forceSimulation: false } }),
};
Reflect.set(window, "__motionLab", state);
Reflect.set(window, "__afSeek", state.seek);
element("#play").addEventListener("click", (): void => { try { state.play(); } catch (error: unknown) { report(error); } });
element("#pause").addEventListener("click", state.pause);
element("#reset").addEventListener("click", (): void => { try { state.seek(transport?.start ?? 0); } catch (error: unknown) { report(error); } });
element("#seek").addEventListener("input", (): void => { try { state.seek(Number(element<HTMLInputElement>("#seek").value)); } catch (error: unknown) { report(error); } });
element("#seek").addEventListener("keydown", (event: KeyboardEvent): void => { if (!["Home", "End", "ArrowLeft", "ArrowDown", "ArrowRight", "ArrowUp", "PageDown", "PageUp"].includes(event.key)) return; event.preventDefault(); try { LabTransport.requireLoaded(transport, selection.status === "loaded").move(event.key); draw(); } catch (error: unknown) { report(error); } });
element("#speed").addEventListener("change", (): void => { try { state.setSpeed(Number(element<HTMLSelectElement>("#speed").value)); } catch (error: unknown) { report(error); } });
element("#apply").addEventListener("click", (): void => { try { select(readSettings()); } catch (error: unknown) { report(error); } });
for (const name of ["action", "actor", "side", "target", "defense", "distance", "seed", "aim", "timingVariation", "timingScale", "direction", "entry"] as const) element(`#${name}`).addEventListener("change", (): void => {
  if (name === "action") {
    const action: string = element<HTMLSelectElement>("#action").value;
    const target: HTMLSelectElement = element("#target");
    if (action === "low-kick") target.value = "leg";
    else if (action === "high-kick") target.value = "head";
    else if (action === "body-kick" || target.value === "leg") target.value = "body";
  }
  try { select(readSettings()); } catch (error: unknown) { report(error); }
});
element("#inspect").addEventListener("click", (): void => { element("#measurements").textContent = JSON.stringify(state.inspect(), null, 2); });
element("#side-view").addEventListener("click", (): void => { camera.position.set(0, 1.3, 3.3); controls.target.set(0, .9, 0); controls.update(); });
element("#oblique-view").addEventListener("click", (): void => { camera.position.set(1.7, 2.1, 4.2); controls.target.set(0, .9, 0); controls.update(); });
element("#feet-view").addEventListener("click", (): void => { camera.position.set(.3, .6, 2.3); controls.target.set(0, .15, 0); controls.update(); });
element("#snapshot").addEventListener("click", (): void => {
  transport?.pause(); draw();
  const link: HTMLAnchorElement = document.createElement("a");
  link.download = `${version}-${(transport?.seconds ?? 0).toFixed(3)}.png`;
  link.href = element<HTMLCanvasElement>("#view").toDataURL("image/png");
  link.click();
});
document.addEventListener("visibilitychange", (): void => { if (document.hidden) transport?.pause(); });
window.addEventListener("pagehide", (): void => {
  transport?.pause(); handle.stop(); controls.dispose(); current?.dispose();
  for (const actor of Object.values(actors ?? {})) actor.dispose();
  floorGeometry.dispose(); floorMaterial.dispose(); grid.dispose();
}, { once: true });
try { select(readSettings()); } catch (error: unknown) { report(error); }

