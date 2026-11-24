import type {
  AutoMovieTextureBinding,
  IAutoMovieMaterial,
} from "@automovie/interface";
import {
  AutoMovieThreeKind,
  applyRenderMode,
  buildMaterial,
} from "@automovie/render";
import { TestValidator } from "@nestia/e2e";
import * as THREE from "three";

import { createModel } from "../internal/fixtures";
import { namedFacts, nclose } from "../internal/predicates";

/** The fixture's material with a patch, in the authored linear base colour. */
const material: (patch: Partial<IAutoMovieMaterial>) => IAutoMovieMaterial = (
  patch: Partial<IAutoMovieMaterial>,
): IAutoMovieMaterial => ({ ...createModel().materials[0]!, ...patch });

/** A linear colour with no hex text. */
const linear: (
  r: number,
  g: number,
  b: number,
) => IAutoMovieMaterial["baseColor"] = (
  r: number,
  g: number,
  b: number,
): IAutoMovieMaterial["baseColor"] => ({ r, g, b, a: null, hex: null });

/**
 * The `albedo` guide pass draws every mesh unlit in its material's base colour
 * on black, keeping cutouts and the beauty pass's skipped surfaces, and
 * restores every original material.
 *
 * Scenarios:
 *
 * 1. A built red material, linear `(1, 0, 0)`, becomes an unlit, untoned, opaque
 *    basic material whose colour encodes to sRGB `ff0000`; a linear grey of 0.5
 *    encodes to `bc` (188), the sRGB transfer of 0.5.
 * 2. A textured material keeps its base-colour texture object, so each pixel is
 *    the texel times the factor.
 * 3. An alpha-test cutout keeps its cutoff and its opacity, so the same texels are
 *    discarded.
 * 4. A fully transparent blended surface with no transmission stays hidden, as in
 *    beauty, while a half-transparent one is drawn opaque.
 * 5. A lit environment does not reach the pass: the image lighting is removed, the
 *    background is black, and raising the light from 1 to 5 leaves every
 *    override's colour unchanged.
 * 6. A material group is replaced slot by slot, and a shader material without a
 *    base colour draws black.
 * 7. `restore` returns every original material and the scene's lighting, and
 *    disposes each override once.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Applies the real pass to a scene of materials built by `buildMaterial`, a material group and a shader material, and reads the installed overrides and scene state; a lit or tone-mapped override, a dropped texture or cutout, a drawn skipped surface, a translucent override, or an original left swapped fails.
 * @evidence contracts/development/testing.md#independent-expectations The sRGB values come from the IEC 61966-2-1 transfer, `1.055 * 0.5^(1/2.4) - 0.055 = 0.7354`, which is 188 of 255, and `ff0000` for full red; skipping and cutouts follow `buildMaterial`'s documented rules. GPU pixels are not read: no WebGL context runs in a unit test, so the drawn frame is checked by capture under the visual-debugging skill.
 * @evidence contracts/development/testing.md#distinguishing-cases Contrasts a plain, textured, cutout, fully transparent and half-transparent surface, a group and a material with no base colour, and the light at two intensities; the pass list order belongs to `test_render_guide_passes` and helper hiding to `test_viewer_guide_pass_non_mesh`.
 * @evidence contracts/development/testing.md#execution-ownership A portable unit discovered as `test_viewer_render_mode_albedo`; it builds CPU-side three.js objects and starts no renderer, browser or process.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 7 numbered scenarios it runs, each naming the input and the behavior it pins.
 */
