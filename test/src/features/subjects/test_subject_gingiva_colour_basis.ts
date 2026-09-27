import {
  type IAutoMovieHumanFaceBasis,
  createPortraitMaterials,
  decodePortraitPng,
  encodePortraitPng,
} from "@automovie/human";
import { TestValidator } from "@nestia/e2e";

import {
  faceGingivaTexels,
  faceLabToLinear,
  faceLinearToLab,
  faceMoveTexels,
  prepareGingivaColourBasis,
} from "../../../scripts/face-review/prepareGingivaColourBasis";
import { nclose, throwsError } from "../internal/predicates";

/** The gum grid's vertex at row r (0 lowest) and column c (x -5, 0, 5 mm). */
const G = (r: number, c: number) => 6 + 3 * r + c;

/**
 * A dentition on one 8 x 8 texture: two central crowns (each sealed by a
 * collider; a third collider lies on another surface) whose UVs cover the
 * texture's right half, and a labial gum grid above them facing forward,
 * rows 0, 2.5 and 5 mm above its lowest edge and columns at x -5, 0 and
 * 5 mm, whose UVs cover the left half. One crown triangle repeats a vertex
 * (zero UV area).
 */
const dentition = (): IAutoMovieHumanFaceBasis => {
  const crown = (x: number) => [x, 0, 0, x + 0.004, 0, 0, x, 0.004, 0];
  const positions = [...crown(-0.004), ...crown(0.0005)];
  for (const dy of [0, 0.0025, 0.005])
    for (const x of [-0.005, 0, 0.005]) positions.push(x, 0.005 + dy, 0.001);
  const indices = [0, 1, 2, 3, 4, 5, 0, 0, 1];
  for (let r = 0; r < 2; ++r)
    for (let c = 0; c < 2; ++c)
      indices.push(
        G(r, c),
        G(r, c + 1),
        G(r + 1, c + 1),
        G(r, c),
        G(r + 1, c + 1),
        G(r + 1, c),
      );
  const uvs = [0.6, 0.1, 0.9, 0.1, 0.6, 0.4, 0.6, 0.5, 0.9, 0.5, 0.6, 0.8];
  for (let r = 0; r < 3; ++r)
    for (let c = 0; c < 3; ++c) uvs.push(0.05 + 0.2 * c, 0.05 + 0.45 * r);
  const rgba = new Uint8Array(8 * 8 * 4);
  for (let y = 0; y < 8; ++y)
    for (let x = 0; x < 8; ++x)
      rgba.set(
        x < 4 ? [120 + 10 * y, 40, 40, 255] : [230, 225, 210, 255],
        4 * (y * 8 + x),
      );
  return {
    id: "teeth/1",
    channels: [],
    surfaces: [
      {
        id: "teeth",
        positions,
        indices,
        targets: {},
        regions: [
          {
            id: "teeth/teeth",
            material: "teeth",
            indices: Array.from({ length: 15 }, (_v, v) => v),
            uvs,
          },
        ],
        attachments: [{ owner: "leftEye", rows: [] }],
      },
    ],
    materials: createPortraitMaterials()
      .filter((one) => one.id === "skin")
      .map((one) => ({
        ...one,
        id: "teeth",
        name: "teeth",
        baseColorTexture: encodePortraitPng({ width: 8, height: 8, rgba }),
      })),
    contact: {
      incisors: { surface: "teeth", upper: 0, lower: 3 },
      colliders: [
        { surface: "teeth", closure: [0, 1, 2], reachMetres: 0.01 },
        { surface: "teeth", closure: [3, 4, 5], reachMetres: 0.01 },
        { surface: "eye", closure: [0], reachMetres: 0.01 },
      ],
    },
  } as unknown as IAutoMovieHumanFaceBasis;
};

/**
 * A copy with the region's vertices `without` dropped from its UVs, and no
 * attachments at all.
 */
const unmapped = (without: number[]): IAutoMovieHumanFaceBasis => {
  const one = dentition();
  delete one.surfaces[0]!.attachments;
  const region = one.surfaces[0]!.regions[0]!;
  const keep = region.indices.filter((v) => !without.includes(v));
  region.uvs = keep.flatMap((v) => [
    region.uvs![2 * v]!,
    region.uvs![2 * v + 1]!,
  ]);
  region.indices = keep;
  return one;
};

/**
 * The gingiva's colour moved to its measured norm.
 * Scenarios:
 * 1. The Lab conversions invert each other (to the matrices' seven digits)
 *    for a light and a near-black colour.
 * 2. The gum's texels: the gum triangles' texels less the crowns', then
 *    padding rings to the texture's edges; a triangle with an unmapped
 *    vertex or a zero area covers nothing.
 * 3. Moving texels: only owned texels move; a move out of gamut, past white
 *    or below black, is clamped and counted.
 * 4. On the dentition the site is the middle column's vertex 2.5 mm above
 *    the margin (the side columns lie beyond the central crowns' width);
 *    after the revision it reads the norm, the crowns keep their texels,
 *    the documents and control map are restamped and the input is kept.
 *    An unmapped gum vertex outside the site changes nothing about it.
 * 5. Refusals: a blank or unchanged revision, no contact, an incisor
 *    surface that is not there, a mandibular crown leaving one upper
 *    crown, a gum facing away, an untextured material or a region without
 *    UVs, and an unmapped site.
 */
