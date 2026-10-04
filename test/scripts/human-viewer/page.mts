/**
 * Display-only development entry. The server supplies published documents and
 * digest keys; a numerical worker evaluates them and product viewports lower
 * their results without copying lighting, mesh or material implementations.
 * Each resident owns a viewport and its GPU buffers. Captures always call
 * finish, so idle animation is unnecessary and never competes with requests.
 */
import type {
  ConnectedBodyPart,
  ConnectedBodyRequest,
  ConnectedBodyResult,
} from "@automovie/playground/src/human/body/connectedBodyProtocol";
import {
  type IAutoMovieHumanBodyBasisDocument,
  type IAutoMovieHumanPersonDocument,
  serializeHumanPersonDocument,
} from "@automovie/human";
import { createConnectedBodyViewport } from "@automovie/playground/src/human/body/connectedBodyViewport";
import type {
  ConnectedFaceRequest,
  ConnectedFaceResult,
} from "@automovie/playground/src/human/common/connectedRuntime";
import { disposeHumanPreview } from "@automovie/playground/src/human/common/previewScene";
import { createConnectedFaceViewport } from "@automovie/playground/src/human/face/connectedViewport";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

import { faceShapeFitView } from "../face-review/faceShapeFitCamera";
import type { HumanViewerAddress } from "./HumanViewerAddress";
import type { HumanViewerCatalogue } from "./HumanViewerCatalogue";
import { assertHumanViewerFrame } from "./assertHumanViewerFrame";
import { createHumanViewerCache } from "./createHumanViewerCache";
import { drawHumanViewerFrame } from "./drawHumanViewerFrame";
import { createHumanViewerNumericalPort } from "./createHumanViewerNumericalPort.mjs";
import { frameHumanViewerParts } from "./frameHumanViewerParts";
import { parseHumanViewerAddress } from "./parseHumanViewerAddress";
import { planHumanViewerReference } from "./planHumanViewerReference";
import { serializeHumanViewerAddress } from "./serializeHumanViewerAddress";
import { resizeHumanViewerFrame } from "./resizeHumanViewerFrame";
import { admitHumanViewerCatalogue } from "./admitHumanViewerCatalogue";
import { assertHumanViewerSource } from "./assertHumanViewerSource";
import { humanViewerCandidateSourceError } from "./humanViewerCandidateSourceError";
import type { HumanViewerWork } from "./HumanViewerWork";
import type { IHumanViewerComposition } from "./IHumanViewerComposition";
import type { IHumanViewerReferenceInfo } from "./IHumanViewerReferenceInfo";
import type { IHumanViewerResident } from "./IHumanViewerResident";
import { measureHumanViewerResidentBytes } from "./measureHumanViewerResidentBytes";
import { applyHumanViewerVisibility } from "./applyHumanViewerVisibility";
import { addHumanViewerCalibration } from "./addHumanViewerCalibration";
import { captureHumanViewerReference } from "./captureHumanViewerReference";
import { drawHumanViewerLandmarks } from "./drawHumanViewerLandmarks";
import { layoutHumanViewerReference } from "./layoutHumanViewerReference";
import { createHumanViewerSpans } from "./createHumanViewerSpans";

const canvas = document.querySelector<HTMLCanvasElement>("#canvas")!;
const display = document.querySelector<HTMLDivElement>("#display")!;
const status = document.querySelector<HTMLDivElement>("#status")!;
const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  preserveDrawingBuffer: true,
});
const loader = new THREE.TextureLoader();
/** Where a capture spends its time inside the page, by named stage. */
const spans = createHumanViewerSpans(() => performance.now());
let workingDocument = "";
/**
 * Stages no `spans.measure` call encloses: model preparation after the
 * numerical reply, drawing, and the stage setup before the first request.
 * Their time is added when the page reports the next stage, so a capture's
 * whole show time is attributed.
 */
