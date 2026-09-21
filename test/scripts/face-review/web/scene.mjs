/** Own the inspection scene and its independent metric calibration primitives.
 * One call creates the GPU context, cameras, controls, lights and shared display
 * materials. The caller owns their lifetime and the mutable subject/camera state.
 * Geometry and camera positions use metres; this module never transforms a face.
 */
import * as THREE from "three";

import { OrbitControls } from "/OrbitControls.js";
import { portraitWebHardwareRenderer } from "/logic.mjs";

export function createPortraitWebScene(slot) {
  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    preserveDrawingBuffer: true,
  });
  renderer.setPixelRatio(1);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1;
  slot.append(renderer.domElement);
  const gl = renderer.getContext();
  const debug = gl.getExtension("WEBGL_debug_renderer_info");
  const device = debug
    ? gl.getParameter(debug.UNMASKED_RENDERER_WEBGL)
    : "unknown";
  const hardware = portraitWebHardwareRenderer(device);
  console.log("RENDERER", device);
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0.025, 0.033, 0.047);
  const perspective = new THREE.PerspectiveCamera(30, 0.9, 0.001, 10);
  const orthographic = new THREE.OrthographicCamera(
    -0.1,
    0.1,
    0.1,
    -0.1,
    0.001,
    10,
  );
  const controls = new OrbitControls(perspective, renderer.domElement);
  controls.minDistance = 0.02;
  controls.maxDistance = 3;
  const lights = new THREE.Group();
  scene.add(lights);
  const calibration = new THREE.Group();
  const cube = new THREE.Mesh(
    new THREE.BoxGeometry(0.015, 0.015, 0.015),
    new THREE.MeshBasicMaterial({ color: 0xff4025 }),
  );
  cube.position.set(0.115, 0.035, 0.08);
  calibration.add(cube);
  const origin = new THREE.Vector3(0.095, 0.01, 0.08);
  for (const [direction, color] of [
    [new THREE.Vector3(1, 0, 0), 0xff4025],
    [new THREE.Vector3(0, 1, 0), 0x45ee75],
    [new THREE.Vector3(0, 0, 1), 0x458bff],
  ])
    calibration.add(
      new THREE.ArrowHelper(direction, origin, 0.025, color, 0.006, 0.003),
    );
  scene.add(calibration);
  const clay = new THREE.MeshStandardMaterial({
    color: new THREE.Color(0.35, 0.35, 0.35),
    roughness: 0.72,
    side: THREE.DoubleSide,
  });
  const wire = new THREE.MeshBasicMaterial({
    color: 0xb9d3e8,
    wireframe: true,
    side: THREE.DoubleSide,
  });
  return {
    renderer,
    gl,
    device,
    hardware,
    scene,
    perspective,
    orthographic,
    controls,
    lights,
    calibration,
    clay,
    wire,
  };
}