export function test_viewer_render_mode_albedo(): void {
  const texel: THREE.DataTexture = new THREE.DataTexture(
    new Uint8Array([10, 200, 30, 255]),
    1,
    1,
  );
  const resolve: (
    binding: AutoMovieTextureBinding,
  ) => THREE.Texture = (): THREE.Texture => texel;
  const red: THREE.MeshPhysicalMaterial = buildMaterial(
    material({ baseColor: linear(1, 0, 0) }),
  );
  const grey: THREE.MeshPhysicalMaterial = buildMaterial(
    material({ baseColor: linear(0.5, 0.5, 0.5) }),
  );
  const textured: THREE.MeshPhysicalMaterial = buildMaterial(
    material({ baseColor: linear(1, 1, 1), baseColorTexture: "skin.png" }),
    resolve,
  );
  const cutout: THREE.MeshPhysicalMaterial = buildMaterial(
    material({
      alphaMode: "mask",
      alphaCutoff: 0.4,
      opacity: 0.9,
      baseColorTexture: "leaf.png",
    }),
    resolve,
  );
  const clear: THREE.MeshPhysicalMaterial = buildMaterial(
    material({ alphaMode: "blend", opacity: 0, transmission: 0 }),
  );
  const glass: THREE.MeshPhysicalMaterial = buildMaterial(
    material({ alphaMode: "blend", opacity: 0.5 }),
  );
  const shader: THREE.ShaderMaterial = new THREE.ShaderMaterial();
  const box: THREE.BoxGeometry = new THREE.BoxGeometry();
  const meshes: THREE.Mesh[] = [
    new THREE.Mesh(box, red),
    new THREE.Mesh(box, grey),
    new THREE.Mesh(box, textured),
    new THREE.Mesh(box, cutout),
    new THREE.Mesh(box, clear),
    new THREE.Mesh(box, glass),
    new THREE.Mesh(box, [red, shader]),
  ];
  const originals: (THREE.Material | THREE.Material[])[] = meshes.map(
    (mesh: THREE.Mesh): THREE.Material | THREE.Material[] => mesh.material,
  );
  const scene: THREE.Scene = new THREE.Scene();
  const environment: THREE.Texture = new THREE.Texture();
  const background: THREE.Color = new THREE.Color(0x336699);
  const light: THREE.DirectionalLight = new THREE.DirectionalLight(0xffffff, 1);
  scene.environment = environment;
  scene.background = background;
  scene.add(light, ...meshes);

  const pass: ReturnType<typeof applyRenderMode> = applyRenderMode(
    scene,
    "albedo",
  );
  const overrides: THREE.MeshBasicMaterial[] = meshes.flatMap(
    (mesh: THREE.Mesh): THREE.MeshBasicMaterial[] =>
      [mesh.material].flat() as THREE.MeshBasicMaterial[],
  );
  /** The eight overrides, in mesh order. */
  type Overrides = [
    THREE.MeshBasicMaterial,
    THREE.MeshBasicMaterial,
    THREE.MeshBasicMaterial,
    THREE.MeshBasicMaterial,
    THREE.MeshBasicMaterial,
    THREE.MeshBasicMaterial,
    THREE.MeshBasicMaterial,
    THREE.MeshBasicMaterial,
  ];
  const [
    redOverride,
    greyOverride,
    texturedOverride,
    cutoutOverride,
    clearOverride,
    glassOverride,
    groupRed,
    groupShader,
  ]: Overrides = overrides as Overrides;
  const colors: string[] = overrides.map(
    (override: THREE.MeshBasicMaterial): string =>
      override.color.getHexString(THREE.SRGBColorSpace),
  );
  light.intensity = 5;

  TestValidator.equals(
    "every mesh draws its base colour unlit, opaque and as the beauty pass covers it",
    namedFacts([
      [
        "unlitUntoned",
        (): boolean =>
          overrides.every(
            (override: THREE.MeshBasicMaterial): boolean =>
              AutoMovieThreeKind.isMeshBasicMaterial(override) &&
              override.toneMapped === false &&
              override.fog === false,
          ),
      ],
      [
        "red",
        (): boolean =>
          redOverride.color.getHexString(THREE.SRGBColorSpace) === "ff0000",
      ],
      [
        "greyEncodedOnce",
        (): boolean =>
          greyOverride.color.getHexString(THREE.SRGBColorSpace) === "bcbcbc",
      ],
      ["texture", (): boolean => texturedOverride.map === texel],
      [
        "cutout",
        (): boolean =>
          nclose(cutoutOverride.alphaTest, 0.4, 0) &&
          nclose(cutoutOverride.opacity, 0.9, 0) &&
          cutoutOverride.map === texel &&
          cutoutOverride.transparent === false,
      ],
      ["clearHidden", (): boolean => clearOverride.visible === false],
      [
        "glassOpaque",
        (): boolean =>
          glassOverride.visible === true &&
          glassOverride.transparent === false &&
          nclose(glassOverride.opacity, 1, 0) &&
          glassOverride.depthWrite === true,
      ],
      [
        "groupBySlot",
        (): boolean =>
          Array.isArray(meshes[6]!.material) &&
          groupRed.color.getHexString(THREE.SRGBColorSpace) === "ff0000",
      ],
      [
        "noBaseColourIsBlack",
        (): boolean => groupShader.color.getHex() === 0x000000,
      ],
      [
        "noImageLighting",
        (): boolean =>
          scene.environment === null &&
          scene.background instanceof THREE.Color &&
          scene.background.getHex() === 0x000000,
      ],
      [
        "lightChangesNothing",
        (): boolean =>
          overrides.every(
            (override: THREE.MeshBasicMaterial, index: number): boolean =>
              override.color.getHexString(THREE.SRGBColorSpace) ===
              colors[index],
          ),
      ],
    ]),
    {
      unlitUntoned: true,
      red: true,
      greyEncodedOnce: true,
      texture: true,
      cutout: true,
      clearHidden: true,
      glassOpaque: true,
      groupBySlot: true,
      noBaseColourIsBlack: true,
      noImageLighting: true,
      lightChangesNothing: true,
    },
  );

  const disposals: Map<THREE.Material, number> = new Map();
  for (const override of overrides)
    override.addEventListener("dispose", (): void => {
      disposals.set(override, (disposals.get(override) ?? 0) + 1);
    });
  pass.restore();
  TestValidator.equals(
    "restore returns every original and the lighting, disposing each override once",
    namedFacts([
      [
        "originals",
        (): boolean =>
          meshes.every(
            (mesh: THREE.Mesh, index: number): boolean =>
              mesh.material === originals[index],
          ),
      ],
      [
        "lighting",
        (): boolean =>
          scene.environment === environment && scene.background === background,
      ],
      [
        "disposedOnce",
        (): boolean =>
          overrides.every(
            (override: THREE.MeshBasicMaterial): boolean =>
              disposals.get(override) === 1,
          ),
      ],
      ["textureKept", (): boolean => texturedOverride.map === texel],
    ]),
    { originals: true, lighting: true, disposedOnce: true, textureKept: true },
  );

  for (const disposable of [red, grey, textured, cutout, clear, glass, shader])
    disposable.dispose();
  box.dispose();
  texel.dispose();
  environment.dispose();
}
