/**
 * Display-only development entry. The server supplies published documents and
 * digest keys; a numerical worker evaluates them and product viewports lower
 * their results without copying lighting, mesh or material implementations.
 * Each resident owns a viewport and its GPU buffers. Captures always call
 * finish, so idle animation is unnecessary and never competes with requests.
 * This file owns the page state and the order of a show; each step it orders
 * lives in its own module.
 */
import { serializeHumanPersonDocument } from "@automovie/human";
import type { ConnectedBodyRequest } from "@automovie/playground/src/human/body/ConnectedBodyRequest";
import type { ConnectedBodyResult } from "@automovie/playground/src/human/body/ConnectedBodyResult";
import type { ConnectedFaceRequest } from "@automovie/playground/src/human/common/ConnectedFaceRequest";
import type { ConnectedFaceResult } from "@automovie/playground/src/human/common/ConnectedFaceResult";
import * as THREE from "three";

import type { HumanViewerAddress } from "./HumanViewerAddress";
import type { HumanViewerCatalogue } from "./HumanViewerCatalogue";
import { HumanViewerMixedCompileError } from "./HumanViewerMixedCompileError";
import type { HumanViewerStage } from "./HumanViewerStage";
import type { IHumanViewerComposition } from "./IHumanViewerComposition";
import type { IHumanViewerResident } from "./IHumanViewerResident";
import { addHumanViewerCalibration } from "./addHumanViewerCalibration";
import { admitHumanViewerCatalogue } from "./admitHumanViewerCatalogue";
import { announceHumanViewerAddress } from "./announceHumanViewerAddress";
import { applyHumanViewerVisibility } from "./applyHumanViewerVisibility";
import { assertHumanViewerSingleCompile } from "./assertHumanViewerSingleCompile";
import { buildHumanViewerBodyResident } from "./buildHumanViewerBodyResident";
import { buildHumanViewerFaceResident } from "./buildHumanViewerFaceResident";
import { checkHumanViewerCandidateSource } from "./checkHumanViewerCandidateSource";
import { createHumanViewerCache } from "./createHumanViewerCache";
import { createHumanViewerNumericalPort } from "./createHumanViewerNumericalPort.mjs";
import { createHumanViewerSpans } from "./createHumanViewerSpans";
import { createHumanViewerViewportHost } from "./createHumanViewerViewportHost";
import { createHumanViewerWorkReporter } from "./createHumanViewerWorkReporter";
import { frameHumanViewerAddress } from "./frameHumanViewerAddress";
import { humanViewerProtocol } from "./humanViewerProtocol";
import { parseHumanViewerAddress } from "./parseHumanViewerAddress";
import { readHumanViewerCompiles } from "./readHumanViewerCompiles";
import { readHumanViewerPng } from "./readHumanViewerPng";
import { readHumanViewerShowCatalogue } from "./readHumanViewerShowCatalogue";
import { resizeHumanViewerFrame } from "./resizeHumanViewerFrame";
import { showHumanViewerFirstAddress } from "./showHumanViewerFirstAddress";
import { showHumanViewerReference } from "./showHumanViewerReference";

// Admission is offered as soon as this module has loaded, before any show:
// the host routes the server's admissions here even while this frame is a
// candidate whose first show needs those very documents.
const canvas = document.querySelector<HTMLCanvasElement>("#canvas")!;
const display = document.querySelector<HTMLDivElement>("#display")!;
const status = document.querySelector<HTMLDivElement>("#status")!;
const reference = document.querySelector<HTMLImageElement>("#reference")!;
const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  preserveDrawingBuffer: true,
});
const loader = new THREE.TextureLoader();
/** Where a capture spends its time inside the page, by named stage. */
const spans = createHumanViewerSpans(() => performance.now());
let workingDocument = "";
const work = createHumanViewerWorkReporter(spans, (phase) => ({
  revision: catalogue?.revision ?? "bootstrap",
  frame: new URLSearchParams(location.search).get("generation") ?? "direct",
  doc: workingDocument,
  phase,
  at: Date.now(),
  pending: numerical.pending(),
  geometries: renderer.info.memory.geometries,
  textures: renderer.info.memory.textures,
  residents: residents.keys().length,
  residentBytes: residents.total(),
}));
/** The worker and digest-cache transport the product viewports build through. */
const numerical = createHumanViewerNumericalPort({ work, spans });
// Resident captures read their PNG before starting optional disk work.
// Interactive pages flush after drawing, without awaiting persistence.
const residentCapture = new URLSearchParams(parent.location.search).has(
  "resident",
);
addEventListener("pagehide", () => numerical.dispose(), { once: true });
Object.assign(window, { __humanViewerPersistence: numerical.persistence });
Object.assign(window, {
  __humanViewerAdmit: numerical.admit,
  __humanViewerProtocol: humanViewerProtocol,
});
parent.postMessage({ type: "human:admission" }, location.origin);
let catalogue: HumanViewerCatalogue;
let current: HumanViewerAddress | undefined;
/** Resident key of the frame on screen, which a trim never releases. */
let shownKey = "";
/** The photograph layer of the frame on screen, null while none is shown. */
let composition: IHumanViewerComposition | null = null;
let active: HumanViewerStage;
/**
 * Bytes of resident arrays the page keeps drawn-ready. The renderer's V8 heap
 * lives in a 4 GiB pointer cage, and a resident page that kept 32 documents
 * by count died of a V8 out-of-memory error at about 2.4 GiB of heap while
 * preparing one more. Counted arrays are the bulk of a resident; this budget
 * leaves the rest of the cage for the next document's transient decode,
 * build and preparation copies.
 */
