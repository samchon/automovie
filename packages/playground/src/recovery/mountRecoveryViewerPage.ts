import type { AutoMovieRecoveryImageRecipe } from "@automovie/interface/recovery";
import {
  type IAutoMovieViewerCompletedFrame,
  captureAutoMovieMetricFrame,
  createAutoMovieMetricOrthographicCamera,
  createAutoMovieResourceRetirement,
  mountViewer,
  updateAutoMovieComparisonCamera,
} from "@automovie/viewer";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

import { createRecoveryViewerCandidate } from "./createRecoveryViewerCandidate";
import { readRecoveryViewerDocument } from "./readRecoveryViewerDocument";

/**
 * Inspect generic source-free recovered section recipes with an optional
 * independent reference model. Surface, overlay and construction use identical
 * cameras and the same generating coefficients; reference and generated subjects
 * retain their own normals under the same neutral light/material conditions.
 * Paired subjects share one parallel projection and screen-right separation;
 * single-subject inspection retains the ordinary perspective controls.
 * This static inspector's authored time is zero; receipts record UTC capture time.
 * Invalid loads preserve the last valid displayed resources. This host performs
 * no image fitting and makes no photographic or unseen-surface fidelity claim.
 *
 * @evidence contracts/common.md#principled-implementation Public recipe compilation and viewer model/construction builders supply one inspected candidate. OrbitControls and presets define one pose; single/pair draws select the actual perspective/parallel camera, reported with file/model identity, projection, display transforms, pass and capture time.
 * @evidence contracts/common.md#clear-and-simple-design This playground host owns controls and inspection receipts; recovery owns saved-coefficient admission, the engine owns geometry and the viewer owns native drawing/resource builders.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Capture uses the displayed canvas and current subjects without substituting an overlay or capture-only model. A missing reference stays absent, invalid loads do not retire the valid candidate and no Human code or native renderer method is replaced.
 * @evidence contracts/common.md#meaningful-documentation States source-free input, optional independent reference, same-view construction passes, actual byte/model hashes, last-valid preservation, resource ownership and the limits of visual evidence.
 * @evidence contracts/performance.md#efficient-algorithms Each load compiles/builds one candidate and hashes O(B) document/model bytes once; frame work is ordinary controls and rendering. Construction and atlas tessellation retain their explicit budgets, and camera changes perform no reconstruction.
 * @evidence contracts/performance.md#reuse-equivalent-work The loaded model and construction serve all camera, subject and pass changes. One version counter prevents a late load from replacing a newer valid request and each retirement shares one completion promise.
 * @evidence contracts/performance.md#bound-retention-and-release-resources One renderer/RAF, one controls instance, one current candidate and at most one synchronously built incoming candidate are owned. Failed/stale loads retire incoming allocations; replacement retires prior resources, and dispose aborts UI listeners, ends controls/mount and attempts all current native retirements.
 */
