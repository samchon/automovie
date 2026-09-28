import { TestValidator } from "@nestia/e2e";

import {
  faceLikenessBrowCoverage,
  fitFaceLikenessBrowDensity,
  fitFaceLikenessBrowPigment,
} from "../../../scripts/face-review/faceLikenessBrowFit";
import {
  FACE_LIKENESS_BROW_OUTLINES,
  type IFaceLikenessImage,
  faceLikenessBrowColour,
  faceLikenessSrgbToLab,
} from "../../../scripts/face-review/faceLikenessColour";
import type { FaceLikenessPoint } from "../../../scripts/face-review/faceLikenessGeometry";
import type { IFaceLikenessMask } from "../../../scripts/face-review/faceLikenessMasks";
import { nclose, throwsError } from "../internal/predicates";

const SKIN = [200, 150, 120] as const;
const FIBRE = [60, 40, 30] as const;

/**
 * A 100 x 100 image of skin with both brow outlines the 10-point squares
 * x 20..60 (right) and 60..100 (left), y 20..40, one pixel in five of each
 * row painted fibre inside the right brow and none inside the left.
 */
const face = (): { image: IFaceLikenessImage; points: FaceLikenessPoint[] } => {
  const rgb = new Uint8Array(100 * 100 * 3);
  for (let i = 0; i < 100 * 100; ++i) rgb.set(SKIN, 3 * i);
  for (let y = 20; y < 40; ++y)
    for (let x = 20; x < 60; x += 5) rgb.set(FIBRE, 3 * (100 * y + x));
  const points: FaceLikenessPoint[] = new Array(478).fill([0, 0]);
  const square = (x0: number, indices: readonly number[]) =>
    indices.forEach((index, k) => {
      points[index] = k < 5 ? [x0 + 10 * k, 20] : [x0 + 40 - 10 * (k - 5), 40];
    });
  square(20, FACE_LIKENESS_BROW_OUTLINES.right);
  square(60, FACE_LIKENESS_BROW_OUTLINES.left);
  return { image: { width: 100, height: 100, rgb }, points };
};

const mask = (set: (x: number, y: number) => boolean): IFaceLikenessMask => {
  const data = new Uint8Array(100 * 100);
  for (let y = 0; y < 100; ++y)
    for (let x = 0; x < 100; ++x) data[100 * y + x] = set(x, y) ? 1 : 0;
  return { width: 100, height: 100, data };
};

/**
 * Brow fibre colour and its pigment fit.
 * Scenarios:
 * 1. A brow whose outline is one fifth fibre reads the fibre colour, the
 *    darkest tenth of its pixels, and its tone, the median of the whole
 *    outline, reads the skin; a bare brow reads the skin.
 * 2. Hair over a third of the outline is left out and the brow still reads;
 *    hair over more than half and an outline with no pixel give no sample;
 *    a mask of another frame refuses.
 * 3. The pigment is the brow-to-cheek linear ratio times the document skin,
 *    whatever tint the photograph's light adds; a brow brighter than a dark
 *    skin is held at one and flagged; a missing sample gives no pigment and
 *    a black cheek refuses.
 */
