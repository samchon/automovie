import {
  createHumanFaceBasisBuilder,
  createHumanFaceFibrePigment,
  decodePortraitPng,
  encodePortraitPng,
} from "@automovie/human";
import type { IAutoMovieMaterial } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { humanFaceContactFixture } from "../internal/humanFaceContactFixture";
import { throwsError } from "../internal/predicates";

const srgb = (linear: number): number =>
  Math.round(
    (linear <= 0.0031308
      ? 12.92 * linear
      : 1.055 * linear ** (1 / 2.4) - 0.055) * 255,
  );

/**
 * A 2 x 2 fibre card: texel 0 uncovered, texel 1 dark (sRGB 20) at full
 * coverage, texel 2 lighter (sRGB 60) at half coverage (128), texel 3 the
 * dark colour again at a quarter (64); masked at 0.15 like the basis brow.
 */
const card = (): IAutoMovieMaterial => ({
  id: "brow",
  name: "brow",
  baseColor: { r: 0.5, g: 0.5, b: 0.5, a: 1, hex: null },
  roughness: 0.55,
  metallic: 0,
  opacity: 1,
  emissive: null,
  baseColorTexture: encodePortraitPng({
    width: 2,
    height: 2,
    rgba: new Uint8Array([
      0, 0, 0, 0, 20, 20, 20, 255, 60, 60, 60, 128, 20, 20, 20, 64,
    ]),
  }),
  doubleSided: true,
  alphaMode: "mask",
  alphaCutoff: 0.15,
});

/**
 * Fibre pigment and density on a coverage card.
 * Scenarios:
 * 1. A pigment repaints each covered texel as the pigment times its
 *    luminance over the coverage-weighted mean luminance, held to one: with
 *    grey texels of linear luminance l1 (sRGB 20) and l2 (sRGB 60) at
 *    coverage 1, 128/255 and 64/255, the mean is their coverage-weighted
 *    average; the
 *    uncovered texel and every alpha are unchanged and the base-colour
 *    factor becomes white.
 * 2. A density halves or doubles coverage (128 to 64, 64 to 128, 255 held
 *    at 255) and keeps colour and the base-colour factor.
 * 3. Repeating the same override reuses the same texture string; a new
 *    value paints a new one; omission and an override with only colour or
 *    roughness leave the material byte for byte.
 * 4. A component outside [0,1], a density outside [0,4], an unknown
 *    material, one without an embedded texture and one without a coverage
 *    alpha mode refuse.
 * 5. Through the real builder, a document override on a basis card (the
 *    analytic contact basis with its globe drawn in the card material)
 *    repaints the built material and leaves the basis unchanged.
 */
export const test_subject_human_fibre_pigment = (): void => {
  const rule = createHumanFaceFibrePigment();
  const toLinear = (byte: number) => {
    const c = byte / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  const l1 = toLinear(20);
  const l2 = toLinear(60);
  const [half, quarter] = [128 / 255, 64 / 255];
  const mean = ((1 + quarter) * l1 + half * l2) / (1 + half + quarter);
  const painted = [card()];
  rule({ brow: { pigment: [0.3, 0.12, 0.05] } }, painted);
  const image = decodePortraitPng(painted[0]!.baseColorTexture as string);
  const expected = (ratio: number) =>
    [0.3, 0.12, 0.05].map((value) => srgb(Math.min(1, value * ratio)));
  TestValidator.equals("pigment by luminance ratio", Array.from(image.rgba), [
    0,
    0,
    0,
    0,
    ...expected(l1 / mean),
    255,
    ...expected(l2 / mean),
    128,
    ...expected(l1 / mean),
    64,
  ]);
  TestValidator.equals(
    "white factor",
    [painted[0]!.baseColor.r, painted[0]!.baseColor.g, painted[0]!.baseColor.b],
    [1, 1, 1],
  );

  const densities = [0.5, 2].map((density) => {
    const materials = [card()];
    rule({ brow: { density } }, materials);
    return {
      alpha: Array.from(
        decodePortraitPng(materials[0]!.baseColorTexture as string).rgba,
      ).filter((_, k) => k % 4 === 3),
      factor: materials[0]!.baseColor.r,
    };
  });
  TestValidator.equals("thinned", densities[0]!.alpha, [0, 128, 64, 32]);
  TestValidator.equals("filled", densities[1]!.alpha, [0, 255, 255, 128]);
  TestValidator.equals("factor kept", densities[1]!.factor, 0.5);

  const again = [card()];
  rule({ brow: { pigment: [0.3, 0.12, 0.05] } }, again);
  TestValidator.predicate(
    "cached",
    again[0]!.baseColorTexture === painted[0]!.baseColorTexture,
  );
  const other = [card()];
  rule({ brow: { pigment: [0.2, 0.12, 0.05] } }, other);
  TestValidator.predicate(
    "new value",
    other[0]!.baseColorTexture !== painted[0]!.baseColorTexture,
  );
  const untouched: Parameters<typeof rule>[0][] = [
    undefined,
    {},
    { brow: { roughness: 0.3 } },
  ];
  for (const overrides of untouched) {
    const materials = [card()];
    rule(overrides, materials);
    TestValidator.equals("untouched", materials, [card()]);
  }

  const refuses = (
    overrides: Parameters<typeof rule>[0],
    material: IAutoMovieMaterial,
    message: string,
  ) => throwsError(() => rule(overrides, [material]), message);
  TestValidator.predicate(
    "ranges",
    refuses({ brow: { pigment: [1.2, 0, 0] } }, card(), "[0,1]") &&
      refuses({ brow: { pigment: [0, -0.1, 0] } }, card(), "[0,1]") &&
      refuses({ brow: { density: 4.5 } }, card(), "[0,4]") &&
      refuses({ brow: { density: NaN } }, card(), "[0,4]"),
  );
  TestValidator.predicate(
    "materials",
    refuses({ lash: { density: 1 } }, card(), "carries coverage: lash") &&
      refuses(
        { brow: { density: 1 } },
        { ...card(), baseColorTexture: null },
        "carries coverage",
      ) &&
      refuses(
        { brow: { density: 1 } },
        { ...card(), alphaMode: "opaque" },
        "carries coverage",
      ),
  );

  const { basis } = humanFaceContactFixture();
  basis.materials.push(card());
  const region = basis.surfaces.find((one) => one.id === "globe")!.regions[0]!;
  region.material = "brow";
  region.uvs = region.indices.flatMap(() => [0.5, 0.5]);
  const snapshot = JSON.stringify(basis);
  const model = createHumanFaceBasisBuilder(basis)({
    id: "fibres",
    name: "fibres",
    basis: basis.id,
    shape: {},
    expression: {},
    materials: { brow: { pigment: [0.3, 0.12, 0.05] } },
  });
  TestValidator.predicate(
    "builder repaints",
    model.materials.find((one) => one.id === "brow")!.baseColorTexture ===
      painted[0]!.baseColorTexture && JSON.stringify(basis) === snapshot,
  );
};
