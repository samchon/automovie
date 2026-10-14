import {
  materializeCompiledInstanceSet,
  productionRuntimeModelId,
  srgbHexToLinearColor,
} from "@automovie/engine";
import {
  IAutoMovieInstanceSetDesign,
  IAutoMovieModel,
  IAutoMovieModelRecipe,
  IAutoMovieWorldDesign,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";
import * as THREE from "three";

import { buildInstancedInstanceSet } from "../../../../packages/viewer/src/buildInstancedInstanceSet";
import { buildMaterial } from "../../../../packages/viewer/src/buildMaterial";
import { createModel } from "../internal/fixtures";
import { nclose, throwsError } from "../internal/predicates";

/**
 * One authored swatch reaches the same linear albedo through the material and instance-palette paths.
 *
 * Both paths interpret authored hex swatches as sRGB and supply linear values to native material or instance color state. The independent transfer function distinguishes a shared correct decode from two paths agreeing on byte transcription.
 *
 * The unit reads CPU-side instance and diffuse colors with a white batch material, without observing rendered pixels. Repeated slot equality establishes output consistency rather than a measured decode-cache hit count.
 *
 * Scenarios:
 *
 * 1. The midtone #7d828c reaches the same linear triple through both paths.
 * 2. The independent sRGB transfer reference distinguishes decode from divide-by-255 transcription.
 * 3. A contrasting palette entry stays different from the material swatch.
 * 4. Black and white endpoints agree within Float32 tolerance.
 * 5. Two slots using one palette entry receive equal color values.
 * 6. Instance retirement attempts later resources after a geometry listener throws, preserves its failure without retry and refuses later updates.
 *
 * @evidence contracts/testing.md#behavioral-verification Decodes an authored material swatch with the engine color seam and materializes a compact instance set, reads real material/instance albedo and observes actual dispose events; catches sRGB transcription, color collapse and instance lifetime that skips later releases after a listener failure.
 * @evidence contracts/testing.md#independent-expectations W3C CSS Color 4's sRGB transfer function independently maps authored hex bytes to linear channels, with 1e-7 tolerance covering Float32 attributes; dispose event counts follow one attempt per owned visible resource and the supplied listener Error must remain the repeated completion.
 * @evidence contracts/testing.md#distinguishing-cases Covers a midtone, contrasting palette, black/white endpoints, repeated swatch slots, normal cleanup and a throwing geometry retirement with healthy instance/material release; other instancing tests own transforms, culling and prototype selection.
 * @evidence contracts/testing.md#execution-ownership This discovered unit function uses portable materialization plus in-memory Three colors, geometry and disposal events; no browser, GPU, native artifact or process is created and all cases are declared directly here.
 */
export function test_viewer_palette_color_space(): void {
  const SLATE: string = "#7d828c";

  TestValidator.predicate(
    "one swatch supplies one linear triple through both paths",
    sameRendered(materialAlbedo(SLATE), instanceAlbedo(SLATE)),
  );

  const decoded: THREE.Color = materialAlbedo(SLATE);
  TestValidator.predicate(
    "both paths land on the standard's value, not the transcription",
    nclose(decoded.r, referenceSrgbChannel(0x7d), 1e-7) &&
      nclose(decoded.g, referenceSrgbChannel(0x82), 1e-7) &&
      nclose(decoded.b, referenceSrgbChannel(0x8c), 1e-7) &&
      nclose(decoded.r, 0x7d / 255, 1e-7) === false,
  );

  TestValidator.predicate(
    "a different swatch stays a different color",
    sameRendered(materialAlbedo(SLATE), instanceAlbedo("#3a3f47")) === false,
  );

  TestValidator.predicate(
    "the gamut ends agree within Float32 tolerance",
    sameRendered(materialAlbedo("#000000"), instanceAlbedo("#000000")) &&
      sameRendered(materialAlbedo("#ffffff"), instanceAlbedo("#ffffff")),
  );

  const repeated: THREE.Color[] = instanceAlbedos(SLATE);
  TestValidator.predicate(
    "slots sharing one decoded swatch receive the same color",
    sameRendered(repeated[0]!, repeated[1]!),
  );

  const fragile: ReturnType<typeof buildInstancedInstanceSet> =
    paletteInstances(SLATE);
  const mesh: THREE.InstancedMesh = fragile.object
    .children[0] as THREE.InstancedMesh;
  const failure: Error = new Error(
    "Instance geometry retirement listener refused.",
  );
  let geometries: number = 0;
  let instances: number = 0;
  let materials: number = 0;
  mesh.geometry.addEventListener("dispose", (): never => {
    ++geometries;
    throw failure;
  });
  mesh.addEventListener("dispose", (): void => {
    ++instances;
  });
  for (const material of new Set(
    Array.isArray(mesh.material) ? mesh.material : [mesh.material],
  ))
    material.addEventListener("dispose", (): void => {
      ++materials;
    });
  let firstFailure: unknown;
  let repeatedFailure: unknown;
  try {
    fragile.dispose();
  } catch (error) {
    firstFailure = error;
  }
  try {
    fragile.dispose();
  } catch (error) {
    repeatedFailure = error;
  }
  TestValidator.predicate(
    "instance retirement preserves its actual failure without retry",
    firstFailure === failure && repeatedFailure === failure,
  );
  TestValidator.equals(
    "geometry failure cannot skip instance and material release",
    [geometries, instances, materials],
    [1, 1, 1],
  );
  TestValidator.predicate(
    "disposed instance sets refuse further updates",
    throwsError(
      (): void => fragile.update(new THREE.PerspectiveCamera(), 100),
      "is disposed",
    ),
  );
}

/** Byte-to-linear reference from https://www.w3.org/TR/css-color-4/#predefined-sRGB. */
function referenceSrgbChannel(byte: number): number {
  const encoded: number = byte / 255;
  return encoded <= 0.04045
    ? encoded / 12.92
    : ((encoded + 0.055) / 1.055) ** 2.4;
}

/** Read an authored material's CPU-side linear diffuse color. */
const materialAlbedo: (swatch: string) => THREE.Color = (
  swatch: string,
): THREE.Color => {
  const model: IAutoMovieModel = paletteModel(swatch);
  const material: THREE.MeshPhysicalMaterial = buildMaterial(
    model.materials[0]!,
  );
  const result: THREE.Color = material.color.clone();
  material.dispose();
  return result;
};

/** Read one slot's CPU-side linear instance color. */
const instanceAlbedo: (swatch: string) => THREE.Color = (
  swatch: string,
): THREE.Color => instanceAlbedos(swatch)[0]!;

/** The two linear instance colors in one palette-driven batch. */
const instanceAlbedos: (swatch: string) => THREE.Color[] = (
  swatch: string,
): THREE.Color[] => {
  const built: ReturnType<typeof buildInstancedInstanceSet> =
    paletteInstances(swatch);
  try {
    const mesh: THREE.InstancedMesh = built.object.children.find(
      (child: THREE.Object3D): child is THREE.InstancedMesh =>
        child instanceof THREE.InstancedMesh,
    )!;
    return [0, 1].map((index: number): THREE.Color => {
      const color: THREE.Color = new THREE.Color();
      mesh.getColorAt(index, color);
      return color;
    });
  } finally {
    built.dispose();
  }
};

/** Build the authored two-slot slab set used by color and retirement cases. */
function paletteInstances(
  swatch: string,
): ReturnType<typeof buildInstancedInstanceSet> {
  const recipe: IAutoMovieModelRecipe = paletteRecipe(swatch);
  const design: IAutoMovieInstanceSetDesign = {
    id: "roof",
    modelRecipe: recipe.id,
    count: 2,
    layout: { kind: "grid", rows: 1, columns: 2, spacing: { x: 1, z: 1 } },
    anchor: { x: 0, y: 0, z: 0 },
    facingDeg: 0,
    seed: 3,
    variation: {
      scale: { min: 1, max: 1 },
      palette: [swatch],
      traits: [],
    },
  };
  const world: IAutoMovieWorldDesign = {
    id: "roof-world",
    units: "meter",
    landmarks: [],
    surfaces: [],
    routes: [],
    effectRecipes: [],
    effectZones: [],
    instanceSets: [design],
  };
  const recipes: Map<string, IAutoMovieModelRecipe> = new Map([
    [recipe.id, recipe],
  ]);
  return buildInstancedInstanceSet({
    instanceSet: materializeCompiledInstanceSet({
      instanceSet: design,
      world,
      recipes,
    }),
    models: new Map([
      [productionRuntimeModelId(recipe.id), paletteModel(swatch)],
    ]),
  });
}

/** Author the slab directly through the model AST and the shared sRGB decoder. */
function paletteModel(swatch: string): IAutoMovieModel {
  const model: IAutoMovieModel = createModel(null);
  model.id = productionRuntimeModelId("slate");
  model.materials[0]!.baseColor = srgbHexToLinearColor(swatch);
  model.parts[0]!.geometry = {
    type: "primitive",
    shape: { type: "box", width: 1, height: 0.05, depth: 1 },
  };
  return model;
}

/** One flat slab whose single material color is the swatch under test. */
const paletteRecipe: (swatch: string) => IAutoMovieModelRecipe = (
  swatch: string,
): IAutoMovieModelRecipe => ({
  id: "slate",
  role: "prop",
  archetype: "primitive-prop",
  parameters: { shape: "box", width: 1, height: 0.05, depth: 1 },
  palette: { slate: swatch },
  lod: [{ tier: "near", maxDistance: null, recipe: "slate" }],
  capabilities: [],
  attachments: [],
});

/**
 * Float32 instance attributes introduce rounding relative to the double-precision material color, so both paths use the same finite 1e-7 comparison tolerance.
 */
const sameRendered: (left: THREE.Color, right: THREE.Color) => boolean = (
  left: THREE.Color,
  right: THREE.Color,
): boolean =>
  nclose(left.r, right.r, 1e-7) &&
  nclose(left.g, right.g, 1e-7) &&
  nclose(left.b, right.b, 1e-7);
