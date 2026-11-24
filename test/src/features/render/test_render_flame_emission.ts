import { createLight } from "@automovie/archetypes";
import { compileAutoMovieFlameFlicker } from "@automovie/engine";
import type {
  IAutoMovieClip,
  IAutoMovieFlameCue,
  IAutoMovieModel,
  IAutoMovieScene,
} from "@automovie/interface";
import {
  applyAutoMovieShadowParticipation,
  buildModel,
  buildScene,
  prepareAutoMovieFlames,
} from "@automovie/render";
import { TestValidator } from "@nestia/e2e";
import * as THREE from "three";

import { renderFixtureIdentity } from "../internal/renderFixtureIdentity";
import { renderFixtureNode } from "../internal/renderFixtureNode";

/**
 * A flame bound to a practical light is an unlit additive emitter whose
 * radiance is the light's intensity over the flame's mean area, and it casts no
 * shadow.
 *
 * Scenarios:
 *
 * 1. With a 1.2 cd point light of colour (1, 0.6, 0.3) bound through its light
 *    clip, the flame material's linear colour is that colour times 1.2 / Ā, Ā
 *    from compileAutoMovieFlameFlicker over the same cue.
 * 2. The material is a basic (unlit) material with additive blending and no depth
 *    write; the mesh draws at render order −1.
 * 3. After shadow participation, the flame casts no shadow while the candle's
 *    opaque parts do.
 * 4. An unbound flame of 15.92 cd/m² white has linear colour 15.92, the radiance
 *    of a Lambertian card of albedo 0.5 under 1 cd at 0.1 m (100 × 0.5 / π).
 *
 * @evidence contracts/development/common.md#meaningful-documentation Lists each scenario's light, cue and the material or shadow fact it pins.
 * @evidence contracts/development/testing.md#behavioral-verification Prepares flames through the public preparer and reads the material and shadow flags of the mesh it mounts.
 * @evidence contracts/development/testing.md#independent-expectations The luminance follows I_on / Ā from issue #4094; 15.92 cd/m² follows from E = I/d² and L = ρE/π.
 * @evidence contracts/development/testing.md#distinguishing-cases A lit flame, a depth-writing flame, a shadow-casting flame or a luminance not divided by Ā fails. The floating-point target comparison needs a WebGL host and is recorded as a visual check.
 * @evidence contracts/development/testing.md#execution-ownership In-memory Three scene graph; no renderer.
 */
export function test_render_flame_emission(): void {
  const candle: IAutoMovieModel = createLight({ id: "candle", kind: "candle" });
  const scene: IAutoMovieScene = {
    id: "table",
    name: null,
    nodes: [renderFixtureNode("candle-1", candle.id)],
    cameras: [],
    lights: [
      {
        id: "candle-light",
        type: "point",
        transform: renderFixtureIdentity,
        color: { r: 1, g: 0.6, b: 0.3, a: null, hex: null },
        intensity: 1.2,
        range: 6,
      },
    ],
  };
  const bound: IAutoMovieFlameCue = {
    id: "wick",
    node: "candle-1",
    emitter: "light",
    seed: 3,
    size: { kind: "small", height: 0.03, radius: 0.006 },
    light: "candle-glow",
  };
  const clip: IAutoMovieClip = {
    id: "candle-glow",
    name: null,
    duration: 3,
    loop: false,
    tracks: [
      {
        channel: {
          kind: "pointer",
          pointer: "/lights/candle-light/intensity",
          valueType: "scalar",
        },
        times: [0],
        values: [1.2],
        interpolation: "step",
      },
    ],
  } as IAutoMovieClip;
  const object: ReturnType<typeof buildModel> = buildModel(candle);
  const mounted: ReturnType<typeof buildScene> = buildScene(
    scene,
    (): ReturnType<typeof buildModel> => object,
  );
  const flames: ReturnType<typeof prepareAutoMovieFlames> =
    prepareAutoMovieFlames({
      shot: { flames: [bound], lightMotions: [clip], duration: 3 },
      scene,
      models: [candle],
      resolveNode: (): ReturnType<typeof buildModel> => object,
    });
  const mesh: THREE.Mesh = object.object.getObjectByName(
    "flame:candle-1/wick",
  ) as THREE.Mesh;
  const material: THREE.MeshBasicMaterial =
    mesh.material as THREE.MeshBasicMaterial;

  // 1. Luminance from the light.
  const mean: number = compileAutoMovieFlameFlicker(bound, 3).mean;
  const luminance: number = 1.2 / mean;
  TestValidator.predicate(
    "colour is the light's colour times I_on / mean area",
    Math.abs(material.color.r - luminance) / luminance < 1e-6 &&
      Math.abs(material.color.g - 0.6 * luminance) / luminance < 1e-6 &&
      Math.abs(material.color.b - 0.3 * luminance) / luminance < 1e-6,
  );

  // 2. Unlit, additive, no depth write, drawn first.
  TestValidator.predicate(
    "unlit additive emitter drawn before the prop",
    material instanceof THREE.MeshBasicMaterial &&
      material.blending === THREE.AdditiveBlending &&
      material.depthWrite === false &&
      mesh.renderOrder === -1,
  );

  // 3. Shadow participation.
  applyAutoMovieShadowParticipation(mounted.scene);
  let opaqueCasts: boolean = false;
  object.object.traverse((candidate: THREE.Object3D): void => {
    if (candidate !== mesh && (candidate as THREE.Mesh).isMesh === true)
      opaqueCasts ||= candidate.castShadow;
  });
  TestValidator.predicate(
    "the flame casts no shadow; the candle does",
    mesh.castShadow === false && opaqueCasts,
  );
  flames.dispose();

  // 4. The calibration value.
  const unbound: ReturnType<typeof prepareAutoMovieFlames> =
    prepareAutoMovieFlames({
      shot: {
        flames: [
          {
            ...bound,
            light: undefined,
            emission: {
              luminance: 15.92,
              color: { r: 1, g: 1, b: 1, a: null, hex: null },
            },
          },
        ],
        duration: 3,
      },
      scene,
      models: [candle],
      resolveNode: (): ReturnType<typeof buildModel> => object,
    });
  const card: number = (100 * 0.5) / Math.PI;
  TestValidator.predicate(
    "15.92 cd/m² white matches the Lambertian card within 1 %",
    Math.abs(
      (
        (object.object.getObjectByName("flame:candle-1/wick") as THREE.Mesh)
          .material as THREE.MeshBasicMaterial
      ).color.r - card,
    ) /
      card <=
      0.01,
  );
  unbound.dispose();
}
