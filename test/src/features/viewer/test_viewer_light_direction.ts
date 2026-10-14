import { stageScene } from "@automovie/engine";
import {
  IAutoMovieScene,
  IAutoMovieStageLight,
  IAutoMovieVector3,
} from "@automovie/interface";
import { type IAutoMovieModelObject, buildScene } from "@automovie/viewer";
import { TestValidator } from "@nestia/e2e";
import * as THREE from "three";

import { namedFacts, nclose, vclose } from "../internal/predicates";

/** Stage a scene carrying exactly the given light placements. */
const stagedWith: (lights: IAutoMovieStageLight[]) => IAutoMovieScene = (
  lights: IAutoMovieStageLight[],
): IAutoMovieScene => {
  const staged: ReturnType<typeof stageScene> = stageScene(
    {
      logline: "one lit beat",
      theme: "light",
      cast: [{ node: "hero", character: "the subject", modelRef: null }],
      beats: [{ id: "b1", name: "one", summary: "the beat", durationHint: 1 }],
    },
    {
      plan: "one subject, one camera, and exactly the lights under test",
      scene: { id: "scene-1", name: "a lit set" },
      actors: [{ node: "hero", position: { x: 0, y: 0, z: 0 }, facingDeg: 0 }],
      cameras: [
        {
          node: "cam",
          position: { x: 0, y: 1.5, z: 3 },
          lookAt: { kind: "node", node: "hero" },
          fovDeg: 40,
          near: 0.1,
          far: 1000,
          depthPrecision: { minimumDepthBits: 24, maximumStepMeters: 100 },
        },
      ],
      lights,
    },
  );
  if (staged.success === false)
    throw new Error(`staging refused: ${JSON.stringify(staged.violations)}`);
  return staged.scene;
};

/** Build the staged scene through the viewer with placeholder model objects. */
const built: (scene: IAutoMovieScene) => THREE.Scene = (
  scene: IAutoMovieScene,
): THREE.Scene =>
  buildScene(
    scene,
    (): IAutoMovieModelObject => ({
      object: new THREE.Group(),
      bones: new Map(),
      parts: new Map(),
    }),
  ).scene;

const lightsOf: (scene: THREE.Scene) => THREE.Light[] = (
  scene: THREE.Scene,
): THREE.Light[] => {
  const found: THREE.Light[] = [];
  scene.traverse((object: THREE.Object3D<THREE.Object3DEventMap>): void => {
    if ((object as THREE.Light).isLight === true)
      found.push(object as THREE.Light);
  });
  return found;
};

/**
 * Read the native aiming input as the normalized world target-minus-position vector, rather than the light's own quaternion; no illumination is drawn.
 */
const shineDirection: (
  light: THREE.DirectionalLight | THREE.SpotLight,
) => IAutoMovieVector3 = (
  light: THREE.DirectionalLight | THREE.SpotLight,
): IAutoMovieVector3 => {
  light.updateMatrixWorld(true);
  const from: THREE.Vector3 = new THREE.Vector3();
  const to: THREE.Vector3 = new THREE.Vector3();
  light.getWorldPosition(from);
  light.target.getWorldPosition(to);
  const d: THREE.Vector3 = to.sub(from).normalize();
  return { x: d.x, y: d.y, z: d.z };
};

const unit: (v: IAutoMovieVector3) => IAutoMovieVector3 = (
  v: IAutoMovieVector3,
): IAutoMovieVector3 => {
  const length: number = Math.hypot(v.x, v.y, v.z);
  return { x: v.x / length, y: v.y / length, z: v.z / length };
};

