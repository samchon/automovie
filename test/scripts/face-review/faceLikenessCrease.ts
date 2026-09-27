import type { IFaceLikenessImage } from "./faceLikenessColour";
import type { IFacePopulationFacts } from "./facePopulationFacts";

/**
 * The three lines each upper lid's crease is read along: from a point of
 * the lid margin to the brow's lower edge above it (the 478-point mesh:
 * the margin's points either side of and above the pupil, 160, 159 and 158
 * under the brow's 53, 52 and 65 on the subject's right, and their mirrors
 * on the left).
 */
export const FACE_LIKENESS_CREASE_LINES = {
  right: [
    [160, 53],
    [159, 52],
    [158, 65],
  ],
  left: [
    [387, 283],
    [386, 282],
    [385, 295],
  ],
} as const;

/** One lid's crease reading. */
export interface IFaceLikenessCreaseSide {
  /**
   * The deepest narrow valley of luminance between the margin and the brow,
   * as a fraction of the lesser of the brightest points within five of the
   * 64 steps either side of it (0 where the profile has no valley).
   */
  depth: number;
  /** Where it lies from the margin (0) to the brow (1). */
  at: number | null;
  /** The middle line's length, pixels. */
  span: number;
}

/**
 * Each upper lid's supratarsal crease as a photograph or render shows it.
 *
 * Along each of the side's three lines, 65 equally spaced samples of
 * relative luminance (the sRGB decoding, IEC 61966-2-1, weighted as
 * Rec. 709 Y; bilinear between pixel centres, a pixel's centre at its
 * integer coordinate as the detector reports landmarks) are taken from the
 * margin to the brow and averaged across the lines. The crease is a narrow
 * dark line parallel to the margin (the preseptal fold's shadow at the
 * levator's skin insertion), so the reading is the deepest dip below the
 * brightest samples within five steps either side, from the sixth sample to
 * the forty-fourth (the margin's lashes and the brow's own edge left out):
 * the orbital hollow's broad shading under the brow, which a render without
 * a crease shows too, does not make one. `blur`, for reading a render as a
 * photograph resolves it, is a Gaussian's standard deviation as a fraction
 * of the inter-ocular distance (the outer canthi, 33 and 263), applied to
 * the luminance before sampling (0, the default, reads the image as it is).
 * Null for a side whose points leave the image. Pure.
 */
