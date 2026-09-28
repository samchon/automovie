import {
  HUMAN_BODY_SKIN_DETAIL,
  type IAutoMovieHumanBodyBasis,
  type IAutoMovieHumanBodySkinDetail,
  createHumanBodyBasisBuilder,
  createHumanBodySkinDetailTexture,
  humanBodySimpleShapeMath,
} from "@automovie/human";
import type { IAutoMovieTextureReference } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { humanBodyBasisFixture } from "../internal/humanBodyBasisFixture";
import { nclose, throwsError } from "../internal/predicates";

type Surface = IAutoMovieHumanBodyBasis["surfaces"][number];

const FLAT: IAutoMovieHumanBodySkinDetail = {
  seed: 1,
  pixels: 32,
  tileMillimetres: 10,
  lines: [],
  pores: {
    perSquareCentimetre: 1,
    radiusMicrometres: 300,
    depthMicrometres: 0,
  },
  age: [[0, 1]],
};

/**
 * The analytic box's surface given a UV layout: each vertex at `(x, y) / 2`
 * of its own position, so one UV unit is two metres of the side walls it
 * maps without shear.
 */
function textured(surface: Surface): Surface {
  const uvs = surface.regions[0].indices.flatMap((v) => [
    surface.positions[v * 3] / 2 + 0.5,
    surface.positions[v * 3 + 1] / 2,
  ]);
  return {
    ...surface,
    regions: [{ ...surface.regions[0], uvs }],
  };
}

/**
 * A surface's anatomical relief carries the skin's creases under the tiled
 * micro-relief.
 *
 * Scenarios:
 * 1. With a relief for the skin, a detail strength binds the relief as the
 *    normal map, once over the UVs and clamped, and the tiled micro-relief as
 *    the detail normal map, both at the strength times the age curve.
 * 2. A relief that is not a PNG data URI, or names a material without
 *    textured regions, is refused.
 */
export const test_human_body_skin_relief = (): void => {
  const { basis, document } = humanBodyBasisFixture();
  const box = textured(basis.surfaces[0]);
  const withBox = (surface: Surface): IAutoMovieHumanBodyBasis => ({
    ...basis,
    surfaces: [surface],
  });
  const turns = 2 / (HUMAN_BODY_SKIN_DETAIL.tileMillimetres / 1000);
  const relief = createHumanBodySkinDetailTexture(FLAT);
  const reliefBasis: IAutoMovieHumanBodyBasis = {
    ...withBox(box),
    surfaces: [{ ...box, relief: { material: "skin", texture: relief } }],
  };
  const reliefSkin = createHumanBodyBasisBuilder(reliefBasis)({
    ...document,
    skinDetail: { strength: 0.5 },
  }).model.materials.find((one) => one.id === "skin")!;
  const anatomical = reliefSkin.normalTexture as IAutoMovieTextureReference;
  const fine = reliefSkin.detailNormalTexture as IAutoMovieTextureReference;
  const factor =
    0.5 * humanBodySimpleShapeMath.curve(HUMAN_BODY_SKIN_DETAIL.age, 0);
  TestValidator.predicate(
    "the relief carries the creases and the micro-relief becomes its detail",
    anatomical.asset === relief &&
      anatomical.transform === undefined &&
      anatomical.sampler!.wrapS === "clamp" &&
      fine.asset === createHumanBodySkinDetailTexture(HUMAN_BODY_SKIN_DETAIL) &&
      nclose(fine.transform!.scale.x, turns, 1e-6) &&
      nclose(reliefSkin.normalScale!, factor, 1e-12) &&
      nclose(reliefSkin.detailNormalScale!, factor, 1e-12),
  );
  TestValidator.predicate(
    "a relief that is not a PNG, or over no textured region, is refused",
    throwsError(
      () =>
        createHumanBodyBasisBuilder({
          ...reliefBasis,
          surfaces: [
            { ...box, relief: { material: "skin", texture: "relief.png" } },
          ],
        }),
      "Body surface relief",
    ) &&
      throwsError(
        () =>
          createHumanBodyBasisBuilder({
            ...reliefBasis,
            surfaces: [
              { ...box, relief: { material: "flesh", texture: relief } },
            ],
          }),
        "Body surface relief",
      ),
  );
};
