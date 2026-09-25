import type { IFaceLikenessImage } from "../../../scripts/face-review/faceLikenessColour";
import type { FaceLikenessPoint } from "../../../scripts/face-review/faceLikenessGeometry";
import type { IFaceLikenessMask } from "../../../scripts/face-review/faceLikenessMasks";

/**
 * A hand-built frontal face for the face likeness measurement scenarios.
 *
 * The 478 MediaPipe points are first laid on a 22-column, 5 px grid covering
 * x and y 100..205, so the face bounds are known, and the points the
 * measurement reads are then placed on known geometry in a 300 by 300 image:
 *
 * - subject's right eye (image left): corners 33 (120,140) and 133 (140,140),
 *   lids 159 (130,136) and 145 (130,144), aperture 8/20 = 0.4, its sixteen
 *   contour points on the ellipse centred (130,140) with radii 10 and 4;
 * - left eye: corners 362 (160,140) and 263 (180,140), lids 386 (170,137)
 *   and 374 (170,143), aperture 6/20 = 0.3, ellipse radii 10 and 3;
 * - irises 468 and 473 at the eye centres with rim radius 3;
 * - mouth corners 61 (135,180) and 291 (165,180) below the lip centre
 *   13/14 (mean y 184), lift 4/30; nose tip 1 (150,160), chin 152 (150,205);
 * - cheeks 205 (125,165) and 425 (175,165). Inter-ocular distance is 40.
 *
 * The image is skin everywhere, hair above `hairRows`, and iris colour in a
 * 3 px disc at each iris centre. The mask is set on the same hair rows.
 */
export const FACE_LIKENESS_SKIN = [200, 150, 120] as const;
export const FACE_LIKENESS_HAIR = [40, 30, 20] as const;
export const FACE_LIKENESS_IRIS = [60, 90, 140] as const;

export function createFaceLikenessLandmarks(): FaceLikenessPoint[] {
  const points: [number, number][] = Array.from({ length: 478 }, (_, index) => [
    100 + (index % 22) * 5,
    100 + Math.floor(index / 22) * 5,
  ]);
  const place = (index: number, x: number, y: number): void => {
    points[index] = [x, y];
  };
  const right = [
    33, 7, 163, 144, 145, 153, 154, 155, 133, 173, 157, 158, 159, 160, 161, 246,
  ];
  const left = [
    263, 249, 390, 373, 374, 380, 381, 382, 362, 398, 384, 385, 386, 387, 388,
    466,
  ];
  right.forEach((index, k) => {
    const angle = Math.PI - (k * Math.PI) / 8;
    place(index, 130 + 10 * Math.cos(angle), 140 + 4 * Math.sin(angle));
  });
  left.forEach((index, k) => {
    const angle = (k * Math.PI) / 8;
    place(index, 170 + 10 * Math.cos(angle), 140 + 3 * Math.sin(angle));
  });
  for (const [centre, cx] of [
    [468, 130],
    [473, 170],
  ] as const) {
    place(centre, cx, 140);
    place(centre + 1, cx + 3, 140);
    place(centre + 2, cx, 137);
    place(centre + 3, cx - 3, 140);
    place(centre + 4, cx, 143);
  }
  place(61, 135, 180);
  place(291, 165, 180);
  place(13, 150, 182);
  place(14, 150, 186);
  place(1, 150, 160);
  place(152, 150, 205);
  place(205, 125, 165);
  place(425, 175, 165);
  // Exact lid points: the ellipse evaluation leaves tiny cosine residue.
  place(33, 120, 140);
  place(133, 140, 140);
  place(159, 130, 136);
  place(145, 130, 144);
  place(263, 180, 140);
  place(362, 160, 140);
  place(386, 170, 137);
  place(374, 170, 143);
  return points;
}

export function createFaceLikenessImage(hairRows = 110): IFaceLikenessImage {
  const width = 300;
  const height = 300;
  const rgb = new Uint8Array(width * height * 3);
  for (let y = 0; y < height; ++y)
    for (let x = 0; x < width; ++x) {
      const iris =
        Math.min(
          Math.hypot(x + 0.5 - 130, y + 0.5 - 140),
          Math.hypot(x + 0.5 - 170, y + 0.5 - 140),
        ) <= 3;
      const colour =
        y < hairRows
          ? FACE_LIKENESS_HAIR
          : iris
            ? FACE_LIKENESS_IRIS
            : FACE_LIKENESS_SKIN;
      rgb.set(colour, 3 * (y * width + x));
    }
  return { width, height, rgb };
}

export function createFaceLikenessMask(
  rows: number,
  width = 300,
  height = 300,
): IFaceLikenessMask {
  const data = new Uint8Array(width * height);
  data.fill(1, 0, Math.min(rows, height) * width);
  return { width, height, data };
}
