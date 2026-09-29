/**
 * Read a brow's visible vertical band at one scale in a reference photograph
 * or an editor render. `compareFaceLikeness` calls this on each image's own
 * detected landmark frame; `summarizeFaceLikeness` reports only paired sides.
 * The result is an appearance measurement, not a follicle length or a face
 * shape. The hair mask excludes a fringe before any dark pixel is chosen.
 * A column without a readable skin baseline, fibre contrast, or an isolated
 * dark band near the brow landmarks contributes nothing. Images and masks are
 * caller-owned and are never mutated.
 */
import type { IFaceLikenessImage } from "./faceLikenessColour";
import type { IFaceLikenessMask } from "./faceLikenessMasks";

/** Upper and lower brow landmarks in the subject's right and left columns. */
export const FACE_LIKENESS_BROW_BAND_COLUMNS = {
  right: [
    [105, 52],
    [66, 65],
  ],
  left: [
    [334, 282],
    [296, 295],
  ],
} as const;

/** Brow height divided by inter-ocular distance, or null if no column reads. */
export function faceLikenessBrowBand(props: {
  image: IFaceLikenessImage;
  landmarks: readonly (readonly number[])[];
  side: "right" | "left";
  hair?: IFaceLikenessMask;
}): number | null {
  const { image, landmarks, hair } = props;
  if (image.rgb.length !== image.width * image.height * 3)
    throw new Error("A brow image needs three bytes per pixel.");
  if (
    hair !== undefined &&
    (hair.width !== image.width ||
      hair.height !== image.height ||
      hair.data.length !== image.width * image.height)
  )
    throw new Error("A brow hair mask must share the image frame.");
  const [a, b] = [landmarks[33]!, landmarks[263]!];
  const iod = Math.hypot(a[0]! - b[0]!, a[1]! - b[1]!);
  if (!(iod > 0)) return null;
  const step = iod / 100;
  const luminance = (x: number, y: number): number => {
    const offset = 3 * (y * image.width + x);
    const linear = (value: number): number => {
      const c = value / 255;
      return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
    };
    return (
      0.2126 * linear(image.rgb[offset]!) +
      0.7152 * linear(image.rgb[offset + 1]!) +
      0.0722 * linear(image.rgb[offset + 2]!)
    );
  };
  const bands: number[] = [];
  for (const [upper, lower] of FACE_LIKENESS_BROW_BAND_COLUMNS[props.side]) {
    const cx = (landmarks[upper]![0]! + landmarks[lower]![0]!) / 2;
    const cy = (landmarks[upper]![1]! + landmarks[lower]![1]!) / 2;
    const top = cy - 0.25 * iod;
    const x0 = Math.round(cx - step / 2);
    const x1 = Math.max(x0 + 1, Math.round(cx + step / 2));
    const bottom = Math.max(
      Math.round(top + 44 * step) + 1,
      Math.round(top + 45 * step),
    );
    if (
      x0 < 0 ||
      x1 > image.width ||
      Math.round(top) < 0 ||
      bottom > image.height
    )
      continue;
    const samples: (number | null)[] = [];
    const obscured: boolean[] = [];
    for (let k = 0; k < 45; k++) {
      const y0 = Math.round(top + k * step);
      const y1 = Math.max(y0 + 1, Math.round(top + (k + 1) * step));
      let sum = 0;
      let clear = 0;
      let covered = 0;
      for (let y = y0; y < y1; y++)
        for (let x = x0; x < x1; x++) {
          if (hair?.data[y * image.width + x]) covered++;
          else {
            sum += luminance(x, y);
            clear++;
          }
        }
      samples.push(clear === 0 ? null : sum / clear);
      obscured.push(covered > clear);
    }
    const from = Math.max(
      0,
      Math.floor((landmarks[upper]![1]! - top) / step) - 1,
    );
    const to = Math.min(
      44,
      Math.floor((landmarks[lower]![1]! - top) / step) + 1,
    );
    if (from > to) continue;
    const baseline = [0, 1, 2, 3, 4, 5, 39, 40, 41, 42, 43, 44];
    const required = [
      ...baseline,
      ...Array.from({ length: to - from + 1 }, (_, at) => from + at),
    ];
    if (required.some((index) => obscured[index])) continue;
    const ends = baseline.map((index) => samples[index]!).sort((p, q) => p - q);
    const skin = (ends[5]! + ends[6]!) / 2;
    let darkest = from;
    for (let k = from + 1; k <= to; k++)
      if (samples[k]! < samples[darkest]!) darkest = k;
    const fibre = samples[darkest]!;
    if (!(skin > 0 && skin - fibre >= 0.1 * skin)) continue;
    const half = (skin + fibre) / 2;
    let lo = darkest;
    let hi = darkest;
    while (lo > 0 && samples[lo - 1] !== null && samples[lo - 1]! < half) lo--;
    while (hi < 44 && samples[hi + 1] !== null && samples[hi + 1]! < half) hi++;
    // MediaPipe's brow points follow skin, not the hair silhouette. Two bins
    // cover their observed 0.01-0.02 IOD offset; a continuous dark region far
    // below them is commonly makeup or an eye shadow, not a thicker brow.
    if (lo < from - 2 || hi > to + 2) continue;
    bands.push((hi - lo + 1) / 100);
  }
  return bands.length === 0
    ? null
    : bands.reduce((sum, value) => sum + value, 0) / bands.length;
}