export const test_subject_face_likeness_brow = (): void => {
  const { image, points } = face();
  const labClose = (a: readonly number[], b: readonly number[]) =>
    a.every((value, k) => nclose(value, b[k]!, 1e-6));
  TestValidator.predicate(
    "fibre",
    labClose(
      faceLikenessBrowColour(image, points, "right")!.lab,
      faceLikenessSrgbToLab(...FIBRE),
    ),
  );
  const tone = faceLikenessBrowColour(image, points, "right", undefined, 1)!;
  TestValidator.predicate(
    "tone is the median",
    labClose(tone.lab, faceLikenessSrgbToLab(...SKIN)) && tone.pixels > 700,
  );
  TestValidator.predicate(
    "bare",
    labClose(
      faceLikenessBrowColour(image, points, "left")!.lab,
      faceLikenessSrgbToLab(...SKIN),
    ),
  );
  TestValidator.predicate(
    "partial fringe",
    labClose(
      faceLikenessBrowColour(
        image,
        points,
        "right",
        mask((_, y) => y < 26),
      )!.lab,
      faceLikenessSrgbToLab(...FIBRE),
    ),
  );
  TestValidator.equals(
    "fringe",
    faceLikenessBrowColour(
      image,
      points,
      "right",
      mask((_, y) => y < 34),
    ),
    null,
  );
  TestValidator.equals(
    "degenerate outline",
    faceLikenessBrowColour(image, new Array(478).fill([50, 50]), "right"),
    null,
  );
  TestValidator.predicate(
    "mask frame",
    throwsError(
      () =>
        faceLikenessBrowColour(image, points, "right", {
          width: 1,
          height: 1,
          data: new Uint8Array(1),
        }),
      "hair mask",
    ),
  );

  const linearToLab = (rgb: readonly number[]): [number, number, number] => {
    const encode = (value: number): number =>
      255 *
      (value <= 0.0031308 ? 12.92 * value : 1.055 * value ** (1 / 2.4) - 0.055);
    return faceLikenessSrgbToLab(
      encode(rgb[0]!),
      encode(rgb[1]!),
      encode(rgb[2]!),
    );
  };
  const light = [0.9, 0.8, 0.6];
  const fit = fitFaceLikenessBrowPigment({
    brow: linearToLab(light.map((value, c) => value * [0.05, 0.03, 0.02][c]!)),
    cheek: linearToLab(light.map((value, c) => value * [0.5, 0.3, 0.2][c]!)),
    skin: [0.6, 0.36, 0.26],
  })!;
  TestValidator.predicate(
    "ratio times skin",
    fit.pigment.every((value, c) =>
      nclose(value, [0.06, 0.036, 0.026][c]!, 1e-3),
    ) && !fit.clamped,
  );
  const bright = fitFaceLikenessBrowPigment({
    brow: linearToLab([0.8, 0.8, 0.8]),
    cheek: linearToLab([0.2, 0.2, 0.2]),
    skin: [0.3, 0.3, 0.3],
  })!;
  TestValidator.predicate(
    "clamped",
    bright.clamped && bright.pigment.every((value) => value === 1),
  );
  TestValidator.equals(
    "missing",
    [
      fitFaceLikenessBrowPigment({
        brow: null,
        cheek: [50, 0, 0],
        skin: [0.5, 0.5, 0.5],
      }),
      fitFaceLikenessBrowPigment({
        brow: [50, 0, 0],
        cheek: null,
        skin: [0.5, 0.5, 0.5],
      }),
    ],
    [null, null],
  );
  TestValidator.predicate(
    "black cheek",
    throwsError(
      () =>
        fitFaceLikenessBrowPigment({
          brow: [20, 0, 0],
          cheek: [0, 0, 0],
          skin: [0.5, 0.5, 0.5],
        }),
      "positive linear colour",
    ),
  );
};

/** CIELAB of a grey of relative luminance `y`. */
const grey = (y: number): [number, number, number] => [
  y > 216 / 24389 ? 116 * Math.cbrt(y) - 16 : (24389 / 27) * y,
  0,
  0,
];

/** A side whose fibres cover `c` of the outline, cheek at `cheek`. */
const side = (c: number, fibre = 0.2, cheek = 0.5) => ({
  tone: grey(cheek * (c * fibre + (1 - c))),
  fibre: grey(cheek * fibre),
  cheek: grey(cheek),
});

/**
 * Brow density from the coverage its outline shows.
 * Scenarios:
 * 1. An outline whose fibres (a fifth of the cheek's luminance) cover 0.4 of
 *    it reads 0.4 at any exposure; a tone lighter than the cheek reads none
 *    and one darker than the fibres all; fibres within a tenth of the skin's
 *    luminance, and a black cheek, read nothing.
 * 2. A photograph covered 0.4 against a render covered 0.8 at density 1.5
 *    asks for 0.75; an unreadable side is left out of its mean; a
 *    photograph or render that reads nothing, or a render with no coverage,
 *    gives no density; the density is held to 4.
 */
export const test_subject_face_likeness_brow_density = (): void => {
  TestValidator.predicate(
    "coverage",
    nclose(faceLikenessBrowCoverage(side(0.4))!, 0.4, 1e-9) &&
      nclose(faceLikenessBrowCoverage(side(0.4, 0.2, 0.05))!, 0.4, 1e-9) &&
      faceLikenessBrowCoverage({ ...side(0), tone: grey(0.6) }) === 0 &&
      faceLikenessBrowCoverage({ ...side(1), tone: grey(0.05) }) === 1 &&
      faceLikenessBrowCoverage(side(0.4, 0.95)) === null &&
      faceLikenessBrowCoverage({ ...side(0.4), cheek: [0, 0, 0] }) === null,
  );
  const fit = fitFaceLikenessBrowDensity({
    photograph: [side(0.4), side(0.4, 0.95)],
    render: [side(0.8), side(0.8)],
    density: 1.5,
  })!;
  TestValidator.predicate(
    "density",
    nclose(fit.density, 0.75, 1e-9) &&
      nclose(fit.photograph, 0.4, 1e-9) &&
      nclose(fit.render, 0.8, 1e-9) &&
      fitFaceLikenessBrowDensity({
        photograph: [side(0.4, 0.95)],
        render: [side(0.8)],
        density: 1,
      }) === null &&
      fitFaceLikenessBrowDensity({
        photograph: [side(0.4)],
        render: [],
        density: 1,
      }) === null &&
      fitFaceLikenessBrowDensity({
        photograph: [side(0.4)],
        render: [side(0)],
        density: 1,
      }) === null &&
      fitFaceLikenessBrowDensity({
        photograph: [side(0.9)],
        render: [side(0.1)],
        density: 1,
      })!.density === 4,
  );
};
