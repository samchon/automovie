/**
 * Display-only development entry. The server supplies published documents and
 * digest keys; a numerical worker evaluates them and product viewports lower
 * their results without copying lighting, mesh or material implementations.
 * Each resident owns a viewport and its GPU buffers. Captures always call
 * finish, so idle animation is unnecessary and never competes with requests.
 */
import type {
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
import type { HumanResidentPort } from "@automovie/playground/src/human/common/residentWorker";
import { createConnectedFaceViewport } from "@automovie/playground/src/human/face/connectedViewport";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

import type { IFaceLikenessCamera } from "../face-review/faceLikenessFraming";
import { faceShapeFitView } from "../face-review/faceShapeFitCamera";
import type { HumanViewerAddress } from "./HumanViewerAddress";
import type { HumanViewerCatalogue } from "./HumanViewerCatalogue";
import { assertHumanViewerFrame } from "./assertHumanViewerFrame";
import { createHumanViewerCache } from "./createHumanViewerCache";
import { decodeHumanViewerPreview } from "./decodeHumanViewerPreview";
import { drawHumanViewerFrame } from "./drawHumanViewerFrame";
import { encodeHumanViewerPreviewChunks } from "./encodeHumanViewerPreviewChunks";
import { frameHumanViewerParts } from "./frameHumanViewerParts";
import { parseHumanViewerAddress } from "./parseHumanViewerAddress";
import { planHumanViewerReference } from "./planHumanViewerReference";
import { serializeHumanViewerAddress } from "./serializeHumanViewerAddress";
import { resizeHumanViewerFrame } from "./resizeHumanViewerFrame";
import { admitHumanViewerCatalogue } from "./admitHumanViewerCatalogue";
import { assertHumanViewerSource } from "./assertHumanViewerSource";
import { humanViewerCandidateSourceError } from "./humanViewerCandidateSourceError";
import type { HumanViewerWork } from "./HumanViewerWork";
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
const worker = new Worker(new URL("./numerical-worker.mts", import.meta.url), {
  type: "module",
});
type Result = ConnectedFaceResult | ConnectedBodyResult;
const pending = new Map<
  number,
  { resolve: (value: Result) => void; reject: (error: Error) => void }
>();
let sequence = 0;
/** Where a capture spends its time inside the page, by named stage. */
const spans = createHumanViewerSpans(() => performance.now());
let builds = 0;
let buildMs = 0;
let workingDocument = "";
const work = (phase: HumanViewerWork["phase"]): void => {
  console.log("HUMAN_WORK " + JSON.stringify({ revision: catalogue?.revision ?? "bootstrap",
    frame: new URLSearchParams(location.search).get("generation") ?? "direct",
    doc: workingDocument, phase, at: Date.now(), pending: pending.size,
    geometries: renderer.info.memory.geometries, textures: renderer.info.memory.textures,
  } satisfies HumanViewerWork));
};
worker.onmessage = ({ data }) => {
  const request = pending.get(data.id);
  pending.delete(data.id);
  if (request === undefined) return;
  work("numeric-reply");
  if (data.success) {
    ++builds;
    buildMs = data.buildMs ?? 0;
    request.resolve(data.value);
  } else request.reject(new Error(data.error));
};
worker.onerror = (error) => {
  for (const request of pending.values())
    request.reject(new Error(error.message));
  pending.clear();
  work("failed");
};
let catalogue: HumanViewerCatalogue;
let current: HumanViewerAddress;
/** The photograph layer of the frame on screen, null while none is shown. */
let composition: {
  mode: "split" | "overlay" | "swipe";
  opacity: number;
  size: number;
  landmarks: { x: number; y: number; group: string }[];
} | null = null;
let active:
  | ReturnType<typeof createConnectedFaceViewport>
  | ReturnType<
      typeof createConnectedBodyViewport<IAutoMovieHumanBodyBasisDocument>
    >
  | ReturnType<typeof createConnectedBodyViewport<IAutoMovieHumanPersonDocument>>;
type Resident = {
  stage: typeof active;
  group: THREE.Group;
  resize: () => void;
  release: () => void;
};
const residents = createHumanViewerCache<Resident>(32, (resident) =>
  resident.release(),
);

/** Product worker transport backed by the server's digest cache. */
function port<Input, Output>(
  selected: HumanViewerCatalogue["documents"][number],
  ao: boolean,
): HumanResidentPort<Input, Output> {
  const transport: HumanResidentPort<Input, Output> = {
    onmessage: null,
    onerror: null,
    terminate: () => {},
    postMessage: ({ id, input }) => {
      const key = selected.key + (ao ? "-ao" : "-direct");
      void (async () => {
        work("cache-read");
        const cached = await spans.measure("cacheReadMs", () => fetch(`/cache/${key}`));
        let value: Result;
        if (cached.ok)
          value = await spans.measure("cacheDecodeMs", async () =>
            decodeHumanViewerPreview(await cached.text()) as Result);
        else {
          work("build");
          value = await spans.measure("workerMs", () => new Promise<Result>((resolve, reject) => {
            const workerId = ++sequence;
            pending.set(workerId, { resolve, reject });
            worker.postMessage({
              id: workerId,
              domain: selected.domain,
              basis: selected.basis,
              input: { ...input, occlusion: ao },
            });
          }));
          // Only numerical results enter disk persistence. Photos remain in a
          // separate display layer, and are never serialized here.
          work("cache-write");
          await spans.measure("cacheWriteMs", () => fetch(`/cache/${key}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: new Blob([...encodeHumanViewerPreviewChunks(value)], { type: "application/json" }),
          }));
        }
        work("prepare");
        transport.onmessage?.({
          data: { id, success: true, value: value as Output },
        });
      })().catch((error: unknown) => {
        work("failed");
        transport.onmessage?.({
          data: {
            id,
            success: false,
            error: error instanceof Error ? error.message : String(error),
          },
        });
      });
    },
  };
  return transport;
}

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
          port<ConnectedFaceRequest, ConnectedFaceResult>(selected, address.ao),
      });
      const model = await stage.build(selected.document, false, address.ao);
      stage.publish(model);
      resident = {
        stage,
        resize,
        group: model.frame.resident.group,
        release: () => {
          stage.cancel();
          controls.forEach((control) => control.dispose());
          disposeHumanPreview(model.frame.resident.group);
        },
      };
    } else if (selected.domain === "person") {
      // a whole person is drawn by the body stage: the worker answers its
      // protocol with the composed model, and only the document text differs
      const stage = createConnectedBodyViewport<IAutoMovieHumanPersonDocument>({
        ...props,
        serialize: serializeHumanPersonDocument,
        worker: () =>
          port<ConnectedBodyRequest, ConnectedBodyResult>(selected, false),
      });
      const model = await stage.build(selected.document);
      stage.publish(model);
      resident = {
        stage,
        resize,
        group: model.frame.resident.group,
        release: () => {
          stage.disposeWorker();
          controls.forEach((control) => control.dispose());
          disposeHumanPreview(model.frame.resident.group);
        },
      };
    } else {
      const stage = createConnectedBodyViewport({
        ...props,
        worker: () =>
          port<ConnectedBodyRequest, ConnectedBodyResult>(selected, false),
      });
      const model = await stage.build(selected.document);
      stage.publish(model);
      resident = {
        stage,
        resize,
        group: model.frame.resident.group,
        release: () => {
          stage.disposeWorker();
          controls.forEach((control) => control.dispose());
          disposeHumanPreview(model.frame.resident.group);
        },
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
  ).json()) as {
    available: boolean;
    camera: IFaceLikenessCamera | null;
    landmarks: { x: number; y: number; group: string }[];
  };
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
      builds: () => builds,
      buildMs: () => buildMs,
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
