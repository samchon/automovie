/**
 * The connected body's display stage keeps its metre-scale camera, lights,
 * clay and companion face while publishing resident numerical frames. Worker
 * replies never alter the scene directly; the panel commits a prepared frame
 * and owns the document paired with it. The face shown beside the body remains
 * display only and never enters the body export.
 */
import * as THREE from "three";

import { createConnectedBodyPreview } from "./connectedBodyPreview";
import type {
  ConnectedBodyRequest,
  ConnectedBodyResult,
} from "./connectedBodyProtocol";
import { createConnectedBodyRenderer } from "./connectedBodyRenderer";
import { createHumanPreviewCamera } from "./previewScene";
import type { HumanResidentPort } from "./residentWorker";
import type { createHumanViewport } from "./viewport";

type Host = Pick<
  Parameters<typeof createHumanViewport>[0],
  "canvas" | "pixelRatio" | "renderer" | "orbit" | "observeResize"
> & {
  worker: () => HumanResidentPort<ConnectedBodyRequest, ConnectedBodyResult>;
  loadTexture: (asset: string) => Promise<THREE.Texture>;
};

/** Assemble the body renderer, resident worker and metre-scale display scene.
 * @evidence requirements/actors/body-authoring/contract.md#actor-body-editor Presents orbit, clay, shadow and companion face controls around the committed posed body.
 * @evidence specifications/asset-and-representation/body-authoring/contract.md#body-spec-editor-view Keeps camera and companion display state separate from numerical body documents.
 */
export function createConnectedBodyViewport(props: Host) {
  const { renderer, canvas } = props;
  renderer.setPixelRatio(Math.min(props.pixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x1c252e);
  scene.add(new THREE.HemisphereLight(0xffeee2, 0x526578, 0.5));
  const shadowLights: THREE.DirectionalLight[] = [];
  for (const [x, y, z, power, color] of [
    [-1.5, 1.75, 2.25, 2.3, 0xffe9d8],
    [1.75, 0.5, 1.5, 0.85, 0xdaeaff],
    [0.5, 1.5, -1.25, 1.6, 0xffffff],
  ]) {
    const light = new THREE.DirectionalLight(color, power);
    light.position.set(x, y, z);
    scene.add(light);
    if (x < 0) {
      shadowLights.push(light);
      light.castShadow = true;
      light.shadow.mapSize.set(4096, 4096);
      Object.assign(light.shadow.camera, {
        left: -1,
        right: 1,
        top: 1,
        bottom: -1,
        near: 0.01,
        far: 10,
      });
      light.shadow.normalBias = 0.004;
      light.shadow.bias = -0.00005;
      light.shadow.camera.updateProjectionMatrix();
    }
  }
  const camera = new THREE.PerspectiveCamera(30, 1, 0.01, 50);
  const orbit = props.orbit(camera);
  orbit.target.set(0, -0.015, 0);
  orbit.enableDamping = true;
  orbit.minDistance = 0.12;
  orbit.maxDistance = 10;
  const clay = new THREE.MeshStandardMaterial({
    color: 0x999999,
    roughness: 0.75,
    side: THREE.DoubleSide,
  });
  let active: THREE.Group | undefined;
  let companion: THREE.Group | undefined;
  let clayEnabled = false;
  const numerical = createConnectedBodyRenderer({
    loadTexture: props.loadTexture,
    maxAnisotropy: renderer.capabilities.getMaxAnisotropy(),
  });
  const preview = createConnectedBodyPreview({
    worker: props.worker,
    renderer: numerical,
  });
  type Model = Awaited<ReturnType<typeof preview.build>>;
  const {
    cameraView,
    fitView,
    resize: resizeCamera,
  } = createHumanPreviewCamera({
    camera,
    orbit,
    model: () => active,
    setSize: (width, height) => renderer.setSize(width, height, false),
  });
  cameraView(0);
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
    ...preview,
    publish: (model: Model): void => {
      const group = numerical.publish(model.frame);
      if (active !== group) {
        if (active !== undefined) scene.remove(active);
        active = group;
        scene.add(group);
      }
    },
    dispose: (model: Model): void => numerical.dispose(model.frame),
    fitView,
    cameraView,
    setClay: (enabled: boolean): void => {
      clayEnabled = enabled;
    },
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
    finish: (): void => {
      render();
      renderer.getContext().finish();
    },
    renderer: () => {
      const gl = renderer.getContext();
      const extension = gl.getExtension("WEBGL_debug_renderer_info");
      return gl.getParameter(extension?.UNMASKED_RENDERER_WEBGL ?? gl.RENDERER);
    },
  };
}