/**
 * Staged aimed lights preserve their authored direction in the native position-to-target vector.
 *
 * Stage lowers the direction into a scene rotation, while Three directional and spot lights use their target positions for aiming. Reading the resulting vector distinguishes a correctly installed target from a quaternion that leaves the native target at its default origin.
 *
 * The literal authored direction is compared with target minus position on actual CPU-side light objects. This observes the input to native lighting, without drawing a lit frame.
 *
 * Scenarios:
 *
 * 1. Downward, upward and diagonal directional lights have the authored unit aiming vector.
 * 2. A translated spot preserves its authored direction independently of the world origin.
 * 3. A point light has no aiming target and preserves its position and range.
 *
 * @evidence contracts/testing.md#behavioral-verification Stages and builds aimed/point lights, updates world matrices and reads the target-minus-light vector; catches discarded authored direction, an unparented origin target or adding an aim target to an omnidirectional point light.
 * @evidence contracts/testing.md#independent-expectations Normalized authored vectors and literal point position/range define finite numerical expectations independently of the Viewer aim writer; SDK object vectors are observed without claiming rendered lighting, shadow pixels or a hardware frame.
 * @evidence contracts/testing.md#distinguishing-cases Contrasts upward/downward/diagonal directional aims, an off-origin spot aimed away from the origin, and a point light retaining position/range without a target; animated interpolation is owned by the parity test.
 * @evidence contracts/testing.md#execution-ownership This named synchronous unit calls existing Engine staging and Viewer factories with CPU-side Three lights and scene graphs, starting no GPU, browser, worker or process and adding no runtime host.
 */
export function test_viewer_light_direction(): void {
  // 1. directional, three authored directions
  for (const direction of [
    { x: 0, y: -1, z: 0 },
    { x: 0, y: 1, z: 0 },
    { x: -1, y: -2, z: 0.5 },
  ]) {
    const scene: THREE.Scene<THREE.Object3DEventMap> = built(
      stagedWith([
        { node: "sun", type: "directional", direction, intensity: 1 },
      ]),
    );
    const light: THREE.DirectionalLight = lightsOf(
      scene,
    )[0] as THREE.DirectionalLight;
    const shine: IAutoMovieVector3 = shineDirection(light);
    TestValidator.predicate(
      `a directional light shines along ${JSON.stringify(direction)}`,
      vclose(shine, unit(direction), 1e-6),
    );
    TestValidator.predicate(
      `its shine vector has unit length, never the zero vector ${JSON.stringify(direction)}`,
      nclose(Math.hypot(shine.x, shine.y, shine.z), 1, 1e-6),
    );
  }

  // 2. a spot far from the origin aims where it was told, not at (0, 0, 0)
  const spotDirection: { x: number; y: number; z: number } = {
    x: -1,
    y: -1,
    z: 0,
  };
  const spotScene: THREE.Scene<THREE.Object3DEventMap> = built(
    stagedWith([
      {
        node: "lamp",
        type: "spot",
        position: { x: 2, y: 3, z: 0 },
        direction: spotDirection,
        intensity: 5,
        coneAngle: 30,
      },
    ]),
  );
  const spot: THREE.SpotLight = lightsOf(spotScene)[0] as THREE.SpotLight;
  TestValidator.predicate(
    "a spot light shines along its authored direction, not at the origin",
    vclose(shineDirection(spot), unit(spotDirection), 1e-6),
  );
  // Aiming from (2, 3, 0) toward the origin gives a different vector from the authored direction.
  TestValidator.predicate(
    "aiming at the origin would have been a different direction",
    vclose(shineDirection(spot), unit({ x: -2, y: -3, z: 0 }), 1e-6) === false,
  );

  // 3. A point light carries no aiming target.
  const pointScene: THREE.Scene<THREE.Object3DEventMap> = built(
    stagedWith([
      {
        node: "candle",
        type: "point",
        position: { x: 1, y: 2, z: -1 },
        intensity: 3,
        range: 8,
      },
    ]),
  );
  const point: THREE.PointLight = lightsOf(pointScene)[0] as THREE.PointLight;
  TestValidator.equals(
    "a point light keeps its position and range and carries no aiming target",
    namedFacts([
      ["pointPositionX", (): boolean => nclose(point.position.x, 1, 0)],
      ["pointPositionY", (): boolean => nclose(point.position.y, 2, 0)],
      ["pointPositionZ", (): boolean => nclose(point.position.z, -1, 0)],
      ["pointDistance", (): boolean => nclose(point.distance, 8, 0)],
      ["pointChildren", (): boolean => point.children.length === 0],
    ]),
    {
      pointPositionX: true,
      pointPositionY: true,
      pointPositionZ: true,
      pointDistance: true,
      pointChildren: true,
    },
  );
}
