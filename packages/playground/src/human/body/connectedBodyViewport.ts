/**
 * The connected body's display stage keeps its metre-scale camera, lights,
 * clay and companion face while publishing resident numerical frames. Worker
 * replies never alter the scene directly; the panel commits a prepared frame
 * and owns the document paired with it. The face shown beside the body remains
 * display only and never enters the body export.
 * The viewport owns static shadow invalidation for publication, observation
 * visibility and pass, caster toggles, and companion membership or placement.
 */
import type {
  IAutoMovieHumanBodyBasisDocument,
  IAutoMovieHumanPersonDocument,
} from "@automovie/human";
import * as THREE from "three";

import { createHumanObservation } from "../common/observation/createHumanObservation";
import { createHumanPreviewCamera } from "../common/previewScene";
import type { IConnectedBodyInspectionLight } from "./IConnectedBodyInspectionLight";
import type { IConnectedBodyInspectionLightDirection } from "./IConnectedBodyInspectionLightDirection";
import type { IConnectedBodyViewportHost } from "./IConnectedBodyViewportHost";
import { createConnectedBodyPreview } from "./connectedBodyPreview";
import { createConnectedBodyRenderer } from "./connectedBodyRenderer";

/** Assemble the body renderer, resident worker and metre-scale display scene.
 * @evidence requirements/actors/body-authoring/contract.md#actor-body-editor Presents orbit, clay, shadow, companion face and named inspection-light controls around the committed posed body.
 * @evidence specifications/asset-and-representation/body-authoring/contract.md#body-spec-editor-view Keeps camera, companion and normalized inspection-light direction in renderer state, preserving each light's distance and restoring studio defaults without changing numerical body documents.
 */
export function createConnectedBodyViewport<
  Document extends
    | IAutoMovieHumanBodyBasisDocument
    | IAutoMovieHumanPersonDocument = IAutoMovieHumanBodyBasisDocument,
>(props: IConnectedBodyViewportHost<Document>) {
  const { renderer, canvas } = props;
  renderer.setPixelRatio(Math.min(props.pixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.shadowMap.autoUpdate = false;
  renderer.shadowMap.needsUpdate = true;
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x1c252e);
  scene.add(new THREE.HemisphereLight(0xffeee2, 0x526578, 0.5));
  const shadowLights: THREE.DirectionalLight[] = [];
  const directional = new Map<string, IConnectedBodyInspectionLight>();
  for (const [name, x, y, z, power, color] of [
    ["key", -1.5, 1.75, 2.25, 2.3, 0xffe9d8],
    ["fill", 1.75, 0.5, 1.5, 0.85, 0xdaeaff],
    ["rim", 0.5, 1.5, -1.25, 1.6, 0xffffff],
  ] as const) {
    const light = new THREE.DirectionalLight(color, power);
    light.name = name;
    light.position.set(x, y, z);
    directional.set(name, { light, rest: light.position.clone() });
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
  const observation = createHumanObservation({
    scene,
    camera,
    orbit,
    roots: () => (active === undefined ? [] : [active]),
    clay,
    height: () => canvas.getBoundingClientRect().height,
    invalidateShadows: () => {
      renderer.shadowMap.needsUpdate = true;
    },
  });
  const numerical = createConnectedBodyRenderer({
    loadTexture: props.loadTexture,
    maxAnisotropy: renderer.capabilities.getMaxAnisotropy(),
  });
  const preview = createConnectedBodyPreview<Document>({
    worker: props.worker,
    renderer: numerical,
    serialize: props.serialize,
    source: props.source,
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
    observation.apply();
    scene.overrideMaterial = observation.override(clayEnabled);
    renderer.render(scene, camera);
  };
  renderer.setAnimationLoop(render);
  return {
    ...preview,
    publish: (model: Model): void => {
      observation.restore();
      const group = numerical.publish(model.frame);
      renderer.shadowMap.needsUpdate = true;
      if (active !== group) {
        if (active !== undefined) scene.remove(active);
        active = group;
        scene.add(group);
      }
    },
    dispose: (model: Model): void => {
      observation.restore();
      numerical.dispose(model.frame);
    },
    fitView,
    cameraView,
    observe: observation.hooks,
    setClay: (enabled: boolean): void => {
      clayEnabled = enabled;
      renderer.shadowMap.needsUpdate = true;
    },
    setShadows: (enabled: boolean): void => {
      for (const light of shadowLights) light.castShadow = enabled;
      renderer.shadowMap.needsUpdate = true;
    },
    /**
     * Change one named inspection light's direction while retaining its
     * original distance, colour, intensity and caster policy. All three lights
     * target the world origin. The dimensionless direction points from that
     * origin toward the light in the displayed Y-up, Z-forward frame.
     * Each call restores the other lights; null restores the whole studio.
     * Unknown names and nonfinite or zero norms refuse before any mutation.
     * Scaling by the largest component before normalization also keeps
     * finite subnormal and very large directions representable. This affects
     * display only, never the numerical model, document or exported bytes.
     */
    setLightDirection: (
      input: IConnectedBodyInspectionLightDirection | null,
    ): void => {
      const selected = input === null ? null : directional.get(input.name);
      if (selected === undefined)
        throw new Error("Unknown inspection light: " + input!.name);
      const magnitude = input === null ? 1 : Math.hypot(...input.direction);
      if (!Number.isFinite(magnitude) || magnitude === 0)
        throw new Error(
          "An inspection light needs a finite nonzero direction.",
        );
      let changed = false;
      for (const one of directional.values()) {
        const goal = one.rest.clone();
        if (input !== null && one === selected) {
          const distance = one.rest.length();
          const scale = Math.max(...input.direction.map(Math.abs));
          const norm = Math.hypot(...input.direction.map((x) => x / scale));
          goal.set(
            (input.direction[0] / scale / norm) * distance,
            (input.direction[1] / scale / norm) * distance,
            (input.direction[2] / scale / norm) * distance,
          );
        }
        if (!one.light.position.equals(goal)) {
          one.light.position.copy(goal);
          changed = true;
        }
      }
      if (changed) renderer.shadowMap.needsUpdate = true;
    },
    companion: {
      show: (group: THREE.Group | undefined): void => {
        if (companion !== undefined) scene.remove(companion);
        companion = group;
        if (group !== undefined) scene.add(group);
        renderer.shadowMap.needsUpdate = true;
      },
      place: (matrix: THREE.Matrix4): void => {
        if (companion === undefined) return;
        companion.matrixAutoUpdate = false;
        companion.matrix.copy(matrix);
        companion.matrixWorldNeedsUpdate = true;
        renderer.shadowMap.needsUpdate = true;
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
