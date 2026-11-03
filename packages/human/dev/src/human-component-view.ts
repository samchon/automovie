import { createAutoMovieResourceRetirement, mountViewer, type IAutoMovieViewerHandle } from "@automovie/viewer";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

import { HumanCompilerStatus } from "./HumanCompilerStatus";
import { HumanComponentModel } from "./components/HumanComponentModel";
import { HumanComponentView } from "./components/HumanComponentView";
import { HumanCaptureCamera } from "./human/HumanCaptureCamera";

/** Actual producer data and its separately carried provenance. */
interface IEnvelope {
  /** Actual independently emitted component records. */
  parts: HumanComponentModel.IPart[];
  /** Producer input and source commitments; the adapter does not certify their origin. */
  provenance: unknown;
}

/** Typed DOM lookup refuses broken page structure at startup. */
function element<T extends HTMLElement>(id: string): T {
  const value: HTMLElement | null = document.getElementById(id);
  if (value === null) throw new Error("Missing component page element " + id);
  return value as T;
}

/** Compute an exact input-file or PNG commitment, separately from producer provenance. */
async function sha256(bytes: ArrayBuffer): Promise<string> {
  const digest: Uint8Array = new Uint8Array(await crypto.subtle.digest("SHA-256", bytes));
  return Array.from(digest, (n: number): string => n.toString(16).padStart(2, "0")).join("");
}

