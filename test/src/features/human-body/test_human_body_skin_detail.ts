import { seededValue } from "@automovie/engine";
import {
  HUMAN_BODY_SKIN_DETAIL,
  type IAutoMovieHumanBodyBasis,
  type IAutoMovieHumanBodySkinDetail,
  admitHumanBodyBasisDocument,
  createHumanBodyBasisBuilder,
  createHumanBodySkinDetailTexture,
  decodePortraitPng,
  humanBodySimpleShapeMath,
  humanBodySkinMetresPerUv,
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
 * The skin's micro-relief is a tiled normal map generated from measured line
 * and pore statistics and tiled at the UV layout's physical scale.
 *
 * Scenarios:
 * 1. The same table gives the same bytes and another seed other bytes; a
 *    flat table (no lines, pores of zero depth) is the flat normal
 *    `(128, 128, 255)` everywhere at the table's size, opaque.
 * 2. One line family of four grooves along X, neither wandering nor
 *    varying: the texels midway between grooves are flat and those just past
 *    a groove tilt toward it, red below 128 on its +X side and above on its
 *    -X side.
 * 3. A single pore is a dimple: the texel beside its centre on +X tilts
 *    toward -X (red below 128) and the one on -X toward +X.
 * 4. The layout scale is the median metres per UV unit (two on the box
 *    mapped at half scale), and a layout of zero area is refused.
 * 5. Through the builder, a detail strength attaches the normal map to the
 *    skin material, source UVs repeated at the layout scale over the tile,
 *    with a normal scale of the strength times the age curve at the
 *    document's age; omission leaves the material untextured.
 * 6. A strength outside [0,1], a skin region without UVs and a basis without
 *    the skin material are refused; a nonfinite strength is refused at
 *    admission and a finite one admitted.
 */
export const test_human_body_skin_detail = (): void => {
  const small = { ...HUMAN_BODY_SKIN_DETAIL, pixels: 48 };
  const sample = createHumanBodySkinDetailTexture(small);
  TestValidator.predicate(
    "the same table gives the same bytes and another seed others",
    sample === createHumanBodySkinDetailTexture(small) &&
      sample !== createHumanBodySkinDetailTexture({ ...small, seed: 2 }),
  );
  const flat = decodePortraitPng(createHumanBodySkinDetailTexture(FLAT));
  TestValidator.predicate(
    "a flat table is the flat normal",
    flat.width === 32 &&
      flat.height === 32 &&
      Array.from({ length: 32 * 32 }, (_, i) => i).every(
        (i) =>
          flat.rgba[i * 4] === 128 &&
          flat.rgba[i * 4 + 1] === 128 &&
          flat.rgba[i * 4 + 2] === 255 &&
          flat.rgba[i * 4 + 3] === 255,
      ),
  );

  const grooves = decodePortraitPng(
    createHumanBodySkinDetailTexture({
      ...FLAT,
      pixels: 64,
      lines: [{ a: 4, b: 0, depth: 40, width: 200, wander: 0, vary: 0 }],
    }),
  );
  const red = (image: typeof grooves, x: number, y: number) =>
    image.rgba[(y * image.width + x) * 4];
  const columns = (offset: number) =>
    Array.from({ length: 4 }, (_, k) => offset + 16 * k);
  const rows = Array.from({ length: 64 }, (_, y) => y);
  const everywhere = (offset: number, test: (value: number) => boolean) =>
    columns(offset).every((x) => rows.every((y) => test(red(grooves, x, y))));
  TestValidator.predicate(
    "the grooves sit a quarter tile apart and tilt both ways across each",
    everywhere(8, (value) => value === 128) &&
      everywhere(1, (value) => value < 128) &&
      everywhere(15, (value) => value > 128),
  );

  const pore = createHumanBodySkinDetailTexture({
    ...FLAT,
    pixels: 64,
    pores: {
      perSquareCentimetre: 1,
      radiusMicrometres: 600,
      depthMicrometres: 30,
    },
  });
  const image = decodePortraitPng(pore);
  const cx = Math.floor(seededValue(FLAT.seed, 7, 0, 0, 1) * 64);
  const cy = Math.floor(seededValue(FLAT.seed, 7, 0, 0, 2) * 64);
  TestValidator.predicate(
    "a pore is a dimple",
    red(image, (cx + 3) % 64, cy) < 128 && red(image, (cx + 61) % 64, cy) > 128,
  );

  const { basis, document } = humanBodyBasisFixture();
  const box = textured(basis.surfaces[0]);
  const withBox = (surface: Surface): IAutoMovieHumanBodyBasis => ({
    ...basis,
    surfaces: [surface],
  });
  TestValidator.predicate(
    "the layout scale is the median metres per UV unit",
    nclose(humanBodySkinMetresPerUv(withBox(box), "skin"), 2, 1e-9),
  );
  TestValidator.predicate(
    "a layout of zero area is refused",
    throwsError(
      () =>
        humanBodySkinMetresPerUv(
          withBox({
            ...box,
            regions: [
              { ...box.regions[0], uvs: box.regions[0].uvs!.map(() => 0) },
            ],
          }),
          "skin",
        ),
      "UV layout",
    ),
  );

  const build = createHumanBodyBasisBuilder(withBox(box));
  const detailed = build({ ...document, skinDetail: { strength: 0.5 } });
  const skin = detailed.model.materials.find((one) => one.id === "skin")!;
  const reference = skin.normalTexture as IAutoMovieTextureReference;
  const turns = 2 / (HUMAN_BODY_SKIN_DETAIL.tileMillimetres / 1000);
  TestValidator.predicate(
    "a strength attaches the tiled normal map",
    reference.asset ===
      createHumanBodySkinDetailTexture(HUMAN_BODY_SKIN_DETAIL) &&
      reference.coordinateSource === "source-uv" &&
      reference.colorSpace === "linear" &&
      nclose(reference.transform!.scale.x, turns, 1e-6) &&
      nclose(reference.transform!.scale.y, turns, 1e-6) &&
      reference.sampler!.wrapS === "repeat" &&
      nclose(
        skin.normalScale!,
        0.5 * humanBodySimpleShapeMath.curve(HUMAN_BODY_SKIN_DETAIL.age, 0),
        1e-12,
      ),
  );
  const again = build({ ...document, skinDetail: { strength: 1 } });
  TestValidator.predicate(
    "the tile is generated once and reused",
    (
      again.model.materials.find((one) => one.id === "skin")!
        .normalTexture as IAutoMovieTextureReference
    ).asset === reference.asset,
  );
  TestValidator.predicate(
    "omission leaves the skin untextured",
    build(document).model.materials.find((one) => one.id === "skin")!
      .normalTexture === undefined,
  );

  for (const strength of [-0.1, 1.1])
    TestValidator.predicate(
      `a strength of ${strength} is refused`,
      throwsError(
        () => build({ ...document, skinDetail: { strength } }),
        "Body skin detail",
      ),
    );
  TestValidator.predicate(
    "a skin region without UVs is refused",
    throwsError(
      () =>
        createHumanBodyBasisBuilder(basis)({
          ...document,
          skinDetail: { strength: 0.5 },
        }),
      "Body skin detail",
    ),
  );
  const bare: IAutoMovieHumanBodyBasis = {
    ...withBox(box),
    materials: basis.materials.map((one) => ({ ...one, id: "flesh" })),
    surfaces: [
      {
        ...box,
        regions: box.regions.map((r) => ({ ...r, material: "flesh" })),
      },
    ],
  };
  TestValidator.predicate(
    "a basis without the skin material is refused",
    throwsError(
      () =>
        createHumanBodyBasisBuilder(bare)({
          ...document,
          skinDetail: { strength: 0.5 },
        }),
      "Body skin detail",
    ),
  );
  TestValidator.predicate(
    "a nonfinite strength is refused at admission and a finite one admitted",
    throwsError(() =>
      admitHumanBodyBasisDocument({
        ...document,
        skinDetail: { strength: Number.NaN },
      }),
    ) &&
      !throwsError(() =>
        admitHumanBodyBasisDocument({
          ...document,
          skinDetail: { strength: 0.3 },
        }),
      ),
  );
};
