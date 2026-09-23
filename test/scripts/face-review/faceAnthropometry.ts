/**
 * Frontal facial anthropometry read through the face landmark detector, and
 * the shared shape control each index is paired with.
 *
 * `derive-face-documents.ts` measures the same indices on a photograph and
 * on a basis model under that photograph's camera, and sets each paired
 * control until the model's index equals the photograph's. An index is a
 * classical anthropometric proportion (Farkas, Anthropometry of the Head and
 * Face, 1994; Farkas et al., J Craniofac Surg 2005;16:615-646): a width or
 * height between named soft-tissue landmarks divided by another, so the
 * camera's distance and the image's scale cancel. Every landmark is a fixed
 * index of the detector's 468-point canonical mesh, the same instrument on
 * both sides, so the detector's own offset from a palpated landmark (its
 * lateral canthus sits medial to exocanthion, its alar points lateral to
 * alare) is common to photograph and model and cancels in the comparison.
 * The numbers are therefore detector proportions to compare, not caliper
 * millimetres to judge against a published norm.
 *
 * Widths are horizontal and heights vertical in the face's own frame: the
 * points are turned so the principal axis of the midline landmarks is
 * vertical, which removes the head's roll. Left and right measurements are
 * averaged and each bilateral control is one tied pair, so the identity is
 * symmetric by construction.
 *
 * The pairing is anatomical and was checked on the basis: at full weight
 * every paired control moves its own index by 13 to 45 percent and each other
 * index by a smaller amount (the solve still accounts for those cross
 * effects through the measured Jacobian). `chinBoneWidth` moves no frontal
 * width, and the lower face's contour at the gonial level follows
 * `cheekFullness`, so that is the lower-face width's control.
 *
 * Pure: reads caller-owned points and returns new values.
 */

/** Detector landmark, image pixels (+x right, +y down); undefined when absent. */
export type FaceAnthropometryPoint = readonly [number, number] | undefined;

/** One anthropometric index and the shared control that answers for it. */
export interface IFaceAnthropometryIndex {
  id: string;
  /** Anatomical definition in landmark terms. */
  definition: string;
  /** Shape channels set together as one control. */
  channels: readonly string[];
}

/** Midline landmarks whose principal axis defines the face's vertical. */
export const FACE_ANTHROPOMETRY_MIDLINE = [
  9, 168, 6, 2, 0, 13, 14, 17, 152, 199,
] as const;

/** The indices, in solve order, with their paired controls. */
export const FACE_ANTHROPOMETRY_INDICES: readonly IFaceAnthropometryIndex[] = [
  {
    id: "faceHeight",
    definition: "n-me height (168, 152) over face width at zygion (234, 454)",
    channels: ["headHeight"],
  },
  {
    id: "intercanthal",
    definition: "en-en width (133, 362) over face width",
    channels: ["leftEyeLateralPosition", "rightEyeLateralPosition"],
  },
  {
    id: "fissureLength",
    definition: "mean en-ex length (133-33, 362-263) over face width",
    channels: ["leftEyeScale", "rightEyeScale"],
  },
  {
    id: "fissureHeight",
    definition: "mean ps-pi height (159-145, 386-374) over fissure length",
    channels: ["leftEyeHeight", "rightEyeHeight"],
  },
  {
    id: "noseWidth",
    definition: "al-al width (129, 358) over face width",
    channels: ["noseWidth"],
  },
  {
    id: "noseHeight",
    definition: "n-sn height (168, 2) over n-me height",
    channels: ["noseHeight"],
  },
  {
    id: "mouthWidth",
    definition: "ch-ch width (61, 291) over face width",
    channels: ["mouthWidth"],
  },
  {
    id: "upperVermilion",
    definition: "ls-sto height (0, midpoint of 13 and 14) over mouth width",
    channels: ["upperLipHeight"],
  },
  {
    id: "lowerVermilion",
    definition: "sto-li height (midpoint of 13 and 14, 17) over mouth width",
    channels: ["lowerLipHeight"],
  },
  {
    id: "upperLip",
    definition: "sn-sto height over sn-me height (2, 152)",
    channels: ["mouthElevation"],
  },
  {
    id: "lowerFaceWidth",
    definition:
      "face contour width at the gonial level (136, 365) over face width",
    channels: ["cheekFullness"],
  },
  {
    id: "chinWidth",
    definition: "chin contour width (176, 400) over face width",
    channels: ["chinWidth"],
  },
  {
    id: "chinHeight",
    definition: "li-me height (17, 152) over n-me height",
    channels: ["chinHeight"],
  },
  {
    id: "browHeight",
    definition:
      "mean brow apex to upper lid height (105-159, 334-386) over fissure length",
    channels: ["browElevation"],
  },
];

