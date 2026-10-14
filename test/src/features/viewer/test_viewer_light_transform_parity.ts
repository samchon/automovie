import { Quaternion, resolveShotLighting } from "@automovie/engine";
import {
  IAutoMovieClip,
  IAutoMovieLight,
  IAutoMovieQuaternion,
  IAutoMovieScene,
  IAutoMovieVector3,
} from "@automovie/interface";
import { applyLightMotion, buildLight, buildScene } from "@automovie/viewer";
import { TestValidator } from "@nestia/e2e";
import * as THREE from "three";

import { namedFacts, vclose } from "../internal/predicates";

const keyed: (q: IAutoMovieQuaternion) => number[] = (
  q: IAutoMovieQuaternion,
): number[] => [q.x, q.y, q.z, q.w];

const aboutY: (deg: number) => IAutoMovieQuaternion = (
  deg: number,
): IAutoMovieQuaternion => Quaternion.fromAxisAngle({ x: 0, y: 1, z: 0 }, deg);

const scene: IAutoMovieScene = {
  id: "scene-1",
  name: null,
  nodes: [],
  cameras: [],
  lights: [
    {
      id: "lamp",
      type: "spot",
      transform: {
        translation: { x: 2, y: 4, z: 0 },
        rotation: { x: 0, y: 0, z: 0, w: 1 },
        scale: { x: 1, y: 1, z: 1 },
      },
      color: { r: 1, g: 1, b: 1, a: null, hex: null },
      intensity: 2,
      range: 10,
      coneAngle: 40,
    },
  ],
  space: null,
};

/** The lamp swinging a quarter turn about Y across a four-second beat. */
const swing: IAutoMovieClip = {
  id: "lampSwings",
  name: null,
  duration: 4,
  loop: false,
  tracks: [
    {
      channel: {
        kind: "pointer",
        pointer: "/lights/lamp/rotation",
        valueType: "quaternion",
      },
      times: [0, 4],
      values: [...keyed(aboutY(0)), ...keyed(aboutY(90))],
      interpolation: "linear",
    },
  ],
};

/** The artifact's own direction: the light's local −Z carried by its rotation. */
const declaredDirection: (light: IAutoMovieLight) => IAutoMovieVector3 = (
  light: IAutoMovieLight,
): IAutoMovieVector3 =>
  Quaternion.rotateVector(light.transform.rotation, { x: 0, y: 0, z: -1 });

/**
 * Read the normalized world position-to-target aiming vector supplied to native lighting, without a rendered illumination observation.
 */
const renderedDirection: (light: THREE.Light) => IAutoMovieVector3 = (
  light: THREE.Light,
): IAutoMovieVector3 => {
  const aimed: THREE.SpotLight = light as THREE.SpotLight;
  aimed.updateMatrixWorld(true);
  const from: THREE.Vector3 = new THREE.Vector3();
  const to: THREE.Vector3 = new THREE.Vector3();
  aimed.getWorldPosition(from);
  aimed.target.getWorldPosition(to);
  const direction: THREE.Vector3 = to.sub(from).normalize();
  return { x: direction.x, y: direction.y, z: direction.z };
};

/** The engine's resolved lamp at `seconds`. */
const resolvedAt: (seconds: number) => IAutoMovieLight = (
  seconds: number,
): IAutoMovieLight =>
  resolveShotLighting({ lights: scene.lights, clips: [swing], seconds })[0]!;

/**
 * Interpolate the authored keys independently with native Three quaternion arithmetic.
 *
 * The other comparisons share the Engine's resolved direction. Direct keyframe interpolation distinguishes a shared sampling error without calling that resolver a second time.
 */
const keyedMidpointDirection: () => IAutoMovieVector3 =
  (): IAutoMovieVector3 => {
    const values: number[] = swing.tracks[0]!.values;
    const midpoint: THREE.Quaternion = new THREE.Quaternion()
      .fromArray(values.slice(0, 4))
      .slerp(new THREE.Quaternion().fromArray(values.slice(4, 8)), 0.5);
    const direction: THREE.Vector3 = new THREE.Vector3(
      0,
      0,
      -1,
    ).applyQuaternion(midpoint);
    return { x: direction.x, y: direction.y, z: direction.z };
  };

/**
 * Initial light construction and animated updates install the resolved aiming direction on actual native light objects.
 *
 * Both paths write through applyLightState. The cases distinguish an animated transform that updates the target from one that retains its original aim.
 *
 * World target minus light position is compared with the resolved local negative-Z axis and a separate Three quaternion interpolation. These are CPU-side native lighting inputs, without a rendered illumination oracle.
 *
 * Scenarios:
 *
 * 1. A built staged light has the declared aiming vector before any animation update.
 * 2. Start, midpoint and end updates follow the Engine's resolved transform.
 * 3. Three's interpolation of the authored keys supplies an independent direction reference, distinguishing a shared applyLightState path from a correct motion resolver.
 *
 * @evidence contracts/testing.md#behavioral-verification Builds a staged spot and applies resolved light motion at selected times, reading native light/target world vectors and positions; catches build and frame writers disagreeing on absolute transform or leaving the target at its initial aim.
 * @evidence contracts/testing.md#independent-expectations Authored endpoint keys and an independent Three quaternion slerp define the midpoint direction; Engine resolveLightMotion is a shared contract reference for resolved fields, so the independent key interpolation prevents parity alone from blessing the same sampling error.
 * @evidence contracts/testing.md#distinguishing-cases Covers initial construction and resolved start/midpoint/end aiming vectors, then an independently interpolated midpoint; absolute translation, point-light absence of aim and other light kinds have separate coverage obligations.
 * @evidence contracts/testing.md#execution-ownership This named synchronous unit exercises maintained source with actual CPU-side native light objects and clip records, creating no renderer, browser, GPU, process or new fixture host; world-vector parity is not pixel evidence.
 */
export function test_viewer_light_transform_parity(): void {
  // 1. the build path alone is already correct.
  const staged: THREE.Light = buildLight(scene.lights[0]!);
  TestValidator.predicate(
    "a staged light shines along the direction its artifact declares",
    vclose(renderedDirection(staged), declaredDirection(scene.lights[0]!)),
  );

  // 2. the frame follows the declaration, at three instants.
  const built: ReturnType<typeof buildScene> = buildScene(
    scene,
    (): undefined => undefined,
  );
  const lamp: THREE.Light = built.lights.get("lamp")!;
  const parityAt: (seconds: number) => boolean = (seconds: number): boolean => {
    applyLightMotion(
      scene.lights,
      [swing],
      seconds,
      (id: string): THREE.Light | undefined => built.lights.get(id),
    );
    return vclose(
      renderedDirection(lamp),
      declaredDirection(resolvedAt(seconds)),
    );
  };
  TestValidator.equals(
    "native aiming equals resolved direction at the three selected instants",
    namedFacts([
      ["atTheStart", (): boolean => parityAt(0)],
      ["atTheMidpoint", (): boolean => parityAt(2)],
      ["atTheEnd", (): boolean => parityAt(4)],
    ]),
    { atTheStart: true, atTheMidpoint: true, atTheEnd: true },
  );

  // 3. the animated frame against arithmetic the engine took no part in.
  applyLightMotion(
    scene.lights,
    [swing],
    2,
    (id: string): THREE.Light | undefined => built.lights.get(id),
  );
  TestValidator.predicate(
    "the animated lamp shines where the clip's own keys put it, interpolated independently",
    vclose(renderedDirection(lamp), keyedMidpointDirection()),
  );
}