export const test_subject_gingiva_colour_basis = (): void => {
  const norm: [number, number, number] = [52.9, 23.3, 14.9];
  TestValidator.predicate(
    "conversions",
    [norm, [5, 2, -3] as [number, number, number]].every((lab) =>
      faceLinearToLab(faceLabToLinear(lab)).every((value, k) =>
        nclose(value, lab[k]!, 1e-3),
      ),
    ),
  );

  const owner = faceGingivaTexels({
    width: 4,
    height: 4,
    indices: [0, 1, 2, 3, 4, 5, 0, 0, 1, 0, 1, 9],
    uv: new Map<number, readonly [number, number]>([
      [0, [0, 0]],
      [1, [1, 0]],
      [2, [0, 1]],
      [3, [0.5, 1]],
      [4, [1, 1]],
      [5, [1, 0.5]],
    ]),
    gum: (v) => v < 3,
    rings: 3,
  });
  TestValidator.equals(
    "texels",
    Array.from(owner),
    [1, 1, 2, 2, 1, 1, 1, 2, 1, 1, 1, 1, 1, 1, 1, 1],
  );

  const rgba = new Uint8Array([10, 10, 10, 255, 250, 250, 250, 255]);
  const lighter = faceMoveTexels({
    rgba,
    owner: new Int8Array([1, 1]),
    offset: [20, 0, 0],
  });
  const darker = faceMoveTexels({
    rgba,
    owner: new Int8Array([1, 0]),
    offset: [-20, 0, 0],
  });
  const kept = faceMoveTexels({
    rgba,
    owner: new Int8Array([0, 2]),
    offset: [20, 0, 0],
  });
  TestValidator.predicate(
    "moving texels",
    lighter.texels === 2 &&
      lighter.clamped === 1 &&
      lighter.rgba[0]! > 10 &&
      lighter.rgba[4] === 255 &&
      darker.clamped === 1 &&
      darker.rgba[0] === 0 &&
      darker.rgba[4] === 250 &&
      rgba[0] === 10 &&
      kept.texels === 0 &&
      JSON.stringify(Array.from(kept.rgba)) ===
        JSON.stringify(Array.from(rgba)),
  );

  const basis = dentition();
  const before = JSON.stringify(basis);
  const input = {
    basis,
    documents: [
      { id: "a", name: "a", basis: "teeth/1", shape: {}, expression: {} },
    ],
    controls: { basis: "teeth/1", controls: [] } as never,
    revision: "teeth/2",
    norm,
    band: [0.002, 0.003] as [number, number],
    rings: 4,
  };
  const out = prepareGingivaColourBasis(input);
  const read = (one: IAutoMovieHumanFaceBasis) =>
    decodePortraitPng(one.materials[0]!.baseColorTexture as string).rgba;
  const texel = (bytes: Uint8Array, x: number, y: number) =>
    JSON.stringify([0, 1, 2].map((c) => bytes[4 * (y * 8 + x) + c]!));
  TestValidator.predicate(
    "the site reads the norm",
    out.receipt.site === 1 &&
      out.receipt.after.every((value, k) => Math.abs(value - norm[k]!) < 1) &&
      out.receipt.texels > 0 &&
      texel(read(out.basis), 5, 6) === texel(read(basis), 5, 6) &&
      texel(read(out.basis), 1, 4) !== texel(read(basis), 1, 4),
  );
  TestValidator.predicate(
    "restamped, input kept",
    out.basis.id === "teeth/2" &&
      out.documents[0]!.basis === "teeth/2" &&
      out.controls.basis === "teeth/2" &&
      JSON.stringify(basis) === before,
  );
  TestValidator.predicate(
    "an unmapped vertex outside the site",
    JSON.stringify(
      prepareGingivaColourBasis({ ...input, basis: unmapped([G(2, 2)]) })
        .receipt.before,
    ) === JSON.stringify(out.receipt.before),
  );

  const mandibular = dentition();
  mandibular.surfaces[0]!.attachments = [
    { owner: "jaw", rows: [3, 1, 4, 0.5] },
  ];
  const away = dentition();
  const P = away.surfaces[0]!.positions;
  for (let v = 6; v < 15; ++v) P[3 * v + 2] = -P[3 * v + 2]!;
  const I = away.surfaces[0]!.indices;
  for (let t = 9; t < I.length; t += 3)
    [I[t + 1], I[t + 2]] = [I[t + 2]!, I[t + 1]!];
  const untextured = dentition();
  untextured.materials[0]!.baseColorTexture = null;
  const unregioned = dentition();
  unregioned.surfaces[0]!.regions[0]!.uvs = null;
  const elsewhere = dentition();
  elsewhere.contact!.incisors.surface = "none";
  TestValidator.predicate(
    "refusals",
    [" ", "teeth/1"].every((revision) =>
      throwsError(
        () => prepareGingivaColourBasis({ ...input, revision }),
        "distinct revision",
      ),
    ) &&
      [{ ...basis, contact: undefined }, elsewhere].every((one) =>
        throwsError(
          () => prepareGingivaColourBasis({ ...input, basis: one }),
          "contact basis",
        ),
      ) &&
      throwsError(
        () => prepareGingivaColourBasis({ ...input, basis: mandibular }),
        "two maxillary central crowns",
      ) &&
      throwsError(
        () => prepareGingivaColourBasis({ ...input, basis: away }),
        "No labial maxillary gingiva",
      ) &&
      [untextured, unregioned].every((one) =>
        throwsError(
          () => prepareGingivaColourBasis({ ...input, basis: one }),
          "textured region",
        ),
      ) &&
      throwsError(
        () =>
          prepareGingivaColourBasis({ ...input, basis: unmapped([G(1, 1)]) }),
        "no textured vertex",
      ),
  );
};
