import { TestValidator } from "@nestia/e2e";

import {
  FACE_LIKENESS_BROW_BAND_COLUMNS,
  faceLikenessBrowBand,
} from "../../../scripts/face-review/faceLikenessBrowBand";
import { nclose, throwsError } from "../internal/predicates";

/** Two 200-pixel IOD brow columns on white skin at y=100. */
const scene = (top = 100, rows = 14, fibre = 20) => {
  const width = 400;
  const height = 400;
  const rgb = new Uint8Array(width * height * 3).fill(255);
  for (let y = top; y < top + rows; y++)
    for (let x = 0; x < width; x++)
      rgb.fill(fibre, 3 * (y * width + x), 3 * (y * width + x) + 3);
  const landmarks: number[][] = Array.from({ length: 478 }, () => [0, 0]);
  landmarks[33] = [100, 200];
  landmarks[263] = [300, 200];
  for (const [side, x] of [
    ["right", 100],
    ["left", 300],
  ] as const)
    for (const [u, l] of FACE_LIKENESS_BROW_BAND_COLUMNS[side]) {
      landmarks[u] = [x, 105];
      landmarks[l] = [x, 115];
    }
  return { image: { width, height, rgb }, landmarks };
};

/**
 * Brow-band observation, including true missing-data cases. Expectations are
 * measured from a hand-drawn 14-pixel strip at an IOD of 200 pixels; a two-
 * pixel sample makes it 0.07 IOD. The makeup twin extends beyond the brow's
 * two-bin landmark tolerance and must never become a thick fibre reading.
 */
export const test_subject_face_likeness_brow_band = (): void => {
  const base = scene();
  const read = (
    input: ReturnType<typeof scene>,
    side: "right" | "left" = "right",
  ) => faceLikenessBrowBand({ ...input, side });
  TestValidator.predicate(
    "anatomical band",
    nclose(read(base)!, 0.07) && nclose(read(base, "left")!, 0.07),
  );
  TestValidator.predicate(
    "landmark offset within two bins",
    nclose(read(scene(98, 16))!, 0.08) &&
      read(scene(94, 20)) === null &&
      read(scene(100, 30)) === null,
  );
  TestValidator.equals("no fibre contrast", read(scene(100, 14, 255)), null);
  TestValidator.predicate(
    "black skin is no contrast",
    read(scene(100, 14, 0)) !== null &&
      read({
        ...base,
        image: {
          ...base.image,
          rgb: new Uint8Array(base.image.rgb.length),
        },
      }) === null,
  );
  const hair = {
    width: 400,
    height: 400,
    data: new Uint8Array(400 * 400),
  };
  for (let y = 99; y < 116; y++)
    for (let x = 99; x < 102; x++) hair.data[y * 400 + x] = 1;
  TestValidator.equals(
    "fringe excludes its samples",
    faceLikenessBrowBand({ ...base, side: "right", hair }),
    null,
  );
  TestValidator.predicate(
    "other brow is still read",
    nclose(faceLikenessBrowBand({ ...base, side: "left", hair })!, 0.07),
  );
  const partial = scene();
  const [secondUpper, secondLower] = FACE_LIKENESS_BROW_BAND_COLUMNS.right[1];
  partial.landmarks[secondUpper] = [120, 105];
  partial.landmarks[secondLower] = [120, 115];
  TestValidator.predicate(
    "one clear column survives a masked peer",
    nclose(faceLikenessBrowBand({ ...partial, side: "right", hair })!, 0.07),
  );
  const halfCovered = {
    ...hair,
    data: new Uint8Array(400 * 400),
  };
  for (let y = 99; y < 116; y++) halfCovered.data[y * 400 + 99] = 1;
  TestValidator.predicate(
    "sample uses its clear pixels",
    nclose(
      faceLikenessBrowBand({ ...base, side: "right", hair: halfCovered })!,
      0.07,
    ),
  );
  const misplaced = scene();
  for (const [u, l] of FACE_LIKENESS_BROW_BAND_COLUMNS.right) {
    misplaced.landmarks[u] = [100, 10];
    misplaced.landmarks[l] = [100, 20];
  }
  TestValidator.equals("outside frame", read(misplaced), null);
  const below = scene();
  for (const [u, l] of FACE_LIKENESS_BROW_BAND_COLUMNS.right) {
    below.landmarks[u] = [100, 390];
    below.landmarks[l] = [100, 395];
  }
  TestValidator.equals("below frame", read(below), null);
  const outsideWidth = scene();
  for (const [u, l] of FACE_LIKENESS_BROW_BAND_COLUMNS.right) {
    outsideWidth.landmarks[u] = [400, 105];
    outsideWidth.landmarks[l] = [400, 115];
  }
  TestValidator.equals("outside width", read(outsideWidth), null);
  const beforeWidth = scene();
  for (const [u, l] of FACE_LIKENESS_BROW_BAND_COLUMNS.right) {
    beforeWidth.landmarks[u] = [-1, 105];
    beforeWidth.landmarks[l] = [-1, 115];
  }
  TestValidator.equals("before width", read(beforeWidth), null);
  const reversed = scene();
  for (const [u, l] of FACE_LIKENESS_BROW_BAND_COLUMNS.right) {
    reversed.landmarks[u] = [100, 115];
    reversed.landmarks[l] = [100, 105];
  }
  TestValidator.equals("reversed outline", read(reversed), null);
  const noIod = scene();
  noIod.landmarks[263] = noIod.landmarks[33]!;
  TestValidator.equals("zero IOD", read(noIod), null);
  TestValidator.predicate(
    "input frames",
    throwsError(
      () => read({ ...base, image: { ...base.image, rgb: new Uint8Array(1) } }),
      "three bytes",
    ) &&
      throwsError(
        () =>
          faceLikenessBrowBand({
            ...base,
            side: "right",
            hair: { width: 1, height: 1, data: new Uint8Array(1) },
          }),
        "share the image frame",
      ) &&
      throwsError(
        () =>
          faceLikenessBrowBand({
            ...base,
            side: "right",
            hair: { width: 400, height: 400, data: new Uint8Array(1) },
          }),
        "share the image frame",
      ) &&
      throwsError(
        () =>
          faceLikenessBrowBand({
            ...base,
            side: "right",
            hair: { width: 400, height: 1, data: new Uint8Array(400) },
          }),
        "share the image frame",
      ),
  );
};
