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
 * The lip heights run to the lip's own inner edge, stomion superius (13)
 * and inferius (14), as posed-smile studies measure them (Ren et al., Korean
 * J Orthod 2026;56:34-44: subnasale to stomion superius), so parted lips do
 * not lend half their gap to either vermilion. The gap itself, `lipParting`,
 * is a state of the face rather than its form and is written as expression.
 * Over closed teeth two muscles part the lips, the upper lip raiser (levator
 * labii superioris, `mouthUpperUp`) and the lower lip depressor (depressor
 * labii inferioris, `mouthLowerDown`), and a posed smile moves both: the
 * upper lip's lower edge rises 4.76 mm and the lower lip's upper edge falls
 * 3.28 mm, from a 1.8 mm to a 10.5 mm gap (Banditsaowapak and Cheng, J Dent
 * Sci 2025;20:2219-2230). So the gap's control sets both pairs together;
 * at full weight the source's pairs part the basis's seam from 0.9 to about
 * 9.8 mm, the posed-smile gap. The detector's own scores for these units
 * span less on the basis than the photographs spread
 * (`faceExpressionObservable`), so the lips' landmarks carry them instead.
 * The smile is read the same way, `cornerLift`, the mouth corners' rise
 * above the lip centre over mouth width, paired with the smile pair (the
 * zygomaticus major, whose action is the corner's rise: 6.2 mm in a posed
 * smile, Banditsaowapak and Cheng 2025). The detector's smile unit also
 * reads the eye squint that accompanies a genuine smile, and a pair
 * calibrated alone under-read the photographs' smiles; the corners' own
 * landmarks read only the corners. It supersedes the detector's smile
 * transfer, and the measurement's corner lift is then a derivation input
 * rather than an independent check.
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
  /** Channels set together as one control. */
  channels: readonly string[];
  /**
   * The channels are expression channels: the index reads a state of the
   * face, not its form, so the control is written as expression.
   */
  expression?: true;
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
    definition: "ls-stoms height (0, 13) over mouth width",
    channels: ["upperLipHeight"],
  },
  {
    id: "lowerVermilion",
    definition: "stomi-li height (14, 17) over mouth width",
    channels: ["lowerLipHeight"],
  },
  {
    id: "upperLip",
    definition: "sn-stoms height (2, 13) over sn-me height (2, 152)",
    channels: ["mouthElevation"],
  },
  {
    id: "cornerLift",
    definition:
      "lip centre (midpoint of 13 and 14) minus mouth corners (61, 291) height over mouth width, positive when the corners rise",
    channels: ["mouthSmileLeft", "mouthSmileRight"],
    expression: true,
  },
  {
    id: "lipParting",
    definition: "stoms-stomi height (13, 14) over mouth width",
    channels: [
      "mouthUpperUpLeft",
      "mouthUpperUpRight",
      "mouthLowerDownLeft",
      "mouthLowerDownRight",
    ],
    expression: true,
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
  const W = (a: number, b: number): number | null => {
    const p = at(a);
    const q = at(b);
    return p && q ? Math.abs(p[0] - q[0]) : null;
  };
  const H = (a: number, b: number): number | null => {
    const p = at(a);
    const q = at(b);
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
    upperVermilion: ratio(H(0, 13), mw),
    lowerVermilion: ratio(H(14, 17), mw),
    upperLip: ratio(H(2, 13), H(2, 152)),
    lipParting: ratio(H(13, 14), mw),
    cornerLift: ((): number | null => {
      const [u, l, r, q] = [13, 14, 61, 291].map(at);
      return u && l && r && q && mw !== null && mw > 0
        ? ((u[1] + l[1]) / 2 - (r[1] + q[1]) / 2) / mw
        : null;
    })(),
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
