import {
  type IAutoMovieHumanFaceBasis,
  createHumanFaceIrisPigment,
  decodePortraitPng,
} from "@automovie/human";
import { TestValidator } from "@nestia/e2e";

import { humanFaceIrisGlobeFixture } from "../internal/humanFaceIrisGlobeFixture";
import { throwsError } from "../internal/predicates";

/** IEC 61966-2-1 sRGB encoding, written independently of the rule. */
const srgb = (value: number): number =>
  Math.round(
    255 *
      (value <= 0.0031308 ? 12.92 * value : 1.055 * value ** (1 / 2.4) - 0.055),
  );

/**
 * The connected-basis iris pigment rule repaints only the anatomical iris of
 * each articulated globe's texture.
 * Scenarios:
 * 1. With a uniform pigment (zero variation) on the analytic globes, the
 *    texel at each disc centre (polar angle 0) is the pupil colour, a texel
 *    18 degrees out is exactly the pigment, and texels beyond the limbus
 *    (40 degrees) and between the eyes stay the texture's white; the left
 *    and right eyes take their own pigments.
 * 2. With variation, the limbal ring (texels whose centres lie at normalized
 *    radius above 0.87 inside the limbus, asin(11.71/24) on the 12 mm globe)
 *    is band 0, which is the base, while stroma texels span colours between
 *    base and base plus variation.
 * 3. Omission and null leave the materials untouched; repeating a pigment
 *    reuses the identical texture string; the basis texture never changes.
 * 4. A lid bound by half weight and an untextured region placed before the
 *    globes are not globes, so the painted texture is the same.
 * 5. A pigment outside the unit range, an articulated eye other than
 *    leftEye and rightEye, a basis without articulated eyes and an eye whose
 *    globe has no embedded texture refuse by name.
 */