const UNMEASURED: ReadonlySet<HumanViewerWork["phase"]> = new Set(["loading", "prepare", "draw"]);
let stagePhase: HumanViewerWork["phase"] = "idle";
let stageAt = 0;
const work = (phase: HumanViewerWork["phase"]): void => {
  const at = performance.now();
  if (UNMEASURED.has(stagePhase)) spans.add(stagePhase + "Ms", at - stageAt);
  stagePhase = phase;
  stageAt = at;
  console.log("HUMAN_WORK " + JSON.stringify({ revision: catalogue?.revision ?? "bootstrap",
    frame: new URLSearchParams(location.search).get("generation") ?? "direct",
    doc: workingDocument, phase, at: Date.now(), pending: numerical.pending(),
    geometries: renderer.info.memory.geometries, textures: renderer.info.memory.textures,
    residents: residents.keys().length, residentBytes: residents.total(),
  } satisfies HumanViewerWork));
};
/** The worker and digest-cache transport the product viewports build through. */
const numerical = createHumanViewerNumericalPort({ work, spans });
let catalogue: HumanViewerCatalogue;
let current: HumanViewerAddress;
/** The photograph layer of the frame on screen, null while none is shown. */
let composition: IHumanViewerComposition | null = null;
let active:
  | ReturnType<typeof createConnectedFaceViewport>
  | ReturnType<
      typeof createConnectedBodyViewport<IAutoMovieHumanBodyBasisDocument>
    >
  | ReturnType<typeof createConnectedBodyViewport<IAutoMovieHumanPersonDocument>>;
type Resident = IHumanViewerResident<typeof active>;
/**
 * Bytes of resident arrays the page keeps drawn-ready. The renderer's V8 heap
 * lives in a 4 GiB pointer cage, and a resident page that kept 32 documents
 * by count died of a V8 out-of-memory error at about 2.4 GiB of heap while
 * preparing one more. Counted arrays are the bulk of a resident; this budget
 * leaves the rest of the cage for the next document's transient decode,
 * build and preparation copies.
 */
const RESIDENT_BUDGET = 512 * 1024 * 1024;
const residents = createHumanViewerCache<Resident>(RESIDENT_BUDGET,
  (resident) => resident.bytes, (resident) => resident.release());

/** The numerical arrays a body or person resident keeps beside its group. */
const bodyArrays = (parts: readonly ConnectedBodyPart[]): (ArrayLike<number | null> | null | undefined)[] =>
  parts.flatMap((part) => {
    const mesh = part.geometry.mesh;
    return [mesh.positions, mesh.normals, mesh.indices, mesh.uvs, mesh.colors,
      mesh.physicalVertices?.vertices];
  });

