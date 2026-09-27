import { TestValidator } from "@nestia/e2e";

import {
  FACE_LIKENESS_CREASE_CALIBRATION,
  FACE_LIKENESS_CREASE_LINES,
  faceLidCreaseWeight,
  measureFaceLikenessCrease,
} from "../../../scripts/face-review/faceLikenessCrease";
import { nclose, throwsError } from "../internal/predicates";

/**
 * A 100 x 100 grey image (sRGB 200) with each lid's three lines running
 * straight up 64 px from y = 80 to y = 16, at x = 20..24 on the subject's
 * right and 70..74 on the left. `row(y)` paints one row a darker grey.
 */
const scene = (rows: Record<number, number>) => {
  const rgb = new Uint8Array(100 * 100 * 3).fill(200);
  for (const [y, value] of Object.entries(rows))
    for (let x = 0; x < 100; ++x)
      for (let c = 0; c < 3; ++c) rgb[3 * (Number(y) * 100 + x) + c] = value;
  const landmarks: [number, number][] = Array.from({ length: 478 }, () => [
    50, 50,
  ]);
  const place = (lines: readonly (readonly [number, number])[], x: number) =>
    lines.forEach(([lid, brow], k) => {
      landmarks[lid] = [x + 2 * k, 80];
      landmarks[brow] = [x + 2 * k, 16];
    });
  place(FACE_LIKENESS_CREASE_LINES.right, 20);
  place(FACE_LIKENESS_CREASE_LINES.left, 70);
  return { image: { width: 100, height: 100, rgb }, landmarks };
};

/**
 * The upper lid's crease read in an image and carried into the control.
 * Scenarios:
 * 1. A one-pixel dark row a quarter of the way from the margin to the brow
 *    reads as a valley there, as deep as its luminance's shortfall below
 *    the grey, on both lids; a uniform image reads none; a broad ramp
 *    darkening toward the brow (the orbital hollow's shading) reads none;
 *    lines leaving the image read null.
 * 2. Both lids readable at or above the threshold carry the layer's depth
 *    (-layer / depth), below it none; a lid shorter than the calibration's
 *    span falls back to the population (European: the crease; East Asian
 *    at their shares: both sexes above one half), and without recorded
 *    facts to the start (null); a control shallower than the layer refuses.
 */
export const test_subject_face_lid_crease = (): void => {
  const lum = (v: number) => {
    const c = v / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  const dark = scene({ 64: 100 });
  const read = measureFaceLikenessCrease(dark.image, dark.landmarks);
  const expected = (lum(200) - lum(100)) / lum(200);
  TestValidator.predicate(
    "a crease line",
    read.right !== null &&
      read.left !== null &&
      nclose(read.right.depth, expected, 1e-9) &&
      nclose(read.left.depth, expected, 1e-9) &&
      read.right.at === 0.25 &&
      nclose(read.right.span, 64, 1e-12),
  );
  const flat = scene({});
  const ramp = scene(
    Object.fromEntries(
      Array.from({ length: 40 }, (_, k) => [16 + k, 120 + 2 * k]),
    ),
  );
  const outside = scene({});
  outside.landmarks[FACE_LIKENESS_CREASE_LINES.right[0]![1]] = [20, -5];
  TestValidator.predicate(
    "no crease",
    measureFaceLikenessCrease(flat.image, flat.landmarks).right!.depth === 0 &&
      measureFaceLikenessCrease(ramp.image, ramp.landmarks).right!.depth <
        1e-9 &&
      measureFaceLikenessCrease(outside.image, outside.landmarks).right ===
        null,
  );
  const side = (depth: number, span: number) => ({ depth, at: 0.25, span });
  const wide = FACE_LIKENESS_CREASE_CALIBRATION.span;
  const threshold = FACE_LIKENESS_CREASE_CALIBRATION.threshold;
  const weight = (
    reading: Parameters<typeof faceLidCreaseWeight>[0]["reading"],
    facts: Parameters<typeof faceLidCreaseWeight>[0]["facts"],
  ) => faceLidCreaseWeight({ reading, facts, layer: 0.00174, depth: 0.00348 });
  const european = { ancestry: "european" as const, sex: "male" as const };
  TestValidator.predicate(
    "the rule",
    weight(
      { right: side(threshold, wide), left: side(threshold, wide) },
      european,
    )?.weight === -0.5 &&
      weight(
        {
          right: side(threshold + 0.1, wide),
          left: side(threshold - 0.1, wide),
        },
        european,
      )?.source === "photographed" &&
      weight({ right: side(0.05, wide), left: side(0.1, wide) }, european)
        ?.weight === 0 &&
      weight({ right: side(0.05, wide - 1), left: side(0.05, wide) }, european)
        ?.source === "prior" &&
      weight(null, european)?.weight === -0.5 &&
      weight(null, { ancestry: "asian", sex: "male" })?.weight === -0.5 &&
      weight(null, { ancestry: "asian", sex: null }) === null &&
      throwsError(
        () =>
          faceLidCreaseWeight({
            reading: null,
            facts: european,
            layer: 0.00174,
            depth: 0.001,
          }),
        "layer's depth",
      ),
  );
};