export const test_subject_human_iris_pigment_rule = (): void => {
  const basis = humanFaceIrisGlobeFixture();
  const original = basis.materials[1].baseColorTexture;
  const rule = createHumanFaceIrisPigment(basis);
  const brown = { base: [0.05, 0.02, 0.01], variation: [0, 0, 0] };
  const blue = { base: [0.02, 0.05, 0.12], variation: [0, 0, 0] };
  const materials = structuredClone(basis.materials);
  rule({ left: brown, right: blue }, materials);
  const image = decodePortraitPng(materials[1].baseColorTexture as string);
  // Azimuthal UV: texture radius 0.2 * theta / pi of the 256 texels.
  const texel = (centreU: number, degrees: number): number[] => {
    const x = Math.floor((centreU + (0.2 * degrees) / 180) * 256);
    const y = 128;
    return [...image.rgba.subarray(4 * (y * 256 + x), 4 * (y * 256 + x) + 4)];
  };
  const pupil = [0.0025, 0.002, 0.0015].map(srgb);
  TestValidator.equals("left pupil", texel(0.25, 0).slice(0, 3), pupil);
  TestValidator.equals("right pupil", texel(0.75, 0).slice(0, 3), pupil);
  TestValidator.equals(
    "left stroma",
    texel(0.25, 18).slice(0, 3),
    brown.base.map(srgb),
  );
  TestValidator.equals(
    "right stroma",
    texel(0.75, 18).slice(0, 3),
    blue.base.map(srgb),
  );
  TestValidator.equals("sclera kept", texel(0.25, 40), [255, 255, 255, 255]);
  TestValidator.equals("between the eyes", texel(0.5, 0), [255, 255, 255, 255]);
  TestValidator.equals(
    "basis untouched",
    basis.materials[1].baseColorTexture,
    original,
  );
  TestValidator.equals(
    "other materials untouched",
    materials[0],
    basis.materials[0],
  );

  const varied = { base: [0.05, 0.02, 0.01], variation: [0.2, 0.1, 0.05] };
  const banded = structuredClone(basis.materials);
  rule({ left: varied, right: varied }, banded);
  const bands = decodePortraitPng(banded[1].baseColorTexture as string);
  const at = (degrees: number, phiDegrees: number): number[] => {
    const r = (0.2 * degrees) / 180;
    const phi = (phiDegrees * Math.PI) / 180;
    const x = Math.floor((0.25 + r * Math.cos(phi)) * 256);
    const y = Math.floor((0.5 + r * Math.sin(phi)) * 256);
    return [...bands.rgba.subarray(4 * (y * 256 + x), 4 * (y * 256 + x) + 3)];
  };
  // Texels whose centres lie in the limbal ring of the 12 mm globe: normalized
  // radius above 0.87 and inside the limbus less its blended edge.
  const limbus = (Math.asin(11.71 / 24) * 180) / Math.PI;
  const pupilAngle = (Math.asin(3.5 / 24) * 180) / Math.PI;
  const ring: number[][] = [];
  for (let y = 100; y < 156; ++y)
    for (let x = 36; x < 92; ++x) {
      const degrees =
        (Math.hypot((x + 0.5) / 256 - 0.25, (y + 0.5) / 256 - 0.5) / 0.2) * 180;
      const rho = (degrees - pupilAngle) / (limbus - pupilAngle);
      if (rho > 0.88 && degrees < limbus - 0.4)
        ring.push([
          ...bands.rgba.subarray(4 * (y * 256 + x), 4 * (y * 256 + x) + 3),
        ]);
    }
  TestValidator.predicate(
    "limbal ring is the base",
    ring.length > 0 &&
      ring.every((rgb) => rgb.join() === varied.base.map(srgb).join()),
  );
  const low = varied.base.map(srgb);
  const high = varied.base.map((value, c) => srgb(value + varied.variation[c]));
  const stroma = Array.from({ length: 36 }, (_, k) => at(16, k * 10));
  TestValidator.predicate(
    "stroma stays between the band endpoints",
    stroma.every((rgb) =>
      rgb.every((value, c) => value >= low[c] && value <= high[c]),
    ),
  );
  TestValidator.predicate(
    "stroma uses more than one band",
    new Set(stroma.map((rgb) => rgb.join())).size > 1,
  );

  const untouched = structuredClone(basis.materials);
  rule(undefined, untouched);
  rule(null, untouched);
  TestValidator.equals(
    "omission keeps the texture",
    untouched,
    basis.materials,
  );
  const again = structuredClone(basis.materials);
  rule({ left: varied, right: varied }, again);
  TestValidator.predicate(
    "same pigment reuses the same bytes",
    again[1].baseColorTexture === banded[1].baseColorTexture,
  );

  TestValidator.predicate(
    "pigment outside the unit range",
    throwsError(
      () =>
        rule(
          { left: { base: [0.9, 0, 0], variation: [0.2, 0, 0] }, right: brown },
          structuredClone(basis.materials),
        ),
      "unit-range",
    ),
  );
  // A lid bound to the eye by half weight and an untextured region come
  // first; neither is a globe, so the same texels are painted.
  const triangle = {
    positions: [0, 0, 0, 1, 0, 0, 0, 1, 0],
    indices: [0, 1, 2],
    targets: {},
  };
  const decoyed: IAutoMovieHumanFaceBasis = {
    ...basis,
    surfaces: [
      {
        ...triangle,
        id: "lid",
        attachments: [{ owner: "leftEye", rows: [0, 0.5, 1, 0.5, 2, 0.5] }],
        regions: [
          {
            id: "lid/all",
            material: "eye",
            indices: [0, 1, 2],
            uvs: [0, 0, 1, 0, 0, 1],
          },
        ],
      },
      {
        ...triangle,
        id: "plain",
        regions: [
          { id: "plain/all", material: "eye", indices: [0, 1, 2], uvs: null },
        ],
      },
      ...basis.surfaces,
    ],
  };
  const decoyMaterials = structuredClone(basis.materials);
  createHumanFaceIrisPigment(decoyed)(
    { left: brown, right: blue },
    decoyMaterials,
  );
  TestValidator.predicate(
    "partial attachments and untextured regions are not globes",
    decoyMaterials[1].baseColorTexture === materials[1].baseColorTexture,
  );
  const cyclops: IAutoMovieHumanFaceBasis = {
    ...basis,
    articulation: {
      ...basis.articulation!,
      eyes: [
        basis.articulation!.eyes[0],
        { id: "thirdEye", center: "third-eye", gaze: [] },
      ],
    },
  };
  TestValidator.predicate(
    "an eye the document cannot name",
    throwsError(
      () =>
        createHumanFaceIrisPigment(cyclops)(
          { left: brown, right: brown },
          structuredClone(basis.materials),
        ),
      "leftEye and rightEye only",
    ),
  );
  const eyeless: IAutoMovieHumanFaceBasis = {
    ...basis,
    articulation: undefined,
  };
  TestValidator.predicate(
    "basis without articulated eyes",
    throwsError(
      () =>
        createHumanFaceIrisPigment(eyeless)(
          { left: brown, right: brown },
          structuredClone(basis.materials),
        ),
      "articulated eyes",
    ),
  );
  const referenced: IAutoMovieHumanFaceBasis = {
    ...basis,
    materials: [
      basis.materials[0],
      { ...basis.materials[1], baseColorTexture: { uri: "eye.png" } as never },
    ],
  };
  TestValidator.predicate(
    "globe without an embedded texture",
    throwsError(
      () =>
        createHumanFaceIrisPigment(referenced)(
          { left: brown, right: brown },
          structuredClone(referenced.materials),
        ),
      "textured globe for leftEye",
    ),
  );
};