/** Mount a static component document without importing a whole-person producer or pose evaluator. */
async function main(): Promise<void> {
  HumanCompilerStatus.mount();
  const canvas: HTMLCanvasElement = element("canvas");
  const status: HTMLPreElement = element("status");
  const picker: HTMLInputElement = element("file");
  const options: HTMLDivElement = element("components");
  const pass: HTMLSelectElement = element("pass");
  const az: HTMLInputElement = element("az");
  const el: HTMLInputElement = element("el");
  const capture: HTMLButtonElement = element("capture");
  const scene: THREE.Scene = new THREE.Scene();
  scene.background = new THREE.Color(HumanCaptureCamera.background);
  const camera: THREE.PerspectiveCamera = new THREE.PerspectiveCamera(30, 1, 0.001, 100);
  const key: THREE.DirectionalLight = new THREE.DirectionalLight(0xffffff, 2.2);
  scene.add(new THREE.HemisphereLight(0xffffff, 0x9aa3b2, 0.6), key, key.target);
  const orbit: OrbitControls = new OrbitControls(camera, canvas);
  let dirty: boolean = true;
  let current: HumanComponentView | undefined;
  let envelope: IEnvelope | undefined;
  let checked: string | undefined;
  let inputSha256: string | undefined;
  let busy: boolean = false;
  let closed: boolean = false;
  const mount: IAutoMovieViewerHandle = mountViewer(canvas, scene, camera, (): boolean => {
    if (dirty) { dirty = false; mount.renderer.render(scene, camera); }
    return true;
  }, { preserveDrawingBuffer: true });
  orbit.addEventListener("change", (): void => { dirty = true; });

  /** Serialize load and capture; controls cannot change a document during an asynchronous transaction. */
  const lock: (value: boolean) => void = (value: boolean): void => {
    busy = value;
    for (const control of document.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLButtonElement>("input,select,button")) control.disabled = value;
  };
  /** Read exact emitted patch addresses from the component controls. */
  const selection: () => string[] = (): string[] => [...options.querySelectorAll<HTMLInputElement>("input:checked")].map((input: HTMLInputElement): string => input.value);
  /** Apply one selection/pass and fit its actual surface under the shared camera rule. */
  const fit: () => void = (): void => {
    if (current === undefined) return;
    current.apply(pass.value as "surface" | "overlay" | "construction", selection());
    mount.renderer.setPixelRatio(1);
    mount.renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);
    const placement: ReturnType<HumanComponentView["place"]> = current.place(camera, key, Number(az.value), Number(el.value), canvas.clientWidth / canvas.clientHeight);
    orbit.target.fromArray(placement.target);
    orbit.update();
    status.textContent = JSON.stringify(current.snapshot(), null, 2);
    dirty = true;
  };
  /** Preserve the accepted document and expose an actual failure. */
  const failure: (error: unknown) => void = (error: unknown): void => { status.textContent = error instanceof Error ? error.message : String(error); };
  picker.addEventListener("change", (): void => {
    if (busy || picker.files?.[0] === undefined) return;
    const file: File = picker.files[0];
    lock(true);
    void (async (): Promise<void> => {
      const before: string = await HumanCompilerStatus.currentSource();
      const bytes: ArrayBuffer = await file.arrayBuffer();
      const fileSha256: string = await sha256(bytes);
      const input: IEnvelope = JSON.parse(new TextDecoder().decode(bytes)) as IEnvelope;
      const next: HumanComponentView = new HumanComponentView(input.parts);
      let adopted: boolean = false;
      try {
        const after: string = await HumanCompilerStatus.currentSource();
        if (before !== after) throw new Error("Source changed while admitting the component document");
        if (closed) return;
        const labels: HTMLLabelElement[] = input.parts.map((part: HumanComponentModel.IPart): HTMLLabelElement => {
          const label: HTMLLabelElement = document.createElement("label");
          const checkbox: HTMLInputElement = document.createElement("input");
          checkbox.type = "checkbox";
          checkbox.checked = true;
          checkbox.value = part.id;
          checkbox.addEventListener("change", (): void => { try { fit(); } catch (error) { failure(error); } });
          label.append(checkbox, document.createTextNode(part.id));
          return label;
        });
        const previous: HumanComponentView | undefined = current;
        previous?.object.removeFromParent();
        current = next;
        envelope = input;
        checked = after;
        inputSha256 = fileSha256;
        adopted = true;
        scene.add(next.object);
        options.replaceChildren(...labels);
        fit();
        await previous?.dispose();
      } finally {
        if (!adopted) await next.dispose();
      }
    })().catch(failure).finally((): void => { lock(false); });
  });
  pass.addEventListener("change", (): void => { try { fit(); } catch (error) { failure(error); } });
  element("fit").addEventListener("click", (): void => { try { fit(); } catch (error) { failure(error); } });
  capture.addEventListener("click", (): void => {
    if (busy) return;
    lock(true);
    void (async (): Promise<void> => {
      const before: string = await HumanCompilerStatus.currentSource();
      if (current === undefined || before !== checked) throw new Error("Reload the actual component document after a source change");
      fit();
      mount.renderer.render(scene, camera);
      const context: WebGLRenderingContext | WebGL2RenderingContext = mount.renderer.getContext();
      const debug: WEBGL_debug_renderer_info | null = context.getExtension("WEBGL_debug_renderer_info");
      const gpu: string = String(context.getParameter(debug?.UNMASKED_RENDERER_WEBGL ?? context.RENDERER));
      if (/swiftshader|llvmpipe|software/i.test(gpu)) throw new Error("Component capture needs a hardware renderer");
      const png: string = canvas.toDataURL("image/png");
      const display: ReturnType<HumanComponentView["snapshot"]> = current.snapshot();
      const provenance: unknown = envelope?.provenance;
      const cameraState: object = { azimuth: Number(az.value), elevation: Number(el.value), position: camera.position.toArray(), quaternion: camera.quaternion.toArray(), target: orbit.target.toArray(), up: camera.up.toArray(), width: canvas.width, height: canvas.height };
      const rendererState: object = { ...mount.renderer.info.render };
      const pngSha256: string = await sha256(await (await fetch(png)).arrayBuffer());
      const after: string = await HumanCompilerStatus.currentSource();
      if (after !== before || after !== checked) throw new Error("Source changed while capturing the component");
      const link: HTMLAnchorElement = document.createElement("a");
      link.download = "human-component-" + display.pass + ".png";
      link.href = png;
      link.click();
      status.textContent = JSON.stringify({ checkedSource: checked, inputFileSha256: inputSha256, provenance, display, camera: cameraState, gpu, renderer: rendererState, pngSha256, nonce: crypto.randomUUID(), utc: new Date().toISOString() }, null, 2);
    })().catch(failure).finally((): void => { lock(false); });
  });

  // Generic resize clears the drawing buffer; this on-demand host must draw and refit it.
  const resize: ResizeObserver = new ResizeObserver((): void => {
    dirty = true;
    if (!busy && current !== undefined) try { fit(); } catch (error) { failure(error); }
  });
  resize.observe(canvas);
  const retire: () => Promise<void> = createAutoMovieResourceRetirement([
    (): void => resize.disconnect(),
    (): void => orbit.dispose(),
    (): void => mount.stop(),
    async (): Promise<void> => { await current?.dispose(); },
  ]);
  window.addEventListener("pagehide", (): void => {
    closed = true;
    void retire().catch((error: unknown): void => { failure(error); console.error(error); });
  }, { once: true });
}

void main().catch(console.error);