export function mountRecoveryViewerPage(root: HTMLElement): {
  load: (text: string) => Promise<void>;
  setView: (azimuth: number, elevation: number, distanceScale?: number) => void;
  setPass: (pass: "surface" | "overlay" | "construction") => void;
  setSubject: (subject: "generated" | "reference" | "both") => void;
  snapshot: () => object;
  capture: () => { png: string; receipt: object };
  captureMetric: (
    chart: {
      width: number;
      height: number;
      pixelPitchMm: number;
      principalPointPx: [number, number];
      azimuthRadians: number;
    },
    mode: "surface" | "silhouette",
  ) => { png: string; receipt: object };
  dispose: () => Promise<void>;
} {
  root.innerHTML = `<aside><h1>Recovery inspection</h1><p>Open a saved image-loft recipe, optionally wrapped as {recipe, reference}. Unobserved end caps and interior remain open.</p><input id="open" type="file" accept=".json,application/json"><label>Display <select id="pass"><option value="surface">Surface</option><option value="overlay">Construction overlay</option><option value="construction">Construction only</option></select></label><label>Subject <select id="subject"><option value="generated">Generated</option><option value="reference">Reference</option><option value="both">Side by side</option></select></label><div id="views"></div><label>Width scale <input id="widthScale" type="number" min="0.25" max="4" step="0.05" value="1"></label><label>Depth scale <input id="depthScale" type="number" min="0.25" max="4" step="0.05" value="1"></label><label>Height scale <input id="heightScale" type="number" min="0.25" max="4" step="0.05" value="1"></label><button id="edit">Apply dimensions</button><output id="status">No document loaded.</output></aside><div id="viewport"><canvas></canvas></div>`;
  const element: <T extends HTMLElement>(selector: string) => T = <
    T extends HTMLElement,
  >(
    selector: string,
  ): T => {
    const value: Element | null = root.querySelector(selector);
    if (value === null)
      throw new Error(`Missing inspector control ${selector}`);
    return value as T;
  };
  const canvas: HTMLCanvasElement = element<HTMLCanvasElement>("canvas");
  const status: HTMLOutputElement = element<HTMLOutputElement>("#status");
  const events: AbortController = new AbortController();
  const scene: THREE.Scene = new THREE.Scene();
  scene.background = new THREE.Color(0xe8ebf0);
  const camera: THREE.PerspectiveCamera = new THREE.PerspectiveCamera(
    35,
    1,
    0.0001,
    10,
  );
  const controls: OrbitControls = new OrbitControls(camera, canvas);
  const comparison: THREE.OrthographicCamera = new THREE.OrthographicCamera();
  const comparisonOffset: THREE.Vector3 = new THREE.Vector3();
  let activeCamera: THREE.PerspectiveCamera | THREE.OrthographicCamera = camera;
  const hemisphere: THREE.HemisphereLight = new THREE.HemisphereLight(
    0xffffff,
    0x778396,
    1.2,
  );
  const key: THREE.DirectionalLight = new THREE.DirectionalLight(0xffffff, 3);
  key.position.set(-1, 0.8, 1);
  const fill: THREE.DirectionalLight = new THREE.DirectionalLight(
    0xc7dbff,
    0.6,
  );
  fill.position.set(1, 0.2, -0.7);
  scene.add(hemisphere, key, fill);
  const mount: ReturnType<typeof mountViewer> = mountViewer(
    canvas,
    scene,
    camera,
    (): boolean => {
      controls.update();
      activeCamera = camera;
      return compareFrame();
    },
    {
      preserveDrawingBuffer: true,
      pixelRatio: 1,
      completedFrame: (): Omit<IAutoMovieViewerCompletedFrame, "control"> => ({
        scene,
        camera: activeCamera,
        pass: "beauty",
        elapsedSeconds: 0,
      }),
    },
  );
  type Candidate = Awaited<ReturnType<typeof createRecoveryViewerCandidate>>;
  let current: Candidate | undefined,
    version: number = 0,
    closed: boolean = false,
    loading: boolean = false;
  let pass: "surface" | "overlay" | "construction" = "surface";
  let subject: "generated" | "reference" | "both" = "generated";
  let centre: THREE.Vector3 = new THREE.Vector3(0, 0.05, 0),
    radius: number = 0.08;
  const draw: () => void = (): void => {
    if (closed) throw new Error("Recovery inspector is closed");
    activeCamera = camera;
    if (!compareFrame()) mount.renderer.render(scene, camera);
    mount.completeFrame();
  };
  function compareFrame(): boolean {
    if (subject !== "both" || !current) return false;
    updateAutoMovieComparisonCamera({
      perspective: camera,
      comparison,
      target: controls.target,
      halfSeparation: radius * 0.65,
      offset: comparisonOffset,
    });
    current.generated.position.copy(comparisonOffset);
    current.construction.object.position.copy(comparisonOffset);
    current.reference!.position.copy(comparisonOffset).multiplyScalar(-1);
    activeCamera = comparison;
    mount.renderer.render(scene, comparison);
    return true;
  }
  const visibility: () => void = (): void => {
    if (!current) return;
    if (
      (subject === "reference" || subject === "both") &&
      current.reference === null
    )
      throw new Error("No independent reference model is loaded");
    current.generated.position.set(0, 0, 0);
    current.construction.object.position.set(0, 0, 0);
    if (current.reference) {
      current.reference.position.set(0, 0, 0);
      current.reference.visible =
        subject !== "generated" && pass !== "construction";
    }
    current.generated.visible =
      subject !== "reference" && pass !== "construction";
    current.construction.object.visible =
      subject !== "reference" && pass !== "surface";
    draw();
  };
  const setView: (
    azimuth: number,
    elevation: number,
    distanceScale?: number,
  ) => void = (
    azimuth: number,
    elevation: number,
    distanceScale: number = 1,
  ): void => {
    if (
      ![azimuth, elevation, distanceScale].every(Number.isFinite) ||
      distanceScale <= 0
    )
      throw new Error("Finite camera angles and positive distance required");
    const a: number = (azimuth * Math.PI) / 180,
      e: number = (elevation * Math.PI) / 180;
    const distance: number =
      (radius / Math.sin((camera.fov * Math.PI) / 360)) * 1.15 * distanceScale;
    camera.position.set(
      centre.x + distance * Math.cos(e) * Math.sin(a),
      centre.y + distance * Math.sin(e),
      centre.z + distance * Math.cos(e) * Math.cos(a),
    );
    camera.near = Math.max(radius / 1000, 0.000001);
    camera.far = radius * 100;
    camera.updateProjectionMatrix();
    controls.target.copy(centre);
    controls.update();
    draw();
  };
  const load: (text: string) => Promise<void> = async (
    text: string,
  ): Promise<void> => {
    if (closed) throw new Error("Recovery inspector is closed");
    if (loading) throw new Error("An inspection document is already loading");
    loading = true;
    try {
      const ticket: number = ++version;
      const candidate: Candidate = await createRecoveryViewerCandidate(text);
      const recipe: AutoMovieRecoveryImageRecipe = candidate.recipe;
      if (closed || ticket !== version) {
        await candidate.retire();
        return;
      }
      const previous: Candidate | undefined = current;
      current = candidate;
      subject = "generated";
      element<HTMLSelectElement>("#subject").value = subject;
      scene.add(candidate.generated, candidate.construction.object);
      if (candidate.reference) scene.add(candidate.reference);
      const bounds: THREE.Box3 = new THREE.Box3().setFromObject(
        candidate.generated,
      );
      const sphere: THREE.Sphere = bounds.getBoundingSphere(new THREE.Sphere());
      centre = sphere.center.clone();
      radius = Math.max(sphere.radius, 0.000001);
      for (const field of ["widthScale", "depthScale", "heightScale"] as const)
        element<HTMLInputElement>(`#${field}`).value = String(
          recipe.dimensions[field],
        );
      status.textContent = `Partial coverage\n${candidate.diagnostics.join("\n")}\nDocument SHA-256 ${candidate.documentHash}\nGenerated model SHA-256 ${candidate.modelHash}`;
      if (previous) {
        scene.remove(previous.generated, previous.construction.object);
        if (previous.reference) scene.remove(previous.reference);
        await previous.retire();
      }
      visibility();
      setView(35, 15);
    } finally {
      loading = false;
    }
  };
  const setPass: (value: "surface" | "overlay" | "construction") => void = (
    value: "surface" | "overlay" | "construction",
  ): void => {
    if (!["surface", "overlay", "construction"].includes(value))
      throw new Error("Unknown construction pass");
    if (value === "construction" && subject === "reference")
      throw new Error("Independent reference construction is unavailable");
    pass = value;
    element<HTMLSelectElement>("#pass").value = value;
    visibility();
  };
  const setSubject: (value: "generated" | "reference" | "both") => void = (
    value: "generated" | "reference" | "both",
  ): void => {
    if (!["generated", "reference", "both"].includes(value))
      throw new Error("Unknown subject");
    if (value !== "generated" && !current?.reference)
      throw new Error("No independent reference model is loaded");
    if (value === "reference" && pass === "construction")
      throw new Error("Independent reference construction is unavailable");
    subject = value;
    element<HTMLSelectElement>("#subject").value = value;
    visibility();
  };
  const snapshot: () => object = (): object => ({
    loaded: current !== undefined,
    documentSha256: current?.documentHash ?? null,
    generatedModelSha256: current?.modelHash ?? null,
    referenceModelSha256: current?.referenceHash ?? null,
    referenceSourceSha256: current?.referenceSourceHash ?? null,
    referenceConstruction: "unavailable",
    pass,
    subject,
    displayTransforms: {
      generated: current?.generated.position.toArray() ?? null,
      reference: current?.reference?.position.toArray() ?? null,
      construction: current?.construction.object.position.toArray() ?? null,
    },
    camera: {
      type: activeCamera.type,
      position: activeCamera.position.toArray(),
      target: controls.target.toArray(),
      fov: activeCamera === camera ? camera.fov : null,
      orthographicFrustum:
        activeCamera === comparison
          ? [
              comparison.left,
              comparison.right,
              comparison.top,
              comparison.bottom,
            ]
          : null,
      projectionMatrix: activeCamera.projectionMatrix.toArray(),
      matrixWorld: activeCamera.matrixWorld.toArray(),
      near: activeCamera.near,
      far: activeCamera.far,
      aspect: camera.aspect,
    },
    resolution: [canvas.width, canvas.height],
    lighting: {
      hemisphere: [0xffffff, 0x778396, 1.2],
      key: { color: 0xffffff, intensity: 3, position: key.position.toArray() },
      fill: {
        color: 0xc7dbff,
        intensity: 0.6,
        position: fill.position.toArray(),
      },
    },
    material: "viewer-default-linear-gray-0.8-metallic-0-roughness-0.9",
    diagnostics: current?.diagnostics ?? [],
    renderer: mount.renderer
      .getContext()
      .getParameter(mount.renderer.getContext().VERSION),
  });
  const report: (work: (() => Promise<void>) | (() => void)) => void = (
    work: (() => Promise<void>) | (() => void),
  ): void => {
    Promise.resolve()
      .then(work)
      .catch((error: unknown): void => {
        status.textContent =
          error instanceof Error ? error.message : String(error);
        console.error(error);
      });
  };
  element<HTMLInputElement>("#open").addEventListener(
    "change",
    (): void => {
      const file: File | undefined =
        element<HTMLInputElement>("#open").files?.[0];
      if (file)
        report(
          async (): Promise<void> =>
            load(await readRecoveryViewerDocument(file)),
        );
    },
    { signal: events.signal },
  );
  element<HTMLSelectElement>("#pass").addEventListener(
    "change",
    (): void =>
      report((): void =>
        setPass(
          element<HTMLSelectElement>("#pass").value as
            | "surface"
            | "overlay"
            | "construction",
        ),
      ),
    { signal: events.signal },
  );
  element<HTMLSelectElement>("#subject").addEventListener(
    "change",
    (): void =>
      report((): void =>
        setSubject(
          element<HTMLSelectElement>("#subject").value as
            | "generated"
            | "reference"
            | "both",
        ),
      ),
    { signal: events.signal },
  );
  for (const preset of [
    { name: "Front", a: 0, e: 0 },
    { name: "Back", a: 180, e: 0 },
    { name: "Profile", a: 90, e: 0 },
    { name: "Oblique", a: 35, e: 20 },
    { name: "High", a: 215, e: 55 },
    { name: "Low", a: 135, e: -35 },
  ]) {
    const button: HTMLButtonElement = document.createElement("button");
    button.textContent = preset.name;
    button.addEventListener(
      "click",
      (): void => report((): void => setView(preset.a, preset.e)),
      { signal: events.signal },
    );
    element<HTMLElement>("#views").append(button);
  }
  element<HTMLButtonElement>("#edit").addEventListener(
    "click",
    (): void =>
      report(async (): Promise<void> => {
        if (!current)
          throw new Error("Load a recipe before editing dimensions");
        const recipe: AutoMovieRecoveryImageRecipe = structuredClone(
          current.recipe,
        );
        for (const field of [
          "widthScale",
          "depthScale",
          "heightScale",
        ] as const)
          recipe.dimensions[field] = Number(
            element<HTMLInputElement>(`#${field}`).value,
          );
        await load(
          JSON.stringify({ recipe, reference: current.referenceModel }),
        );
      }),
    { signal: events.signal },
  );
  const dispose: () => Promise<void> = createAutoMovieResourceRetirement([
    (): void => {
      closed = true;
      version++;
      events.abort();
      controls.dispose();
    },
    (): void => mount.stop(),
    async (): Promise<void> => {
      if (current) {
        scene.remove(current.generated, current.construction.object);
        if (current.reference) scene.remove(current.reference);
        await current.retire();
        current = undefined;
      }
    },
  ]);
  const captureMetric: (
    chart: {
      width: number;
      height: number;
      pixelPitchMm: number;
      principalPointPx: [number, number];
      azimuthRadians: number;
    },
    mode: "surface" | "silhouette",
  ) => { png: string; receipt: object } = (
    chart: {
      width: number;
      height: number;
      pixelPitchMm: number;
      principalPointPx: [number, number];
      azimuthRadians: number;
    },
    mode: "surface" | "silhouette",
  ): { png: string; receipt: object } => {
    if (closed) throw new Error("Recovery inspector is closed");
    if (!current) throw new Error("No generated model is loaded");
    if (subject === "both" || pass !== "surface")
      throw new Error(
        "Metric image comparison requires one subject in surface mode",
      );
    const calibrated: THREE.OrthographicCamera =
      createAutoMovieMetricOrthographicCamera({
        ...chart,
        pixelPitchMeters: chart.pixelPitchMm * 0.001,
        distanceMeters: 1,
        nearMeters: 0.001,
        farMeters: 2,
      });
    const png: string = captureAutoMovieMetricFrame({
      renderer: mount.renderer,
      scene,
      camera: calibrated,
      width: chart.width,
      height: chart.height,
      maxPixels: 2_000_000,
      mode,
    });
    const receipt: object = {
      ...snapshot(),
      captureKind: "supplied-horizontal-orthographic",
      chart,
      mode,
      cameraWorld: calibrated.matrixWorld.toArray(),
      projection: calibrated.projectionMatrix.toArray(),
      capturedAt: new Date().toISOString(),
    };
    draw();
    return { png, receipt };
  };
  setView(35, 15);
  return {
    load,
    setView,
    setPass,
    setSubject,
    snapshot,
    captureMetric,
    capture: (): { png: string; receipt: object } => {
      if (!current) throw new Error("No generated model is loaded");
      draw();
      return {
        png: canvas.toDataURL("image/png"),
        receipt: { ...snapshot(), capturedAt: new Date().toISOString() },
      };
    },
    dispose,
  };
}
