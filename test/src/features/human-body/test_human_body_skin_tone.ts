import {
  HUMAN_BODY_SKIN_TONE,
  type IAutoMovieHumanBodyBasis,
  type IAutoMovieHumanBodySkinTone,
  admitHumanBodyBasisDocument,
  createHumanBodyBasisBuilder,
  createHumanBodySkinToneTexture,
  decodePortraitPng,
  humanBodySimpleShapeMath,
} from "@automovie/human";
import type { IAutoMovieTextureReference } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { humanBodyBasisFixture } from "../internal/humanBodyBasisFixture";
import { nclose, throwsError } from "../internal/predicates";

type Surface = IAutoMovieHumanBodyBasis["surfaces"][number];

const SMALL: IAutoMovieHumanBodySkinTone = {
  ...HUMAN_BODY_SKIN_TONE,
  pixels: 64,
  tileMillimetres: 64,
};

/** The analytic box's surface with each vertex at `(x, y) / 2` of its position as UV. */
function textured(surface: Surface): Surface {
  const uvs = surface.regions[0].indices.flatMap((v) => [
    surface.positions[v * 3] / 2 + 0.5,
    surface.positions[v * 3 + 1] / 2,
  ]);
  return { ...surface, regions: [{ ...surface.regions[0], uvs }] };
}

/** The linear value of an 8-bit sRGB byte. */
const linear = (byte: number): number => {
  const v = byte / 255;
  return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
};

/**
 * The skin's uneven tone is a tiled base-colour map of its two chromophores
 * varying about the site colour, and the factor that keeps that colour's
 * mean.
 *
 * Scenarios:
 * 1. The same table and strength give the same bytes; another seed other
 *    bytes.
 * 2. At zero strength the map is white and opaque and the compensation one.
 * 3. Haemoglobin alone reddens: its red channel barely moves while green
 *    and blue do (absorbance 0.033 against 1 and 0.91). Melanin alone moves
 *    blue most and red least (1.8, 1, 0.69).
 * 4. The map times the compensation averages one per primary, so the skin's
 *    mean colour is the site albedo's.
 * 5. The tile repeats seamlessly: the step across its wrapping edge is no
 *    larger than the steps inside it.
 * 6. Through the builder, a tone strength attaches the map as the skin's
 *    sRGB base-colour texture over the source UVs, repeated at the layout
 *    scale over the tile, and multiplies the base colour by the
 *    compensation, at the strength times the age curve taken to a
 *    twentieth; the same quantized strength reuses the map, and omission or
 *    a zero strength leaves the base colour untextured.
 * 7. A strength outside [0,1] and a skin region without UVs are refused; a
 *    nonfinite strength is refused at admission and a finite one admitted.
 */