async function show(address: HumanViewerAddress): Promise<void> {
  spans.reset();
  workingDocument = address.doc;
  work("loading");
  // A hand-written document can appear or change after the page loaded.
  if (address.doc.startsWith("file:"))
    catalogue = admitHumanViewerCatalogue(catalogue, await (await fetch("/docs")).json());
  const selected = catalogue.documents.find(
    (entry) => entry.id === address.doc,
  );
  if (selected === undefined)
    throw new Error(`Unknown document: ${address.doc}`);
  const key = selected.key + (address.ao ? "-ao" : "-direct");
  const start = performance.now();
  status.textContent = "Preparing " + address.doc;
  display.style.width = `${address.size}px`;
  display.style.height = `${address.size}px`;
  let resident = residents.get(key);
  if (resident === undefined) {
    const controls: OrbitControls[] = [];
    let resize = (): void => {};
    const settings = {
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
    const props = {
      canvas,
      pixelRatio: 1,
      renderer: {
        capabilities: renderer.capabilities,
        shadowMap: settings.shadowMap,
        get outputColorSpace() {
          return settings.outputColorSpace;
        },
        set outputColorSpace(value: string) {
          settings.outputColorSpace = value;
        },
        get toneMapping() {
          return settings.toneMapping;
        },
        set toneMapping(value: THREE.ToneMapping) {
          settings.toneMapping = value;
        },
        get toneMappingExposure() {
          return settings.toneMappingExposure;
        },
        set toneMappingExposure(value: number) {
          settings.toneMappingExposure = value;
        },
        setPixelRatio: (ratio: number) => renderer.setPixelRatio(ratio),
        setSize: (width: number, height: number, style: boolean) =>
          renderer.setSize(width, height, style),
        setAnimationLoop: (_callback: () => void) => {},
        render: (scene: THREE.Scene, camera: THREE.PerspectiveCamera) =>
          drawHumanViewerFrame(settings, renderer, () =>
            renderer.render(scene, camera),
          ),
        getContext: () => renderer.getContext(),
      },
      orbit: (camera: THREE.PerspectiveCamera) => {
        const orbit = new OrbitControls(camera, canvas);
        controls.push(orbit);
        return orbit;
      },
      observeResize: (observer: () => void) => { resize = observer; },
      loadTexture: (asset: string) => loader.loadAsync(asset),
    };
    if (selected.domain === "face") {
      const stage = createConnectedFaceViewport({
        ...props,
        worker: () =>
          numerical.port<ConnectedFaceRequest, ConnectedFaceResult>(selected, address.ao),
      });
      const model = await stage.build(selected.document, false, address.ao);
      stage.publish(model);
      // Only the group is kept: holding the built model would keep a second
      // copy of every numerical array alive for as long as the resident.
      const group = model.frame.resident.group;
      resident = {
        stage,
        resize,
        group,
        release: () => {
          stage.cancel();
          controls.forEach((control) => control.dispose());
          disposeHumanPreview(group);
        },
        bytes: measureHumanViewerResidentBytes(group, model.frame.witnesses.flatMap(
          (witness) => [witness.positions, witness.normals, witness.indices, witness.uvs])),
      };
    } else if (selected.domain === "person") {
      // a whole person is drawn by the body stage: the worker answers its
      // protocol with the composed model, and only the document text differs
      const stage = createConnectedBodyViewport<IAutoMovieHumanPersonDocument>({
        ...props,
        serialize: serializeHumanPersonDocument,
        worker: () =>
          numerical.port<ConnectedBodyRequest, ConnectedBodyResult>(selected, false),
      });
      const model = await stage.build(selected.document);
      stage.publish(model);
      const group = model.frame.resident.group;
      resident = {
        stage,
        resize,
        group,
        release: () => {
          stage.disposeWorker();
          controls.forEach((control) => control.dispose());
          disposeHumanPreview(group);
        },
        bytes: measureHumanViewerResidentBytes(group, bodyArrays(model.frame.resident.parts)),
      };
    } else {
      const stage = createConnectedBodyViewport({
        ...props,
        worker: () =>
          numerical.port<ConnectedBodyRequest, ConnectedBodyResult>(selected, false),
      });
      const model = await stage.build(selected.document);
      stage.publish(model);
      const group = model.frame.resident.group;
      resident = {
        stage,
        resize,
        group,
        release: () => {
          stage.disposeWorker();
          controls.forEach((control) => control.dispose());
          disposeHumanPreview(group);
        },
        bytes: measureHumanViewerResidentBytes(group, bodyArrays(model.frame.resident.parts)),
      };
    }
    residents.set(key, resident);
  }
  active = resident.stage;
  // A rig left from an earlier show must not enter this show's framing.
  addHumanViewerCalibration(resident.group, false);
  work("draw");
  resizeHumanViewerFrame(address.size, display, canvas, resident.resize);
  // The stage pairs renderer size with camera projection before fitting.
  active.fitView();
  applyHumanViewerVisibility(active, address);
  if (address.frame === null && (address.parts.length !== 0 || address.zoom !== 1)) {
    const box = frameHumanViewerParts(resident.group, address.parts);
    active.observe.frame({
      center: box.center,
      radius: box.radius / address.zoom,
      view: address.view,
      pitch: address.pitch,
    });
  } else if (address.frame === null)
    active.observe.view(address.view, { pitch: address.pitch });
  else
    active.observe.frame({
      center: address.frame.slice(0, 3) as [number, number, number],
      radius: address.frame[3] / address.zoom,
      view: address.view,
      pitch: address.pitch,
    });
  if (address.look !== null) {
    const [yaw, pitch, distance, x, y, z, fov] = address.look;
    active.observe.look({
      position: faceShapeFitView(
        { yaw, pitch, distance, target: [x, y, z], fov },
        address.size,
      ).eye,
      target: [x, y, z],
      fov,
    });
  }
  addHumanViewerCalibration(resident.group, address.calibrate);
  active.finish();
  const reference = document.querySelector<HTMLImageElement>("#reference")!;
  const info = (await (
    await fetch("/reference-info?" + new URLSearchParams({ doc: address.doc }))
  ).json()) as IHumanViewerReferenceInfo;
  const comparison = planHumanViewerReference(
    info.available,
    address.ref,
    address.opacity,
  );
  composition = null;
  reference.style.display = comparison.enabled ? "block" : "none";
  reference.style.clipPath = "";
  reference.style.opacity = "1";
  reference.style.left = "0";
  reference.style.width = `${address.size}px`;
  if (comparison.enabled) {
    reference.src = "/reference?" + new URLSearchParams({ doc: address.doc });
    await reference.decode();
    if (info.camera !== null)
      active.observe.look({
        position: faceShapeFitView(info.camera, address.size).eye,
        target: info.camera.target,
        fov: info.camera.fov ?? 28,
      });
    if (address.ref === "split") {
      display.style.width = `${address.size * 2}px`;
      canvas.style.width = `${address.size}px`;
      reference.style.left = `${address.size}px`;
    } else {
      canvas.style.width = `${address.size}px`;
      if (address.ref === "overlay")
        reference.style.opacity = String(1 - comparison.renderOpacity);
      else reference.style.clipPath = `inset(0 0 0 ${address.opacity * 100}%)`;
    }
    composition = {
      mode: comparison.mode!,
      opacity: address.opacity,
      size: address.size,
      landmarks: address.landmarks ? info.landmarks : [],
    };
    active.finish();
  } else canvas.style.width = `${address.size}px`;
  drawHumanViewerLandmarks(
    document.querySelector<SVGSVGElement>("#landmarks")!,
    () => document.createElementNS("http://www.w3.org/2000/svg", "circle"),
    composition === null || !address.landmarks
      ? null
      : (() => {
          const layout = layoutHumanViewerReference(composition.mode, composition.size,
            composition.opacity, { width: reference.naturalWidth, height: reference.naturalHeight },
            info.landmarks);
          return { width: layout.width, height: layout.height,
            radius: layout.markerRadius, markers: layout.markers };
        })(),
  );
  current = address;
  work("idle");
  status.textContent = `${address.doc} • ${address.view} • ${address.pass} • ${(performance.now() - start).toFixed(1)} ms • ${active.renderer()}`;
}

let queue = Promise.resolve();
/** Tell the host page what is displayed, so its controls follow the frame. */
const announce = (): void => {
  parent.postMessage(
    {
      type: "human:address",
      address: serializeHumanViewerAddress(current),
      parts: active.observe.parts(),
      doc: current.doc,
    },
    location.origin,
  );
};
const apply = (address: HumanViewerAddress): Promise<void> => {
  const next = queue.then(() => show(address)).then(announce);
  queue = next.catch((error: unknown) => {
    status.textContent = error instanceof Error ? error.message : String(error);
  });
  return next;
};
async function main(): Promise<void> {
  const source = async (): Promise<void> => {
    const health = await (await fetch("/health")).json() as Parameters<typeof humanViewerCandidateSourceError>[0];
    assertHumanViewerSource(humanViewerCandidateSourceError(health));
  };
  await source();
  catalogue = await (await fetch("/docs")).json();
  await apply(parseHumanViewerAddress(location.hash));
  await source();
  addEventListener("hashchange", () => {
    void apply(parseHumanViewerAddress(location.hash));
  });
  Object.assign(window, {
    __humanViewer: {
      show: apply,
      parts: () => active.observe.parts(),
      renderer: () => String(active.renderer()),
      revision: () => catalogue.revision,
      builds: numerical.builds,
      buildMs: numerical.buildMs,
      spans: () => spans.snapshot(),
      address: () => current,
      png: () => {
        active.finish();
        const gl = renderer.getContext();
        assertHumanViewerFrame(gl.getError(), gl.NO_ERROR);
        if (composition === null) return canvas.toDataURL("image/png");
        // The photograph is a DOM layer above the canvas, so compose it in.
        return captureHumanViewerReference({
          composition,
          landmarks: composition.landmarks,
          photo: document.querySelector<HTMLImageElement>("#reference")!,
          render: canvas,
          create: () => document.createElement("canvas"),
        });
      },
    },
  });
  parent.postMessage({ type: "human:ready" }, location.origin);
  // A human orbit is display-only. Finish on demand and while the pointer moves.
  canvas.addEventListener("pointermove", () => active.finish());
  canvas.addEventListener("wheel", () =>
    requestAnimationFrame(() => active.finish()),
  );
}
if (import.meta.hot) import.meta.hot.accept();
void main().catch((error: unknown) => {
  status.textContent = error instanceof Error ? error.message : String(error);
  parent.postMessage(
    { type: "human:error", error: status.textContent },
    location.origin,
  );
});
