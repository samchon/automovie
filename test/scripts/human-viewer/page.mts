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
import { encodeHumanViewerPreview } from "./encodeHumanViewerPreview";
import { frameHumanViewerParts } from "./frameHumanViewerParts";
import { parseHumanViewerAddress } from "./parseHumanViewerAddress";
import { planHumanViewerReference } from "./planHumanViewerReference";
import { serializeHumanViewerAddress } from "./serializeHumanViewerAddress";

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
let builds = 0;
worker.onmessage = ({ data }) => {
  const request = pending.get(data.id);
  pending.delete(data.id);
  if (request === undefined) return;
  if (data.success) {
    ++builds;
    request.resolve(data.value);
  } else request.reject(new Error(data.error));
};
worker.onerror = (error) => {
  for (const request of pending.values())
    request.reject(new Error(error.message));
  pending.clear();
};
let catalogue: HumanViewerCatalogue;
let current: HumanViewerAddress;
let active:
  | ReturnType<typeof createConnectedFaceViewport>
  | ReturnType<typeof createConnectedBodyViewport>;
type Resident = {
  stage: typeof active;
  group: THREE.Group;
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
        const cached = await fetch(`/cache/${key}`);
        let value: Result;
        if (cached.ok)
          value = decodeHumanViewerPreview(await cached.text()) as Result;
        else {
          value = await new Promise<Result>((resolve, reject) => {
            const workerId = ++sequence;
            pending.set(workerId, { resolve, reject });
            worker.postMessage({
              id: workerId,
              domain: selected.domain,
              basis: selected.basis,
              input: { ...input, occlusion: ao },
            });
          });
          // Only numerical results enter disk persistence. Photos remain in a
          // separate display layer, and are never serialized here.
          await fetch(`/cache/${key}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: encodeHumanViewerPreview(value),
          });
        }
        transport.onmessage?.({
          data: { id, success: true, value: value as Output },
        });
      })().catch((error: unknown) =>
        transport.onmessage?.({
          data: {
            id,
            success: false,
            error: error instanceof Error ? error.message : String(error),
          },
        }),
      );
    },
  };
  return transport;
}

async function show(address: HumanViewerAddress): Promise<void> {
  // A hand-written document can appear or change after the page loaded.
  if (address.doc.startsWith("file:"))
    catalogue = await (await fetch("/docs")).json();
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
      observeResize: (_resize: () => void) => {},
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
        group: model.frame.resident.group,
        release: () => {
          stage.cancel();
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
  renderer.setSize(address.size, address.size, false);
  // Resizing the shared surface precedes framing, which observes its aspect.
  active.fitView();
  active.observe.pass(address.pass);
  const missing = active.observe.isolate(
    address.parts.length === 0 ? null : address.parts,
  );
  if (missing.length !== 0)
    throw new Error("Unknown mesh: " + missing.join(","));
  if (address.frame === null && address.parts.length !== 0)
    active.observe.frame({
      ...frameHumanViewerParts(resident.group, address.parts),
      view: address.view,
      pitch: address.pitch,
    });
  else if (address.frame === null) active.observe.view(address.view, { pitch: address.pitch });
  else
    active.observe.frame({
      center: address.frame.slice(0, 3) as [number, number, number],
      radius: address.frame[3],
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
  active.finish();
  const reference = document.querySelector<HTMLImageElement>("#reference")!;
  const controls = document.querySelector<HTMLDivElement>(
    "#reference-controls",
  )!;
  const info = (await (
    await fetch("/reference-info?" + new URLSearchParams({ doc: address.doc }))
  ).json()) as {
    available: boolean;
    camera: IFaceLikenessCamera | null;
    landmarks: { x: number; y: number; group: string }[];
  };
  controls.hidden = !info.available;
  const comparison = planHumanViewerReference(
    info.available,
    address.ref,
    address.opacity,
  );
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
    active.finish();
  } else canvas.style.width = `${address.size}px`;
  const svg = document.querySelector<SVGSVGElement>("#landmarks")!;
  svg.replaceChildren();
  svg.setAttribute("viewBox", "0 0 1 1");
  for (const point of info.landmarks) {
    const circle = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "circle",
    );
    circle.setAttribute("cx", String(point.x));
    circle.setAttribute("cy", String(point.y));
    circle.setAttribute("r", "0.004");
    circle.setAttribute("fill", "#00ffff");
    circle.setAttribute("data-group", point.group);
    svg.append(circle);
  }
  current = address;
  status.textContent = `${address.doc} • ${address.view} • ${address.pass} • ${(performance.now() - start).toFixed(1)} ms • ${active.renderer()}`;
  const gallery = document.querySelector<HTMLDivElement>("#gallery")!;
  gallery.replaceChildren();
  for (const name of active.observe.parts()) {
    const anchor = document.createElement("a");
    anchor.textContent = name;
    anchor.href =
      "#" +
      serializeHumanViewerAddress({ ...address, parts: [name], frame: null });
    gallery.append(anchor);
  }
}

let queue = Promise.resolve();
const apply = (address: HumanViewerAddress): Promise<void> => {
  const next = queue.then(() => show(address));
  queue = next.catch((error: unknown) => {
    status.textContent = error instanceof Error ? error.message : String(error);
  });
  return next;
};
async function main(): Promise<void> {
  catalogue = await (await fetch("/docs")).json();
  await apply(parseHumanViewerAddress(location.hash));
  addEventListener("hashchange", () => {
    void apply(parseHumanViewerAddress(location.hash)).then(() => {
      parent.postMessage(
        {
          type: "human:address",
          address: serializeHumanViewerAddress(current),
        },
        location.origin,
      );
    });
  });
  Object.assign(window, {
    __humanViewer: {
      show: apply,
      parts: () => active.observe.parts(),
      renderer: () => String(active.renderer()),
      revision: () => catalogue.revision,
      builds: () => builds,
      address: () => current,
      png: () => {
        active.finish();
        const gl = renderer.getContext();
        assertHumanViewerFrame(gl.getError(), gl.NO_ERROR);
        return canvas.toDataURL("image/png");
      },
    },
  });
  parent.postMessage({ type: "human:ready" }, location.origin);
  const mode = document.querySelector<HTMLSelectElement>("#reference-mode")!;
  const opacity =
    document.querySelector<HTMLInputElement>("#reference-opacity")!;
  const updateReference = (): void => {
    location.hash = serializeHumanViewerAddress({
      ...current,
      ref: mode.value as NonNullable<HumanViewerAddress["ref"]>,
      opacity: Number(opacity.value),
    });
  };
  mode.addEventListener("change", updateReference);
  opacity.addEventListener("input", updateReference);
  document
    .querySelector<HTMLInputElement>("#reference-landmarks")!
    .addEventListener("change", (event) => {
      document.querySelector<SVGSVGElement>("#landmarks")!.style.display = (
        event.target as HTMLInputElement
      ).checked
        ? "block"
        : "none";
    });
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