export const test_human_body_skin_tone = (): void => {
  const sample = createHumanBodySkinToneTexture(SMALL, 1);
  TestValidator.predicate(
    "the same inputs give the same bytes and another seed others",
    sample.texture === createHumanBodySkinToneTexture(SMALL, 1).texture &&
      sample.texture !==
        createHumanBodySkinToneTexture({ ...SMALL, seed: 2 }, 1).texture,
  );

  const white = createHumanBodySkinToneTexture(SMALL, 0);
  const plain = decodePortraitPng(white.texture);
  TestValidator.predicate(
    "zero strength is a white map and no compensation",
    plain.rgba.every((value) => value === 255) &&
      white.compensation.every((value) => value === 1),
  );

  const range = (
    image: ReturnType<typeof decodePortraitPng>,
    channel: number,
  ) => {
    let least = Infinity;
    let most = -Infinity;
    for (let i = channel; i < image.rgba.length; i += 4) {
      const v = linear(image.rgba[i]);
      least = Math.min(least, v);
      most = Math.max(most, v);
    }
    return most - least;
  };
  const only = (keep: "melanin" | "haemoglobin") =>
    decodePortraitPng(
      createHumanBodySkinToneTexture(
        {
          ...SMALL,
          melanin: {
            ...SMALL.melanin,
            spread: keep === "melanin" ? 0.2 : 0,
          },
          haemoglobin: {
            ...SMALL.haemoglobin,
            spread: keep === "haemoglobin" ? 0.2 : 0,
          },
        },
        1,
      ).texture,
    );
  const blood = only("haemoglobin");
  const pigment = only("melanin");
  TestValidator.predicate(
    "haemoglobin reddens and melanin moves blue most",
    range(blood, 0) < 0.1 * range(blood, 1) &&
      range(blood, 2) > 0.5 * range(blood, 1) &&
      range(pigment, 2) > range(pigment, 1) &&
      range(pigment, 1) > range(pigment, 0),
  );

  const image = decodePortraitPng(sample.texture);
  const means = [0, 1, 2].map((c) => {
    let sum = 0;
    for (let i = c; i < image.rgba.length; i += 4) sum += linear(image.rgba[i]);
    return (sum / (image.width * image.height)) * sample.compensation[c];
  });
  TestValidator.predicate(
    "the map times the compensation averages one",
    means.every((value) => nclose(value, 1, 0.01)),
  );

  const at = (x: number, y: number) =>
    image.rgba[(y * image.width + x) * 4 + 1];
  let inside = 0;
  let across = 0;
  for (let y = 0; y < image.height; y++) {
    for (let x = 1; x < image.width; x++)
      inside = Math.max(inside, Math.abs(at(x, y) - at(x - 1, y)));
    across = Math.max(across, Math.abs(at(0, y) - at(image.width - 1, y)));
  }
  TestValidator.predicate("the tile wraps without a seam", across <= inside);

  const { basis, document } = humanBodyBasisFixture();
  const box: IAutoMovieHumanBodyBasis = {
    ...basis,
    surfaces: [textured(basis.surfaces[0])],
  };
  const build = createHumanBodyBasisBuilder(box);
  const skinOf = (built: ReturnType<typeof build>) =>
    built.model.materials.find((one) => one.id === "skin")!;
  const bare = skinOf(build(document));
  const detailed = skinOf(build({ ...document, skinTone: { strength: 0.5 } }));
  const strength =
    Math.round(
      20 * 0.5 * humanBodySimpleShapeMath.curve(HUMAN_BODY_SKIN_TONE.age, 0),
    ) / 20;
  const expected = createHumanBodySkinToneTexture(
    HUMAN_BODY_SKIN_TONE,
    strength,
  );
  const reference = detailed.baseColorTexture as IAutoMovieTextureReference;
  const turns = 2 / (HUMAN_BODY_SKIN_TONE.tileMillimetres / 1000);
  TestValidator.predicate(
    "a tone strength attaches the tone map and compensates the base colour",
    reference.asset === expected.texture &&
      reference.coordinateSource === "source-uv" &&
      reference.colorSpace === "srgb" &&
      nclose(reference.transform!.scale.x, turns, 1e-6) &&
      reference.sampler!.wrapS === "repeat" &&
      nclose(
        detailed.baseColor.r,
        bare.baseColor.r * expected.compensation[0],
        1e-9,
      ) &&
      nclose(
        detailed.baseColor.g,
        bare.baseColor.g * expected.compensation[1],
        1e-9,
      ) &&
      nclose(
        detailed.baseColor.b,
        bare.baseColor.b * expected.compensation[2],
        1e-9,
      ),
  );
  TestValidator.predicate(
    "the same quantized strength reuses the map",
    (
      skinOf(build({ ...document, skinTone: { strength: 0.51 } }))
        .baseColorTexture as IAutoMovieTextureReference
    ).asset === reference.asset,
  );
  TestValidator.predicate(
    "omission or a zero strength leaves the base colour untextured",
    !bare.baseColorTexture &&
      !skinOf(build({ ...document, skinTone: { strength: 0 } }))
        .baseColorTexture,
  );
  for (const strength of [-0.1, 1.1])
    TestValidator.predicate(
      `a tone strength of ${strength} is refused`,
      throwsError(
        () => build({ ...document, skinTone: { strength } }),
        "Body skin tone",
      ),
    );
  TestValidator.predicate(
    "a skin region without UVs is refused",
    throwsError(
      () =>
        createHumanBodyBasisBuilder(basis)({
          ...document,
          skinTone: { strength: 0.5 },
        }),
      "Body skin tone",
    ),
  );
  TestValidator.predicate(
    "a nonfinite tone strength is refused at admission and a finite one admitted",
    throwsError(() =>
      admitHumanBodyBasisDocument({
        ...document,
        skinTone: { strength: Number.NaN },
      }),
    ) &&
      !throwsError(() =>
        admitHumanBodyBasisDocument({
          ...document,
          skinTone: { strength: 0.3 },
        }),
      ),
  );
};