/** Every index of one set of landmarks; null where a landmark is absent. */
export function measureFaceAnthropometry(
  points: readonly FaceAnthropometryPoint[],
): Record<string, number | null> {
  const P = faceAnthropometryFrame(points);
  const at = (k: number): readonly [number, number] | undefined => P[k];
  const sto = ((): [number, number] | undefined => {
    const a = at(13);
    const b = at(14);
    return a && b ? [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2] : undefined;
  })();
  const pick = (k: number | "sto") => (k === "sto" ? sto : at(k));
  const W = (a: number | "sto", b: number | "sto"): number | null => {
    const p = pick(a);
    const q = pick(b);
    return p && q ? Math.abs(p[0] - q[0]) : null;
  };
  const H = (a: number | "sto", b: number | "sto"): number | null => {
    const p = pick(a);
    const q = pick(b);
    return p && q ? Math.abs(p[1] - q[1]) : null;
  };
  const D = (a: number, b: number): number | null => {
    const p = at(a);
    const q = at(b);
    return p && q ? Math.hypot(p[0] - q[0], p[1] - q[1]) : null;
  };
  const mean = (a: number | null, b: number | null) =>
    a === null || b === null ? null : (a + b) / 2;
  const ratio = (a: number | null, b: number | null) =>
    a === null || b === null || !(b > 0) ? null : a / b;
  const fw = W(234, 454);
  const fh = H(168, 152);
  const fl = mean(D(33, 133), D(263, 362));
  const mw = W(61, 291);
  return {
    faceHeight: ratio(fh, fw),
    intercanthal: ratio(W(133, 362), fw),
    fissureLength: ratio(fl, fw),
    fissureHeight: ratio(mean(H(159, 145), H(386, 374)), fl),
    noseWidth: ratio(W(129, 358), fw),
    noseHeight: ratio(H(168, 2), fh),
    mouthWidth: ratio(mw, fw),
    upperVermilion: ratio(H(0, "sto"), mw),
    lowerVermilion: ratio(H("sto", 17), mw),
    upperLip: ratio(H(2, "sto"), H(2, 152)),
    lowerFaceWidth: ratio(W(136, 365), fw),
    chinWidth: ratio(W(176, 400), fw),
    chinHeight: ratio(H(17, 152), fh),
    browHeight: ratio(mean(H(105, 159), H(334, 386)), fl),
  };
}

/**
 * The points turned about the midline centroid so the principal axis of the
 * midline landmarks is vertical; refuses when fewer than two are present.
 */
export function faceAnthropometryFrame(
  points: readonly FaceAnthropometryPoint[],
): FaceAnthropometryPoint[] {
  const midline = FACE_ANTHROPOMETRY_MIDLINE.map((k) => points[k]).filter(
    (p): p is readonly [number, number] => p !== undefined,
  );
  if (midline.length < 2)
    throw new Error("The face frame needs at least two midline landmarks.");
  const mx = midline.reduce((s, p) => s + p[0], 0) / midline.length;
  const my = midline.reduce((s, p) => s + p[1], 0) / midline.length;
  let sxx = 0;
  let sxy = 0;
  let syy = 0;
  for (const [x, y] of midline) {
    sxx += (x - mx) ** 2;
    sxy += (x - mx) * (y - my);
    syy += (y - my) ** 2;
  }
  // Principal axis angle from +x; turn it onto +y.
  const turn = Math.PI / 2 - 0.5 * Math.atan2(2 * sxy, sxx - syy);
  const c = Math.cos(turn);
  const s = Math.sin(turn);
  return points.map((p) =>
    p === undefined
      ? undefined
      : ([
          c * (p[0] - mx) - s * (p[1] - my),
          s * (p[0] - mx) + c * (p[1] - my),
        ] as const),
  );
}
