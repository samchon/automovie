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
import type { ConnectedBodyRequest } from "@automovie/human/body/runtime/ConnectedBodyRequest";
import type { ConnectedBodyResult } from "@automovie/human/body/runtime/ConnectedBodyResult";
import type { ConnectedFaceRequest } from "@automovie/human/face/runtime/ConnectedFaceRequest";
import type { ConnectedFaceResult } from "@automovie/human/face/runtime/ConnectedFaceResult";
import * as THREE from "three";

import { createAutoMovieResourceRetirement } from "../../createAutoMovieResourceRetirement.js";
import type { HumanViewerAddress } from "./HumanViewerAddress.js";
import type { HumanViewerCatalogue } from "./HumanViewerCatalogue.js";
import { HumanViewerGpuContextLostError } from "./HumanViewerGpuContextLostError.js";
import { HumanViewerMixedCompileError } from "./HumanViewerMixedCompileError.js";
import { HumanViewerNodeSourceChangedError } from "./HumanViewerNodeSourceChangedError.js";
import type { HumanViewerStage } from "./HumanViewerStage.js";
import type { IHumanViewerComposition } from "./IHumanViewerComposition.js";
import type { IHumanViewerResident } from "./IHumanViewerResident.js";
import { addHumanViewerCalibration } from "./addHumanViewerCalibration.js";
import { admitHumanViewerCatalogue } from "./admitHumanViewerCatalogue.js";
import { announceHumanViewerAddress } from "./announceHumanViewerAddress.js";
import { applyHumanViewerVisibility } from "./applyHumanViewerVisibility.js";
import { assertHumanViewerFrame } from "./assertHumanViewerFrame.js";
import { assertHumanViewerSingleCompile } from "./assertHumanViewerSingleCompile.js";
import { buildHumanViewerBodyResident } from "./buildHumanViewerBodyResident.js";
import { buildHumanViewerFaceResident } from "./buildHumanViewerFaceResident.js";
import { checkHumanViewerCandidateSource } from "./checkHumanViewerCandidateSource.js";
import { createHumanViewerCache } from "./createHumanViewerCache.js";
import { createHumanViewerDisplaySave } from "./createHumanViewerDisplaySave.js";
import { createHumanViewerGpuDisplay } from "./createHumanViewerGpuDisplay.js";
import { createHumanViewerNumericalPort } from "./createHumanViewerNumericalPort.js";
import { createHumanViewerSpans } from "./createHumanViewerSpans.js";
import { createHumanViewerViewportHost } from "./createHumanViewerViewportHost.js";
import { createHumanViewerWorkReporter } from "./createHumanViewerWorkReporter.js";
import { frameHumanViewerAddress } from "./frameHumanViewerAddress.js";
import { humanViewerProtocol } from "./humanViewerProtocol.js";
import { parseHumanViewerAddress } from "./parseHumanViewerAddress.js";
import { readHumanViewerCameraAddress } from "./readHumanViewerCameraAddress.js";
import { readHumanViewerCompiles } from "./readHumanViewerCompiles.js";
import { readHumanViewerPng } from "./readHumanViewerPng.js";
import { readHumanViewerShowCatalogue } from "./readHumanViewerShowCatalogue.js";
import { resizeHumanViewerFrame } from "./resizeHumanViewerFrame.js";
import { serializeHumanViewerAddress } from "./serializeHumanViewerAddress.js";
import { showHumanViewerFirstAddress } from "./showHumanViewerFirstAddress.js";
import { showHumanViewerReference } from "./showHumanViewerReference.js";

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
// History-cache suspension preserves the page's owners until terminal navigation.
addEventListener("pagehide", (event: PageTransitionEvent): void => {
  if (!event.persisted) numerical.dispose();
});
Object.assign(window, { __humanViewerPersistence: numerical.persistence });
Object.assign(window, {
  __humanViewerAdmit: numerical.admit,
  __humanViewerProtocol: humanViewerProtocol,
});
parent.postMessage({ type: "human:admission" }, location.origin);
let catalogue: HumanViewerCatalogue;
let current: HumanViewerAddress | undefined;
/** One failed resident restoration is reported with readiness, never retried automatically. */
let restoreError: string | undefined;
/** Resident key of the frame on screen, which a trim never releases. */
let shownKey = "";
/** The photograph layer of the frame on screen, null while none is shown. */
let composition: IHumanViewerComposition | null = null;
let active: HumanViewerStage;
/** Pending display changes have no authority to save a frame or accept gestures. */
let changingDisplay = false;
/** Status paired with the last completed model; preparation never replaces it. */
let completedStatus = "";
/** Native restoration repairs a graphics refusal, never a source refusal. */
let graphicsStatusFailed = false;
const gpuDisplay = createHumanViewerGpuDisplay({
  canvas,
  display,
  redraw: () => {
    if (current === undefined) return;
    // Context restoration recreates shadow storage while each viewport keeps
    // its completed-refresh flag; invalidate that original owner's maps.
    active.setShadows(current.shadows);
    active.finish();
    const gl = renderer.getContext();
    if (gl.isContextLost())
      throw new HumanViewerGpuContextLostError(
        "The display GPU context is still lost.",
      );
    assertHumanViewerFrame(gl.getError(), gl.NO_ERROR);
    if (graphicsStatusFailed) {
      status.textContent = completedStatus;
      graphicsStatusFailed = false;
    }
    announceHumanViewerAddress(current, active);
    displaySave.changed();
  },
  failed: (message) =>
    parent.postMessage(
      { type: "human:error", error: message },
      location.origin,
    ),
});
const displaySave = createHumanViewerDisplaySave({
  canvas,
  renderer,
  stage: () => active,
  address: () => (changingDisplay ? undefined : current),
  revision: () => catalogue.revision,
  composition: () => composition,
  photo: reference,
  retain: gpuDisplay.retain,
});
addEventListener("message", (event: MessageEvent<unknown>) => {
  if (
    event.origin !== location.origin ||
    event.source !== parent ||
    residentCapture
  )
    return;
  const value = event.data;
  if (
    value !== null &&
    typeof value === "object" &&
    "type" in value &&
    value.type === "human:committed" &&
    "session" in value &&
    typeof value.session === "string" &&
    "generation" in value &&
    typeof value.generation === "number"
  )
    displaySave.commit(value.session, value.generation);
});
addEventListener("pagehide", (event: PageTransitionEvent): void => {
  if (!event.persisted) displaySave.dispose();
});
addEventListener("pagehide", (event: PageTransitionEvent): void => {
  if (!event.persisted) gpuDisplay.dispose();
});
/**
 * Conventional 512 MiB counted-array weight for retained drawn-ready residents. The accountant omits textures, object headers and other native/heap storage, while preparation can retain transient copies, so this policy is not a measured physical memory bound or a guarantee against allocation failure.
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
  if (renderer.getContext().isContextLost())
    throw new HumanViewerGpuContextLostError(
      "The display GPU context is lost.",
    );
  await residents.settleRetirements();
  spans.reset();
  workingDocument = address.doc;
  work("loading");
  // The server's catalogue changes without a source revision: hand-written
  // inputs, candidate sidecars and the published person generation views are
  // read off the request path and republished, which can add a document or
  // change its cache key. Every show therefore reads the current catalogue
  // instead of trusting the copy the page loaded
  // with; across a newer source revision the page keeps its own catalogue
  // (see `admitHumanViewerCatalogue`). A document still awaiting admission is
  // awaited, not refused (see `readHumanViewerShowCatalogue`).
  catalogue = admitHumanViewerCatalogue(
    catalogue,
    await readHumanViewerShowCatalogue(address.doc, catalogue.revision),
    address.doc,
  );
  const selected = catalogue.documents.find(
    (entry) => entry.id === address.doc,
  );
  if (selected === undefined) {
    const rejected = catalogue.rejected.find(
      (entry) => entry.id === address.doc,
    );
    throw new Error(rejected?.reason ?? `Unknown document: ${address.doc}`);
  }
  const operation = address.operation ?? "preview";
  const key =
    selected.key +
    (address.ao ? "-ao" : "-direct") +
    (operation === "construct" ? "-construction" : "");
  const start = performance.now();
  status.textContent = "Preparing " + address.doc;
  let resident = residents.get(key);
  const created = resident === undefined;
  if (resident === undefined) {
    resident = await buildResident(selected, address.ao, operation);
  }
  try {
    active = resident.stage;
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
    const gl = renderer.getContext();
    if (gl.isContextLost())
      throw new HumanViewerGpuContextLostError(
        "The GPU context was lost before the candidate display completed.",
      );
    assertHumanViewerFrame(gl.getError(), gl.NO_ERROR);
    const completedAddress = readHumanViewerCameraAddress(address, active);
    let completedText = `${address.doc} • ${address.view} • ${address.pass} • ${(performance.now() - start).toFixed(1)} ms • ${active.renderer()}`;
    if (resident.admission !== undefined)
      completedText += ` | Construction draft: ${resident.admission.accepted ? "accepted" : "refused"}, ${resident.admission.failures.length} admission failures`;
    // Only a completed display may evict the previous displayed resident.
    if (created) residents.set(key, resident);
    current = completedAddress;
    shownKey = key;
    status.textContent = completedText;
    completedStatus = completedText;
    graphicsStatusFailed = false;
  } catch (cause) {
    return createAutoMovieResourceRetirement(
      created ? [resident.release] : [],
      { error: cause },
    )();
  }
  // The completed candidate is now the retained display even if old cleanup fails.
  await createAutoMovieResourceRetirement([
    () => displaySave.changed(),
    () => work("idle"),
    () => {
      if (!residentCapture) numerical.persist();
    },
    () => residents.settleRetirements(),
  ])();
}

let queue = Promise.resolve();
const apply = (address: HumanViewerAddress): Promise<void> => {
  const next = queue
    .then(async () => {
      const previous = current;
      const priorKey = shownKey;
      const prior = residents.get(priorKey);
      const priorComposition = composition;
      const referenceSource = reference.getAttribute("src");
      const referenceStyle = reference.style.cssText;
      const displayStyle = display.style.cssText;
      const landmarks = document.querySelector<SVGSVGElement>("#landmarks")!;
      const landmarkMarkup = landmarks.innerHTML;
      const landmarkStyle = landmarks.style.cssText;
      changingDisplay = true;
      try {
        await show(address);
      } catch (cause) {
        await createAutoMovieResourceRetirement(
          [
            () => {
              if (
                current === previous &&
                previous !== undefined &&
                prior !== undefined
              ) {
                current = previous;
                shownKey = priorKey;
                composition = priorComposition;
                active = prior.stage;
                resizeHumanViewerFrame(
                  previous.size,
                  display,
                  canvas,
                  prior.resize,
                );
                display.style.cssText = displayStyle;
                reference.style.cssText = referenceStyle;
                if (referenceSource === null) reference.removeAttribute("src");
                else reference.setAttribute("src", referenceSource);
                landmarks.innerHTML = landmarkMarkup;
                landmarks.style.cssText = landmarkStyle;
                applyHumanViewerVisibility(active, previous);
                frameHumanViewerAddress(active, prior.group, previous);
                addHumanViewerCalibration(prior.group, previous.calibrate);
                if (!renderer.getContext().isContextLost()) active.finish();
              }
            },
          ],
          { error: cause },
        )();
      } finally {
        changingDisplay = false;
        if (current !== undefined && current !== previous) {
          announceHumanViewerAddress(current, active);
          displaySave.changed();
        }
      }
    })
    .then(() => {
      if (current === undefined)
        throw new Error("No model has been displayed.");
    });
  queue = next.catch((error: unknown) => {
    graphicsStatusFailed = error instanceof HumanViewerGpuContextLostError;
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
  // Initial resident startup evaluates no document. A replacement restores
  // only a display the host previously completed, through this checked realm.
  const restoring = new URLSearchParams(location.search).get("restore") === "1";
  if (residentCapture || restoring) await loaded;
  else
    await showHumanViewerFirstAddress(
      parseHumanViewerAddress(location.hash, catalogue.documents[0]?.id),
      apply,
      loaded,
      (message) => console.warn("HUMAN_FIRST_ADDRESS " + message),
      parseHumanViewerAddress("", catalogue.documents[0]?.id),
    );
  // Publish one browser compile with a separately checked, same-source Node realm.
  assertHumanViewerSingleCompile(
    readHumanViewerCompiles(),
    await numerical.authority(),
    catalogue.revision,
  );
  await checkHumanViewerCandidateSource();
  if (restoring) {
    try {
      await apply(
        parseHumanViewerAddress(location.hash, catalogue.documents[0]?.id),
      );
    } catch (error) {
      await numerical.authority();
      restoreError = error instanceof Error ? error.message : String(error);
      residents.clear();
      const released = residents.settleRetirements();
      await released.catch(() =>
        createAutoMovieResourceRetirement([() => released], { error })(),
      );
      shownKey = "";
      current = undefined;
      composition = null;
      workingDocument = "";
      work("idle");
    }
    // A source/realm failure still refuses generation publication. A rejected
    // document alone leaves a ready empty bridge and its explicit cause.
    assertHumanViewerSingleCompile(
      readHumanViewerCompiles(),
      await numerical.authority(),
      catalogue.revision,
    );
    await checkHumanViewerCandidateSource();
  }
  addEventListener("hashchange", () => {
    void apply(
      parseHumanViewerAddress(location.hash, catalogue.documents[0]?.id),
    );
  });
  Object.assign(window, {
    __humanViewer: {
      show: apply,
      parts: () => (current === undefined ? [] : active.observe.parts()),
      renderer: () => {
        const gl = renderer.getContext();
        const device = gl.getExtension("WEBGL_debug_renderer_info");
        return String(
          gl.getParameter(device?.UNMASKED_RENDERER_WEBGL ?? gl.RENDERER),
        );
      },
      revision: () => catalogue.revision,
      builds: numerical.builds,
      buildMs: numerical.buildMs,
      spans: () => spans.snapshot(),
      address: () => {
        if (current === undefined)
          throw new Error("No model has been displayed.");
        return current;
      },
      admission: () => residents.get(shownKey)?.admission ?? null,
      rigReading: () => residents.get(shownKey)?.rigReading,
      exportConstruction: async () => {
        const address = current;
        if (address === undefined)
          throw new Error("No model has been displayed.");
        const selected = catalogue.documents.find(
          (entry) => entry.id === address.doc,
        );
        const resident = residents.get(shownKey);
        if (
          selected?.domain !== "person" ||
          address.operation !== "construct" ||
          resident?.exportConstruction === undefined
        )
          throw new Error(
            "Static construction export requires the displayed paired Person construction.",
          );
        try {
          return await resident.exportConstruction();
        } finally {
          work("idle");
        }
      },
      periocularMappings: () => residents.get(shownKey)?.periocularMappings,
      png: () => {
        if (current === undefined)
          throw new Error("No model has been displayed.");
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
      evict: (): Promise<boolean> => {
        const next = queue.then(async () => {
          const evicted = residents.evictOldest(shownKey);
          await residents.settleRetirements();
          return evicted;
        });
        queue = next
          .then(() => undefined)
          .catch((error: unknown) => {
            status.textContent =
              error instanceof Error ? error.message : String(error);
          });
        return next;
      },
    },
  });
  parent.postMessage(
    {
      type: "human:ready",
      ...(current === undefined
        ? {}
        : {
            address: serializeHumanViewerAddress(current),
            parts: active.observe.parts(),
          }),
      restoreError,
    },
    location.origin,
  );
  // Complete gestures before publishing their actual camera for restoration.
  const finishOrbit = (): void => {
    if (
      current === undefined ||
      changingDisplay ||
      renderer.getContext().isContextLost()
    )
      return;
    active.finish();
    current = readHumanViewerCameraAddress(current, active);
    announceHumanViewerAddress(current, active);
    displaySave.changed();
  };
  canvas.addEventListener("pointermove", (event) => {
    if (event.buttons !== 0) finishOrbit();
  });
  canvas.addEventListener("pointerup", finishOrbit);
  canvas.addEventListener("wheel", () => {
    requestAnimationFrame(finishOrbit);
  });
}
void main().catch((error: unknown) => {
  status.textContent = error instanceof Error ? error.message : String(error);
  // A candidate that mixed compiles is started again by the host at once.
  parent.postMessage(
    {
      type: "human:error",
      error: status.textContent,
      restart:
        error instanceof HumanViewerMixedCompileError ||
        error instanceof HumanViewerNodeSourceChangedError,
    },
    location.origin,
  );
});