export function measureFaceLikenessCrease(
  image: IFaceLikenessImage,
  landmarks: readonly (readonly [number, number])[],
  blur = 0,
): {
  right: IFaceLikenessCreaseSide | null;
  left: IFaceLikenessCreaseSide | null;
} {
  if (image.rgb.length !== image.width * image.height * 3)
    throw new Error("An image needs three bytes per pixel.");
  const decode = (value: number): number => {
    const c = value / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  const luminance = (x: number, y: number): number => {
    const i = 3 * (y * image.width + x);
    return (
      0.2126 * decode(image.rgb[i]!) +
      0.7152 * decode(image.rgb[i + 1]!) +
      0.0722 * decode(image.rgb[i + 2]!)
    );
  };
  if (!(blur >= 0)) throw new Error("A blur is zero or more.");
  const sigma =
    blur *
    Math.hypot(
      landmarks[33]![0] - landmarks[263]![0],
      landmarks[33]![1] - landmarks[263]![1],
    );
  // The luminance the lines read, over the box around every line's points,
  // blurred by a separable Gaussian (edges held) where `sigma` is positive.
  const points = [
    ...FACE_LIKENESS_CREASE_LINES.right,
    ...FACE_LIKENESS_CREASE_LINES.left,
  ].flatMap(([a, b]) => [landmarks[a]!, landmarks[b]!]);
  const pad = Math.ceil(3 * sigma) + 2;
  const bx0 = Math.max(
    0,
    Math.floor(Math.min(...points.map(([x]) => x))) - pad,
  );
  const by0 = Math.max(
    0,
    Math.floor(Math.min(...points.map(([, y]) => y))) - pad,
  );
  const bx1 = Math.min(
    image.width - 1,
    Math.ceil(Math.max(...points.map(([x]) => x))) + pad,
  );
  const by1 = Math.min(
    image.height - 1,
    Math.ceil(Math.max(...points.map(([, y]) => y))) + pad,
  );
  const bw = Math.max(0, bx1 - bx0 + 1);
  const bh = Math.max(0, by1 - by0 + 1);
  let field = new Float64Array(bw * bh);
  for (let y = 0; y < bh; ++y)
    for (let x = 0; x < bw; ++x)
      field[y * bw + x] = luminance(bx0 + x, by0 + y);
  if (sigma > 0) {
    const radius = Math.ceil(3 * sigma);
    const kernel = Array.from({ length: 2 * radius + 1 }, (_, k) =>
      Math.exp(-((k - radius) ** 2) / (2 * sigma * sigma)),
    );
    const total = kernel.reduce((a, b) => a + b, 0);
    const pass = (source: Float64Array, horizontal: boolean) => {
      const out = new Float64Array(source.length);
      for (let y = 0; y < bh; ++y)
        for (let x = 0; x < bw; ++x) {
          let sum = 0;
          for (let k = -radius; k <= radius; ++k) {
            const xx = horizontal ? Math.min(bw - 1, Math.max(0, x + k)) : x;
            const yy = horizontal ? y : Math.min(bh - 1, Math.max(0, y + k));
            sum += kernel[k + radius]! * source[yy * bw + xx]!;
          }
          out[y * bw + x] = sum / total;
        }
      return out;
    };
    field = pass(pass(field, true), false);
  }
  const at = (x: number, y: number) => field[(y - by0) * bw + (x - bx0)]!;
  const sample = (x: number, y: number): number | null => {
    const [x0, y0] = [Math.floor(x), Math.floor(y)];
    if (x0 < 0 || y0 < 0 || x0 + 1 >= image.width || y0 + 1 >= image.height)
      return null;
    const [fx, fy] = [x - x0, y - y0];
    return (
      at(x0, y0) * (1 - fx) * (1 - fy) +
      at(x0 + 1, y0) * fx * (1 - fy) +
      at(x0, y0 + 1) * (1 - fx) * fy +
      at(x0 + 1, y0 + 1) * fx * fy
    );
  };
  const STEPS = 64;
  const WINDOW = 5;
  const side = (
    lines: readonly (readonly [number, number])[],
  ): IFaceLikenessCreaseSide | null => {
    const profile = new Array<number>(STEPS + 1).fill(0);
    for (const [lid, brow] of lines) {
      const [p, q] = [landmarks[lid]!, landmarks[brow]!];
      for (let k = 0; k <= STEPS; ++k) {
        const t = k / STEPS;
        const value = sample(
          p[0] + t * (q[0] - p[0]),
          p[1] + t * (q[1] - p[1]),
        );
        if (value === null) return null;
        profile[k]! += value / lines.length;
      }
    }
    let depth = 0;
    let at: number | null = null;
    for (let i = 6; i < 45; ++i) {
      const before = Math.max(...profile.slice(Math.max(0, i - WINDOW), i));
      const after = Math.max(...profile.slice(i + 1, i + 1 + WINDOW));
      const rim = Math.min(before, after);
      const dip = (rim - profile[i]!) / Math.max(rim, 1e-6);
      if (dip > depth) {
        depth = dip;
        at = i / STEPS;
      }
    }
    const [p, q] = [landmarks[lines[1]![0]]!, landmarks[lines[1]![1]]!];
    return { depth, at, span: Math.hypot(q[0] - p[0], q[1] - p[1]) };
  };
  return {
    right: side(FACE_LIKENESS_CREASE_LINES.right),
    left: side(FACE_LIKENESS_CREASE_LINES.left),
  };
}

/**
 * The crease reading's calibration on the editor's own renders
 * (`calibrate-face-crease.ts`, lid-crease-calibration-receipt.json): the 17
 * published documents of round j18-b under their portrait cameras, each
 * without a crease and with both lids at the layer's depth (the lid fold
 * revision, -0.48), read through `blur` (0.0066 inter-ocular distances: the
 * photographs resolve thin features more softly than the renders, and this
 * is the median over 11 subjects of the blur at which a render's brow band
 * reads its photograph's). The median of every lid's reading is 0.0761
 * without a crease and 0.1314 with it; `threshold` is their midpoint.
 * `span` is the shortest middle line on which a render's crease read at or
 * above it (both lids' mean): 30 px, below which a lid spans too few
 * pixels for the fold's shadow. On those renders the rule reads 12 of the
 * 17 creases and 4 of the 17 lids without one; the photographs' creases
 * read 0.3 to 0.8 at their own resolution, far clearer than the renders'.
 */
export const FACE_LIKENESS_CREASE_CALIBRATION = {
  blur: 0.0066,
  threshold: 0.104,
  span: 30,
} as const;

/** The basis controls each upper lid's crease is carried by. */
export const FACE_LID_CREASE_CHANNELS = [
  "leftEyelidFoldConvexity",
  "rightEyelidFoldConvexity",
] as const;

/**
 * The upper lid's skin with its subcutaneous tissue (0.98 mm) and
 * orbicularis oculi (0.76 mm), the layer a crease folds: high-frequency
 * ultrasound of 48 healthy adults aged 17 to 46 (Rad Proc 2021;26).
 */
export const FACE_LID_CREASE_LAYER = 0.00174;

/**
 * The share of adults with an upper lid crease, by population and sex:
 * European and African samples measured a crease height in every subject
 * (white adults: Price et al., Ophthalmic Plast Reconstr Surg 1994, PubMed
 * 8116752; Nigerian adults, Enugu 2010, PMC5586704); East Asian, the one
 * sample by 3D surface imaging of both sexes, Chinese adults 20 to 39
 * (PMC5665901: men 59.2 percent, women 81.3). Korean samples by
 * photograph read lower (24.1 and 45.5 percent, Song et al. 2007), a
 * distinction the recorded ancestry does not make.
 */
export const FACE_LID_CREASE_PREVALENCE: Record<
  NonNullable<IFacePopulationFacts["ancestry"]>,
  Record<"male" | "female", number>
> = {
  european: { male: 1, female: 1 },
  african: { male: 1, female: 1 },
  asian: { male: 0.592, female: 0.813 },
};

/**
 * Both lids' crease weight on the fold convexity control, or null to keep
 * the document's start.
 *
 * The crease is one fold of the lid's skin and orbicularis (`layer`,
 * metres) pressed in at the levator's insertion, so a lid with a crease
 * carries it at the weight whose depth is that layer (`depth`, the
 * control's depth at -1). Where both lids read on lines of at least the
 * calibration's span, the mean of the two readings decides: at or above
 * the threshold the crease is there, below it not (a crease is bilateral,
 * and one lid's reading alone misses a third of the renders' creases). Where they do
 * not, the photograph cannot show it and the population's more probable
 * state is taken (`FACE_LID_CREASE_PREVALENCE` at one half), or null
 * without a recorded ancestry and sex. Pure.
 */
export function faceLidCreaseWeight(props: {
  reading: {
    right: IFaceLikenessCreaseSide | null;
    left: IFaceLikenessCreaseSide | null;
  } | null;
  facts: Pick<IFacePopulationFacts, "ancestry" | "sex">;
  layer: number;
  depth: number;
}): { weight: number; source: "photographed" | "prior" } | null {
  if (!(props.layer > 0 && props.depth >= props.layer))
    throw new Error("The control reaches the layer's depth.");
  const present = -props.layer / props.depth;
  const { right, left } = props.reading ?? { right: null, left: null };
  if (
    right !== null &&
    left !== null &&
    Math.min(right.span, left.span) >= FACE_LIKENESS_CREASE_CALIBRATION.span
  )
    return {
      weight:
        (right.depth + left.depth) / 2 >=
        FACE_LIKENESS_CREASE_CALIBRATION.threshold
          ? present
          : 0,
      source: "photographed",
    };
  if (props.facts.ancestry === null || props.facts.sex === null) return null;
  return {
    weight:
      FACE_LID_CREASE_PREVALENCE[props.facts.ancestry][props.facts.sex] >= 0.5
        ? present
        : 0,
    source: "prior",
  };
}

/** The basis controls each upper lid's fold height is carried by. */
export const FACE_LID_FOLD_CHANNELS = [
  "leftEyeFoldHeight",
  "rightEyeFoldHeight",
] as const;

/**
 * The crease's place at each fold height on the editor's own renders
 * (lid-crease-calibration-receipt.json, `fold`): the 17 documents of the
 * crease calibration with both lids at -0.48 and the fold height control at
 * -0.60, 0 and +1.00, read at the photographs' resolution; the median of
 * every lid's `at`.
 */
export const FACE_LID_FOLD_CALIBRATION = {
  weights: [-0.6, 0, 1],
  at: [0.21875, 0.3671875, 0.4375],
} as const;

/**
 * The fold's height over the brow's, both above the lid margin over the
 * pupil in open eyes and primary gaze (FPD over EPD), by population and sex:
 * Gao et al., Quant Imaging Med Surg 2025 (3D stereophotogrammetry, 147
 * adults aged 18 to 30): Caucasian men 3.35 over 9.48 mm, women 3.39 over
 * 10.93; Chinese men 1.54 over 10.45, women 2.97 over 10.86. No African
 * sample measured both by one method: null.
 */
export const FACE_LID_FOLD_NORMS: Record<
  NonNullable<IFacePopulationFacts["ancestry"]>,
  Record<"male" | "female", number> | null
> = {
  european: { male: 3.35 / 9.48, female: 3.39 / 10.93 },
  african: null,
  asian: { male: 1.54 / 10.45, female: 2.97 / 10.86 },
};

/**
 * Both lids' fold height, or null to keep the document's start.
 *
 * Where a lid has a crease, its fold's edge sits at the population's height
 * over the brow's (`FACE_LID_FOLD_NORMS`), placed by the fold height control
 * as `calibration` gives (the median place of the crease between margin and
 * brow at each weight on renders, rising), linearly between the calibrated
 * weights and held at their ends. The photograph's own place of the crease
 * is not used: at portrait resolution the upper lashes, 7 to 8 mm long and
 * curled upward, cover the band above the margin the fold lies in, and
 * makeup draws its own lines there (of the 12 photographed creases the
 * valley of Daniel Radcliffe's lids lies on the lash line, at 0.09, and
 * Emma Watson's on her lid shadow's edge, at 0.45). Null for a lid without
 * a crease (no fold to place), for a population without a ratio and without
 * recorded facts. Pure.
 */
export function faceLidFoldHeightWeight(props: {
  crease: { weight: number; source: "photographed" | "prior" } | null;
  facts: Pick<IFacePopulationFacts, "ancestry" | "sex">;
  calibration: { weights: readonly number[]; at: readonly number[] };
}): number | null {
  const { weights, at } = props.calibration;
  if (
    weights.length < 2 ||
    weights.length !== at.length ||
    weights.some((w, k) => k > 0 && !(w > weights[k - 1]!)) ||
    at.some((a, k) => k > 0 && !(a > at[k - 1]!))
  )
    throw new Error("A fold height calibration rises with its weights.");
  if (props.crease === null || props.crease.weight === 0) return null;
  const { ancestry, sex } = props.facts;
  if (ancestry === null || sex === null) return null;
  const norm = FACE_LID_FOLD_NORMS[ancestry]?.[sex];
  if (norm === undefined) return null;
  if (norm <= at[0]!) return weights[0]!;
  if (norm >= at[at.length - 1]!) return weights[weights.length - 1]!;
  const k = at.findIndex((a) => a >= norm);
  const t = (norm - at[k - 1]!) / (at[k]! - at[k - 1]!);
  return weights[k - 1]! + t * (weights[k]! - weights[k - 1]!);
}
