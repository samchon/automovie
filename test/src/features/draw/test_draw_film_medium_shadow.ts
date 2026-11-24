import type { IAutoMovieFilmOptics } from "@automovie/interface";
import {
  AutoMovieFilmResponseStage,
  applySceneMedium,
} from "@automovie/render";
import { TestValidator } from "@nestia/e2e";
import * as THREE from "three";

import { createFilmResponseRendererDouble } from "./createFilmResponseRendererDouble";
import { locateFilmPixel } from "./locateFilmPixel";
import { marchFilmMediumPixel } from "./marchFilmMediumPixel";

/**
 * A shadow-casting spot light draws a lit cone in the haze, and an object in
 * the beam cuts the cone beyond it.
 *
 * Scenarios:
 *
 * 1. A shadow-casting spot light with a 6° half-angle, the only light, shines
 *    across the view 5 m in front of the camera, over a black background. A
 *    pixel whose ray crosses the cone is more than 10 times brighter than one
 *    whose ray passes above it, which shows nothing.
 * 2. A box placed in the beam leaves the cone beyond it more than 10 times darker
 *    than the cone before it.
 * 3. Without the box the same ray beyond is more than 10 times brighter than with
 *    it, so the darkening is the box's shadow and not the beam's spread.
 *
 * The pixels come from the CPU reference of the 64-step march, fed the uniforms
 * the medium pass handed its program, its shadow matrix and bias among them.
 * The shadow map is read as the renderer would draw it: each texel holds the
 * window depth, in the light's shadow camera, of the nearest mesh along that
 * camera's ray through the texel, found by a ray cast, and a step is lit where
 * its own shadow depth plus the bias does not exceed it, as the program's
 * comparison sampler tests. The GPU program's pixels are a capture's to read.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Lists the light, the box, the three pixels and the expected ratios, and how the shadow map is stood in for.
 * @evidence contracts/development/testing.md#behavioral-verification Draws through the film response stage over a recording renderer whose shadow maps are on, takes the march program's spot, cone, shadow-matrix and bias uniforms and evaluates the march with the shadow test; a cone read from the wrong direction, a shadow matrix that misplaces the map or a shadow never consulted fails.
 * @evidence contracts/development/testing.md#independent-expectations Issue #4084's acceptance ratios: at least 10 times brighter across the cone than beside it, and at least 10 times darker beyond an occluder than before it.
 * @evidence contracts/development/testing.md#distinguishing-cases A ray through the cone, one beside it, one through the shadowed cone, and the same ray with the occluder removed. The stand-in map is a ray cast, so the GPU's map resolution and filtering are the capture's to judge.
 * @evidence contracts/development/testing.md#execution-ownership A portable unit over a recording renderer and a CPU reference; no GPU starts.
 */
export function test_draw_film_medium_shadow(): void {
  const width: number = 128;
  const height: number = 72;
  const optics: IAutoMovieFilmOptics = { ev100: 0, toneMapping: "none" };
  const camera: THREE.PerspectiveCamera = new THREE.PerspectiveCamera(
    60,
    16 / 9,
    0.1,
    12,
  );
  const scene: THREE.Scene = new THREE.Scene();
  const lamp: THREE.SpotLight = new THREE.SpotLight(
    0xffffff,
    1000,
    0,
    (6 * Math.PI) / 180,
    0,
  );
  lamp.position.set(-3, 0, -5);
  lamp.target.position.set(3, 0, -5);
  lamp.castShadow = true;
  scene.add(lamp, lamp.target);
  const box: THREE.Mesh = new THREE.Mesh(
    new THREE.BoxGeometry(0.4, 1, 1),
    new THREE.MeshStandardMaterial(),
  );
  box.position.set(0.2, 0, -5);
  scene.add(box);
  applySceneMedium(scene, { scattering: 0.1, absorption: 0, anisotropy: 0 });

  // The map the renderer would draw, as the medium pass reads a spot light's.
  scene.updateMatrixWorld(true);
  lamp.shadow.updateMatrices(lamp);
  const depth: THREE.DepthTexture = new THREE.DepthTexture(256, 256);
  depth.compareFunction = THREE.LessEqualCompare;
  lamp.shadow.map = new THREE.WebGLRenderTarget(256, 256, {
    depthTexture: depth,
  });

  const stage: AutoMovieFilmResponseStage = new AutoMovieFilmResponseStage();
  const double: createFilmResponseRendererDouble.IDouble =
    createFilmResponseRendererDouble({
      toneMapping: THREE.NoToneMapping,
      exposure: 1,
    });
  double.renderer.shadowMap.enabled = true;
  stage.draw({
    renderer: double.renderer,
    scene,
    camera,
    optics,
    seconds: 0,
    width,
    height,
  });
  const program: Record<string, unknown> = double.renders[1]!.program!;
  const matrix: THREE.Matrix4 = new THREE.Matrix4().fromArray(
    program.uShadowMatrix0 as number[],
  );
  const bias: number = program.uBias0 as number;
  const shadowCamera: THREE.Camera = lamp.shadow.camera;
  const occluders: THREE.Object3D[] = [box];
  const shadow: (light: number, point: THREE.Vector3) => number = (
    _light: number,
    point: THREE.Vector3,
  ): number => {
    const c: THREE.Vector4 = new THREE.Vector4(
      point.x,
      point.y,
      point.z,
      1,
    ).applyMatrix4(matrix);
    const x: number = c.x / c.w;
    const y: number = c.y / c.w;
    const z: number = c.z / c.w + bias;
    if (x < 0 || x > 1 || y < 0 || y > 1 || z > 1) return 1;
    const raycaster: THREE.Raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(
      new THREE.Vector2(x * 2 - 1, y * 2 - 1),
      shadowCamera,
    );
    const hit: THREE.Intersection | undefined = raycaster.intersectObjects(
      occluders,
      false,
    )[0];
    const stored: number =
      hit === undefined
        ? 1
        : hit.point.clone().project(shadowCamera).z * 0.5 + 0.5;
    return z <= stored ? 1 : 0;
  };
  const read: (toward: THREE.Vector3) => number = (
    toward: THREE.Vector3,
  ): number =>
    marchFilmMediumPixel({
      program,
      kinds: ["spot"],
      ...locateFilmPixel({ camera, scene, width, height, toward }),
      color: [0, 0, 0, 1],
      shadow,
    })[0]!;

  // 1. Across the cone and beside it.
  const before: number = read(new THREE.Vector3(-1.2, 0, -5));
  const above: number = read(new THREE.Vector3(-1.2, 1.5, -5));
  TestValidator.predicate(
    `the cone glows against the dark beside it (${before.toFixed(3)} against ${above.toFixed(3)})`,
    before > 0 && before > 10 * above,
  );

  // 2. Beyond the box.
  const beyond: number = read(new THREE.Vector3(1.6, 0, -5));
  TestValidator.predicate(
    `the box cuts the cone beyond it (${beyond.toFixed(3)} against ${before.toFixed(3)})`,
    before > 10 * beyond,
  );

  // 3. The same ray without the box.
  occluders.length = 0;
  const open: number = read(new THREE.Vector3(1.6, 0, -5));
  TestValidator.predicate(
    `without the box the cone beyond is lit (${open.toFixed(3)} against ${beyond.toFixed(3)})`,
    open > 10 * beyond,
  );
  lamp.shadow.map.dispose();
  stage.dispose();
}