const RESIDENT_BUDGET = 512 * 1024 * 1024;
const residents = createHumanViewerCache<
  IHumanViewerResident<HumanViewerStage>
>(
  RESIDENT_BUDGET,
  (resident) => resident.bytes,
  (resident) => resident.release(),
);

/** Build the resident of one catalogue document through its product viewport. */
const buildResident = (
  selected: HumanViewerCatalogue["documents"][number],
  ao: boolean,
  operation: "preview" | "construct",
): Promise<IHumanViewerResident<HumanViewerStage>> => {
  const host = createHumanViewerViewportHost(canvas, renderer, loader);
  if (selected.domain === "face")
    return buildHumanViewerFaceResident({
      host,
      document: selected.document,
      ao,
      operation,
      worker: () =>
        numerical.port<ConnectedFaceRequest, ConnectedFaceResult>(selected, ao),
    });
  const worker = () =>
    numerical.port<ConnectedBodyRequest, ConnectedBodyResult>(selected, false);
  if (selected.domain === "person")
    return buildHumanViewerBodyResident({
      host,
      document: selected.document,
      serialize: serializeHumanPersonDocument,
      worker,
      operation,
    });
  return buildHumanViewerBodyResident({
    host,
    document: selected.document,
    worker,
    operation,
  });
};

async function show(address: HumanViewerAddress): Promise<void> {
  spans.reset();
  workingDocument = address.doc;
  work("loading");
  // The server's catalogue changes without a source revision: hand-written
  // inputs, candidate sidecars and the published person generation views are
  // read off the request path and republished, which can add a document or
  // change its cache key. Every show therefore reads the current catalogue
  // (about 0.7 MB, milliseconds) instead of trusting the copy the page loaded
  // with; across a newer source revision the page keeps its own catalogue
  // (see `admitHumanViewerCatalogue`). A document still awaiting admission is
  // awaited, not refused (see `readHumanViewerShowCatalogue`).
  catalogue = admitHumanViewerCatalogue(
    catalogue,
    await readHumanViewerShowCatalogue(address.doc),
    address.doc,
  );
  const selected = catalogue.documents.find(
    (entry) => entry.id === address.doc,
  );
  if (selected === undefined) {
    const rejected = catalogue.rejected.find((entry) => entry.id === address.doc);
    throw new Error(rejected?.reason ?? `Unknown document: ${address.doc}`);
  }
  const operation = address.operation ?? "preview";
  const key =
    selected.key +
    (address.ao ? "-ao" : "-direct") +
    (operation === "construct" ? "-construction" : "");
  const start = performance.now();
  status.textContent = "Preparing " + address.doc;
  display.style.width = `${address.size}px`;
  display.style.height = `${address.size}px`;
  let resident = residents.get(key);
  if (resident === undefined) {
    resident = await buildResident(selected, address.ao, operation);
    residents.set(key, resident);
  }
  active = resident.stage;
  shownKey = key;
  // A rig left from an earlier show must not enter this show's framing.
  addHumanViewerCalibration(resident.group, false);
  work("draw");
  resizeHumanViewerFrame(address.size, display, canvas, resident.resize);
  // The stage pairs renderer size with camera projection before fitting.
  active.fitView();
  applyHumanViewerVisibility(active, address);
  frameHumanViewerAddress(active, resident.group, address);
  addHumanViewerCalibration(resident.group, address.calibrate);
  active.finish();
  composition = await showHumanViewerReference({
    address,
    stage: active,
    display,
    canvas,
    reference,
    landmarks: document.querySelector<SVGSVGElement>("#landmarks")!,
  });
  current = address;
  work("idle");
  if (!residentCapture) numerical.persist();
  status.textContent = `${address.doc} • ${address.view} • ${address.pass} • ${(performance.now() - start).toFixed(1)} ms • ${active.renderer()}`;
  if (resident.admission !== undefined)
    status.textContent += ` | Construction draft: ${resident.admission.accepted ? "accepted" : "refused"}, ${resident.admission.failures.length} admission failures`;
}

