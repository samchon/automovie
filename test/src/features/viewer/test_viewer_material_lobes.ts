import type {
  AutoMovieTextureBinding,
  IAutoMovieMaterial,
} from "@automovie/interface";
import { buildMaterial, materialTextureBindings } from "@automovie/viewer";
import { TestValidator } from "@nestia/e2e";
import * as THREE from "three";

import { createModel } from "../internal/fixtures";
import { namedFacts, nclose } from "../internal/predicates";

const material: (patch: Partial<IAutoMovieMaterial>) => IAutoMovieMaterial = (
  patch: Partial<IAutoMovieMaterial>,
): IAutoMovieMaterial => ({ ...createModel().materials[0]!, ...patch });

/**
 * The anisotropy, sheen, specular-intensity and thickness-texture fields reach the `MeshPhysicalMaterial` properties of the same glTF meaning, and omission leaves the neutral response.
 *
 * Scenarios:
 *
 * 1. Strength 0.6 at 90 degrees with a direction map, a tinted sheen of roughness 0.3, specular intensity 0.25 and a thickness map lower to anisotropy 0.6, rotation pi/2, a linear anisotropy map, sheen 1 with that colour and roughness, specular intensity 0.25 and a linear thickness map; the binding list names both maps after the emissive slot.
 * 2. Omitting every lobe gives anisotropy 0, sheen 0, specular intensity 1 and no anisotropy or thickness map, and a declared black sheen keeps sheen 1 with a black tint.
 *
 * @evidence contracts/testing.md#behavioral-verification Builds real physical materials through buildMaterial and reads their Three.js properties and resolved maps, catching a dropped lobe, a degree-radian slip, a wrong colour space or a missing map binding.
 * @evidence contracts/testing.md#independent-expectations The expected properties come from the glTF extension parameters and Three.js MeshPhysicalMaterial documentation: radians, sheen intensity one for a declared glTF sheen, linear data maps and the documented defaults.
 * @evidence contracts/testing.md#distinguishing-cases Contrasts every declared lobe with every omitted lobe and a black sheen whose colour, not intensity, removes it; admission domains and carried-image decoding are owned by other tests.
 * @evidence contracts/testing.md#execution-ownership The discoverable exported unit builds CPU-side Three.js materials with a local resolver and starts no renderer, browser or GPU.
 */
export function test_viewer_material_lobes(): void {
  const resolved: string[] = [];
  const resolve: (binding: AutoMovieTextureBinding) => THREE.Texture = (
    binding: AutoMovieTextureBinding,
  ): THREE.Texture => {
    resolved.push(typeof binding === "string" ? binding : binding.asset);
    return new THREE.Texture();
  };
  const declared: IAutoMovieMaterial = material({
    anisotropy: { strength: 0.6, rotationDeg: 90, texture: "flow.png" },
    sheen: {
      color: { r: 0.2, g: 0.4, b: 0.6, a: null, hex: null },
      roughness: 0.3,
    },
    specularIntensity: 0.25,
    thicknessTexture: { asset: "depth.png", texCoord: 0, colorSpace: "linear" },
  });
  const built: THREE.MeshPhysicalMaterial = buildMaterial(declared, resolve);
  TestValidator.equals(
    "declared lobes reach the physical material",
    namedFacts([
      ["anisotropy", (): boolean => nclose(built.anisotropy, 0.6)],
      [
        "rotation",
        (): boolean => nclose(built.anisotropyRotation, Math.PI / 2),
      ],
      [
        "anisotropyMap",
        (): boolean => built.anisotropyMap?.colorSpace === THREE.NoColorSpace,
      ],
      ["sheen", (): boolean => built.sheen === 1],
      [
        "sheenColor",
        (): boolean =>
          nclose(built.sheenColor.r, 0.2) &&
          nclose(built.sheenColor.g, 0.4) &&
          nclose(built.sheenColor.b, 0.6),
      ],
      ["sheenRoughness", (): boolean => nclose(built.sheenRoughness, 0.3)],
      ["specular", (): boolean => nclose(built.specularIntensity, 0.25)],
      [
        "thicknessMap",
        (): boolean => built.thicknessMap?.colorSpace === THREE.NoColorSpace,
      ],
      [
        "resolvedBoth",
        (): boolean =>
          resolved.includes("flow.png") && resolved.includes("depth.png"),
      ],
      [
        "bindingOrder",
        (): boolean =>
          JSON.stringify(
            materialTextureBindings({
              ...declared,
              emissiveTexture: "glow.png",
            }).map((binding: AutoMovieTextureBinding): string =>
              typeof binding === "string" ? binding : binding.asset,
            ),
          ) === JSON.stringify(["glow.png", "depth.png", "flow.png"]),
      ],
    ]),
    {
      anisotropy: true,
      rotation: true,
      anisotropyMap: true,
      sheen: true,
      sheenColor: true,
      sheenRoughness: true,
      specular: true,
      thicknessMap: true,
      resolvedBoth: true,
      bindingOrder: true,
    },
  );
  const neutral: THREE.MeshPhysicalMaterial = buildMaterial(
    material({}),
    resolve,
  );
  const black: THREE.MeshPhysicalMaterial = buildMaterial(
    material({
      sheen: { color: { r: 0, g: 0, b: 0, a: null, hex: null }, roughness: 1 },
    }),
  );
  TestValidator.equals(
    "omitted lobes keep the neutral response",
    namedFacts([
      ["anisotropy", (): boolean => neutral.anisotropy === 0],
      ["sheen", (): boolean => neutral.sheen === 0],
      ["specular", (): boolean => neutral.specularIntensity === 1],
      [
        "maps",
        (): boolean =>
          neutral.anisotropyMap === null && neutral.thicknessMap === null,
      ],
      [
        "blackSheen",
        (): boolean => black.sheen === 1 && black.sheenColor.getHex() === 0,
      ],
    ]),
    {
      anisotropy: true,
      sheen: true,
      specular: true,
      maps: true,
      blackSheen: true,
    },
  );
  for (const disposable of [built, neutral, black]) disposable.dispose();
}
