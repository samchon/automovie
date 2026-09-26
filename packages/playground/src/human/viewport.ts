import type { IAutoMovieModelCrossing } from "@automovie/engine";
import type { IAutoMovieHumanFaceDocument } from "@automovie/human";
import type { JSONDocument } from "@gltf-transform/core";
import * as THREE from "three";

import { createHumanPreviewBuilder } from "./previewBuilder";
import { addHumanPreviewRig } from "./previewRig";
import {
  createHumanPreviewCamera,
  disposeHumanPreview,
  prepareHumanPreview,
} from "./previewScene";

type BuiltFace = {
  group: THREE.Group;
  glb: Uint8Array<ArrayBuffer>;
  gltf: JSONDocument;
  parts: number;
  /** Absent when the port does not measure, null when the request did not ask. */
  crossings?: IAutoMovieModelCrossing[] | null;
  /** Facts the worker described beside the bytes, when it described any. */
  extras?: Record<string, unknown>;
};
/**
 * Own the face preview scene and publication through explicit browser IO ports.
 * Geometry, lighting, camera and frame state remain ordinary in-memory objects;
 * the host alone allocates the GPU, controls, decoder, worker and resize observer.
 * A manual finish draws the same current display state as the animation loop.
 *
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-editor Presents orbitable anatomical previews and clay without changing the numerical document.
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-editor-state Publishes a completed preview while releasing the previously displayed geometry.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-editor-view Owns lighting, display-only clay and camera state independently of browser allocation.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-editor Delegates worker generation isolation to the preview builder and disposes discarded decoded assets.
 */
export function createHumanViewport<
  Document = IAutoMovieHumanFaceDocument,
>(props: {
  /** The selected face document owns schema admission before worker allocation. */
  serialize: (document: Document) => string;
  canvas: { getBoundingClientRect: () => Pick<DOMRect, "width" | "height"> };
  pixelRatio: number;
  renderer: {
    capabilities: Pick<THREE.WebGLCapabilities, "getMaxAnisotropy">;
    setPixelRatio: (ratio: number) => void;
    outputColorSpace: string;
    toneMapping: THREE.ToneMapping;
    toneMappingExposure: number;
    shadowMap: Pick<THREE.WebGLShadowMap, "enabled" | "type">;
    setSize: (width: number, height: number, updateStyle: boolean) => void;
    setAnimationLoop: (callback: () => void) => void;
    render: (scene: THREE.Scene, camera: THREE.PerspectiveCamera) => void;
    getContext: () => {
      finish: () => void;
      getExtension: (
        name: string,
      ) => { UNMASKED_RENDERER_WEBGL: number } | null;
      getParameter: (parameter: number) => unknown;
      RENDERER: number;
    };
  };
  orbit: (camera: THREE.PerspectiveCamera) => {
    target: THREE.Vector3;
    enableDamping: boolean;
    minDistance: number;
    maxDistance: number;
    update: () => unknown;
  };
  worker: Parameters<typeof createHumanPreviewBuilder<BuiltFace>>[0]["worker"];
  decode: (bytes: ArrayBuffer) => Promise<THREE.Group>;
  observeResize: (callback: () => void) => void;
  /**
   * The half extent of the subject in metres: 0.2 frames a head and is the
   * default; a whole body passes about 1. Lights, the shadow frustum and the
   * orbit's reach scale with it so the same scene serves both.
   */
  extent?: number;
}) {
  const { renderer, canvas } = props;
  const scale = (props.extent ?? 0.2) / 0.2;
  renderer.setPixelRatio(Math.min(props.pixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x1c252e);
  const shadowLights = addHumanPreviewRig({
    scene,
    renderer,
    scale: scale,
  });
  const camera = new THREE.PerspectiveCamera(30, 1, 0.01, 10 * scale);
  const orbit = props.orbit(camera);
  orbit.target.set(0, -0.015, 0);
  orbit.enableDamping = true;
  orbit.minDistance = 0.12;
  orbit.maxDistance = 2 * scale;
  const clay = new THREE.MeshStandardMaterial({
    color: 0x999999,
    roughness: 0.75,
    side: THREE.DoubleSide,
  });
  let active: BuiltFace | undefined;
  let clayEnabled = false;
  // A companion is a second decoded group shown beside the active model and
  // placed by the host: the face seated on a body's head. It is never part of
  // the document, the export or the fit; the host owns its lifetime.
  let companion: THREE.Group | undefined;
  const dispose = disposeHumanPreview;
  const { build, cancel } = createHumanPreviewBuilder<BuiltFace, Document>({
    serialize: props.serialize,
    worker: props.worker,
    decode: async (result) => {
      const group = await props.decode(
        result.glb.buffer.slice(
          result.glb.byteOffset,
          result.glb.byteOffset + result.glb.byteLength,
        ),
      );
      try {
        prepareHumanPreview(group, renderer.capabilities.getMaxAnisotropy());
      } catch (error) {
        disposeHumanPreview(group);
        throw error;
      }
      return { ...result, group };
    },
    dispose: (model) => dispose(model.group),
  });
  const {
    cameraView,
    fitView,
    resize: resizeCamera,
  } = createHumanPreviewCamera({
    camera,
    orbit,
    model: () => active?.group,
    setSize: (width, height) => renderer.setSize(width, height, false),
  });
  cameraView(0);
  const publish = (built: BuiltFace): void => {
    if (active !== built) {
      if (active !== undefined) {
        scene.remove(active.group);
        dispose(active.group);
      }
      active = built;
      scene.add(built.group);
    }
  };
  const resize = (): void => {
    const rect = canvas.getBoundingClientRect();
    resizeCamera(rect.width, rect.height);
  };
  props.observeResize(resize);
  resize();
  const render = (): void => {
    orbit.update();
    scene.overrideMaterial = clayEnabled ? clay : null;
    renderer.render(scene, camera);
  };
  renderer.setAnimationLoop(render);

  return {
    build,
    cancel,
    publish,
    dispose: (model: BuiltFace) => dispose(model.group),
    fitView,
    cameraView,
    setClay: (enabled: boolean): void => {
      clayEnabled = enabled;
    },
    // A cast-shadow boundary can resemble a crease in the anatomical surface.
    // Toggle only the shadow casters: direct light, materials, geometry and the
    // saved document stay fixed, so the two views isolate that ambiguity.
    // Changing the light's shadow count also refreshes Three's shader variant.
    setShadows: (enabled: boolean): void => {
      for (const light of shadowLights) light.castShadow = enabled;
    },
    companion: {
      show: (group: THREE.Group | undefined): void => {
        if (companion !== undefined) scene.remove(companion);
        companion = group;
        if (group !== undefined) scene.add(group);
      },
      place: (matrix: THREE.Matrix4): void => {
        if (companion === undefined) return;
        companion.matrixAutoUpdate = false;
        companion.matrix.copy(matrix);
        companion.matrixWorldNeedsUpdate = true;
      },
    },
    finish: () => {
      render();
      renderer.getContext().finish();
    },
    renderer: () => {
      const gl = renderer.getContext(),
        extension = gl.getExtension("WEBGL_debug_renderer_info");
      return gl.getParameter(extension?.UNMASKED_RENDERER_WEBGL ?? gl.RENDERER);
    },
  };
}