let queue = Promise.resolve();
const apply = (address: HumanViewerAddress): Promise<void> => {
  const next = queue
    .then(() => show(address))
    .then(() => {
      if (current === undefined) throw new Error("No model has been displayed.");
      announceHumanViewerAddress(current, active);
    });
  queue = next.catch((error: unknown) => {
    status.textContent = error instanceof Error ? error.message : String(error);
  });
  return next;
};
async function main(): Promise<void> {
  // The host's hold ends when this page and its worker have loaded their
  // modules; the build and drawing that follow no longer read source.
  const loaded = numerical.authority();
  void loaded
    .then(() => parent.postMessage({ type: "human:loaded" }, location.origin))
    .catch(() => undefined);
  await checkHumanViewerCandidateSource();
  catalogue = await (await fetch("/docs")).json();
  // A worker that cannot load (a module it imports is missing or broken)
  // fails this candidate at once; the first show would otherwise wait on it
  // forever and never release the host's hold.
  // Interactive pages retain their first-document behavior. A resident
  // service proves code and hardware before any model is explicitly requested.
  if (residentCapture) await loaded;
  else
    await showHumanViewerFirstAddress(
      parseHumanViewerAddress(location.hash),
      apply,
      loaded,
      (message) => console.warn("HUMAN_FIRST_ADDRESS " + message),
    );
  // Publish one browser compile with a separately checked, same-source Node realm.
  assertHumanViewerSingleCompile(
    readHumanViewerCompiles(),
    await numerical.authority(),
    catalogue.revision,
  );
  await checkHumanViewerCandidateSource();
  addEventListener("hashchange", () => {
    void apply(parseHumanViewerAddress(location.hash));
  });
  Object.assign(window, {
    __humanViewer: {
      show: apply,
      parts: () => current === undefined ? [] : active.observe.parts(),
      renderer: () => {
        const gl = renderer.getContext();
        const device = gl.getExtension("WEBGL_debug_renderer_info");
        return String(gl.getParameter(device?.UNMASKED_RENDERER_WEBGL ?? gl.RENDERER));
      },
      revision: () => catalogue.revision,
      builds: numerical.builds,
      buildMs: numerical.buildMs,
      spans: () => spans.snapshot(),
      address: () => {
        if (current === undefined) throw new Error("No model has been displayed.");
        return current;
      },
      admission: () => residents.get(shownKey)?.admission ?? null,
      rigReading: () => residents.get(shownKey)?.rigReading,
      exportConstruction: async () => {
        const address = current;
        if (address === undefined) throw new Error("No model has been displayed.");
        const selected = catalogue.documents.find((entry) => entry.id === address.doc);
        const resident = residents.get(shownKey);
        if (selected?.domain !== "person" || address.operation !== "construct" ||
            resident?.exportConstruction === undefined)
          throw new Error("Static construction export requires the displayed paired Person construction.");
        try {
          return await resident.exportConstruction();
        } finally {
          work("idle");
        }
      },
      periocularMappings: () => residents.get(shownKey)?.periocularMappings,
      png: () => {
        if (current === undefined) throw new Error("No model has been displayed.");
        const png = readHumanViewerPng({
          stage: active,
          renderer,
          canvas,
          composition,
          photo: reference,
        });
        numerical.persist();
        return png;
      },
      evict: () => residents.evictOldest(shownKey),
    },
  });
  parent.postMessage({ type: "human:ready" }, location.origin);
  // A human orbit is display-only. Finish on demand and while the pointer moves.
  canvas.addEventListener("pointermove", () => {
    if (current !== undefined) active.finish();
  });
  canvas.addEventListener("wheel", () => {
    if (current !== undefined) requestAnimationFrame(() => active.finish());
  });
}
if (import.meta.hot) import.meta.hot.accept();
void main().catch((error: unknown) => {
  status.textContent = error instanceof Error ? error.message : String(error);
  // A candidate that mixed compiles is started again by the host at once.
  parent.postMessage(
    {
      type: "human:error",
      error: status.textContent,
      restart: error instanceof HumanViewerMixedCompileError,
    },
    location.origin,
  );
});
