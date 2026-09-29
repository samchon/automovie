import {
  HUMAN_BODY_SKIN_SITES,
  type IAutoMovieHumanBodyBasis,
  type IAutoMovieHumanBodySkinDetail,
  createHumanBodyBasisBuilder,
  createHumanBodySkinDetailTexture,
} from "@automovie/human";
import type { IAutoMovieTextureReference } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { humanBodyBasisFixture } from "../internal/humanBodyBasisFixture";
import { namedFacts, throwsError } from "../internal/predicates";

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

/** The analytic box's surface given a UV layout, as the relief test lays it. */
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
 * A surface's nail plates bind independently of optional skin micro-relief.
 *
 * Scenarios:
 * 1. With a nails layer, a document with skin detail gets one replacing
 *    overlay on the skin: its colour and normal map bound once over the
 *    UVs, clamped, sRGB and linear, its roughness, and full strength. A
 *    layer without a normal map binds none.
 * 2. A document without skin detail still wears its nail plates; one with a
 *    cheek over nails drawn for another tints them by the palm's albedo
 *    against that cheek's, and without a drawn cheek the nails stay as drawn.
 * 3. A layer of an unknown kind is refused by the schema; a second nails
 *    layer on the same material, a colour or normal map that is not a PNG
 *    data URI, a material without textured regions and a roughness outside
 *    [0, 1] by the basis admission.
 * 4. A textured non-skin material still cannot silently consume an anatomical
 *    nail layer intended to replace skin.
 */
export const test_human_body_skin_overlays = (): void => {
  const { basis, document } = humanBodyBasisFixture();
  const box = textured(basis.surfaces[0]);
  const png = createHumanBodySkinDetailTexture(FLAT);
  const nails = {
    kind: "nails" as const,
    material: "skin",
    color: png,
    normal: png,
    roughness: 0.25,
  };
  const withOverlays = (overlays: unknown[]): IAutoMovieHumanBodyBasis => ({
    ...basis,
    surfaces: [{ ...box, overlays } as Surface],
  });
  const skinOf = (overlays: unknown[], detail: boolean) =>
    createHumanBodyBasisBuilder(withOverlays(overlays))({
      ...document,
      ...(detail ? { skinDetail: { strength: 0.5 } } : {}),
    }).model.materials.find((one) => one.id === "skin")!;
  const skin = skinOf([nails], true);
  const overlay = skin.overlays?.[0];
  const colour = overlay?.baseColorTexture as IAutoMovieTextureReference;
  const normal = overlay?.normalTexture as IAutoMovieTextureReference;
  TestValidator.predicate(
    "the nails replace the skin where they cover",
    skin.overlays?.length === 1 &&
      overlay!.blend === "replace" &&
      overlay!.roughness === 0.25 &&
      overlay!.strength === 1 &&
      colour.asset === png &&
      colour.colorSpace === "srgb" &&
      colour.transform === undefined &&
      colour.sampler!.wrapS === "clamp" &&
      normal.asset === png &&
      normal.colorSpace === "linear" &&
      normal.sampler!.wrapT === "clamp" &&
      skinOf([{ ...nails, normal: undefined }], true).overlays![0]!
        .normalTexture === null,
  );
  TestValidator.predicate(
    "nail plates remain when micro-relief is omitted",
    skinOf([nails], false).overlays?.[0]?.blend === "replace",
  );
  // a document's cheek tints the nails by the palm's albedo against the
  // cheek they were drawn for
  const drawn = { r: 0.46, g: 0.27, b: 0.21 };
  const own = { r: 0.08, g: 0.045, b: 0.03 };
  const tinted = createHumanBodyBasisBuilder(
    withOverlays([{ ...nails, cheek: drawn }]),
  )({
    ...document,
    skinDetail: { strength: 0.5 },
    skinColour: { cheek: own },
  }).model.materials.find((one) => one.id === "skin")!.overlays![0]!;
  const palm = (rgb: { r: number; g: number; b: number }) =>
    HUMAN_BODY_SKIN_SITES.sites.palmar.map(
      ([a, b], k) => Math.exp(a) * [rgb.r, rgb.g, rgb.b][k]! ** b,
    );
  const ratio = palm(own).map((value, k) => value / palm(drawn)[k]!);
  TestValidator.predicate(
    "a document's cheek tints the nails by the palm's albedo",
    Math.abs(tinted.colorFactor!.r - ratio[0]!) < 1e-12 &&
      Math.abs(tinted.colorFactor!.g - ratio[1]!) < 1e-12 &&
      Math.abs(tinted.colorFactor!.b - ratio[2]!) < 1e-12 &&
      tinted.colorFactor!.b < tinted.colorFactor!.r &&
      skin.overlays![0]!.colorFactor === undefined,
  );
  const refused = (overlays: unknown[]): boolean =>
    throwsError(
      () => createHumanBodyBasisBuilder(withOverlays(overlays)),
      "Body surface overlays",
    );
  TestValidator.equals(
    "malformed layers are refused",
    namedFacts([
      [
        "kind",
        () =>
          throwsError(() =>
            createHumanBodyBasisBuilder(
              withOverlays([{ ...nails, kind: "freckles" }]),
            ),
          ),
      ],
      ["twice", () => refused([nails, nails])],
      ["colour", () => refused([{ ...nails, color: "nails.png" }])],
      ["normal", () => refused([{ ...nails, normal: "nails-normal.png" }])],
      ["material", () => refused([{ ...nails, material: "flesh" }])],
      ["roughness", () => refused([{ ...nails, roughness: 1.5 }])],
      ["cheek", () => refused([{ ...nails, cheek: { r: 0, g: 0.3, b: 0.2 } }])],
    ]),
    {
      kind: true,
      twice: true,
      colour: true,
      normal: true,
      material: true,
      roughness: true,
      cheek: true,
    },
  );
  const other = withOverlays([{ ...nails, material: "flesh" }]);
  other.materials = [...basis.materials, { ...basis.materials[0], id: "flesh" }];
  other.surfaces[0].regions[0].material = "flesh";
  TestValidator.predicate(
    "a textured non-skin material cannot silently swallow nails",
    throwsError(() => createHumanBodyBasisBuilder(other), "skin material"),
  );
};
