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
 * Two muscles part the lips over the teeth, the upper lip raiser (levator
 * labii superioris, `mouthUpperUp`) and the lower lip depressor (depressor
 * labii inferioris, `mouthLowerDown`), and a posed smile moves both: the
 * upper lip's lower edge rises 4.76 mm and the lower lip's upper edge falls
 * 3.28 mm, from a 1.8 mm to a 10.5 mm gap (Banditsaowapak and Cheng, J Dent
 * Sci 2025;20:2219-2230). The gap alone cannot tell the two apart; the teeth
 * can, since the upper incisors ride the skull. So `upperDisplay`, the upper
 * incisal edge below stomion superius over mouth width, pairs with the
 * raiser, and the gap with the depressor. The edge is a photograph's
 * upper incisors read on the mouth's midline profile
 * (`measureFaceLikenessTeeth`, where it reads the edge itself rather than a
 * bound), passed as the landmark `FACE_ANTHROPOMETRY_UPPER_EDGE`, and on the
 * model the crowns' own edge (`faceIncisalEdges`). The lower incisors ride
 * the mandible, so the gap between the two edges, `incisalGap`, is the
 * jaw's opening and pairs with `jawOpen`; the lip gap then pairs with the
 * depressor alone, which a laugh's open jaw exceeds (one photograph's gap
 * held the depressor at its bound). A photograph that shows no upper edge
 * leaves the raiser where the expression transfer put it, and one without a
 * lower edge the jaw: the
 * source's smile already lifts the upper lip 3.2 mm with its seam, and a
 * gap coupled to it in the posed ratio had lifted the lip about 8 mm, above
 * the crowns, where photographs show teeth. The detector's own scores for these units
 * span less on the basis than the photographs spread
 * (`faceExpressionObservable`), so the lips' landmarks carry them instead.
 * The smile is read the same way, `cornerLift`, the mouth corners' rise
 * above the lip centre over mouth width (signed, which is why the frame's
 * +y is fixed to run down the face), paired with the smile pair: the
 * zygomaticus major's action is the corner's rise (6.2 mm in a posed smile,
 * Banditsaowapak and Cheng 2025). The detector's smile unit also reads the
 * eye squint of a genuine smile, and a pair calibrated alone under-read the
 * photographs' smiles; the corners' own landmarks read only the corners. It
 * supersedes the detector's smile transfer, and the measurement's corner
 * lift is then a derivation input rather than an independent check.
 * The mouth's sideways shift is read the same way, `mouthShift`: the lip
 * centre (the stomion pair) across from subnasale, which the mouth does not
 * move and which lies at nearly the lips' depth, over mouth width, signed
 * and paired with `mouthLeft` for one sign and `mouthRight` for the other
 * (`negative`). A reference deeper in the face (nasion) or a mouth centre
 * taken at the corners, which sit about a centimetre behind the lips, turns
 * any error in the camera's yaw into a sideways shift: at the n-sn line
 * three turned heads (25 to 30 degrees) asked for the whole of the unit. The detector's scores for
 * those units sit near its noise on every photograph (0.001 to 0.014) where
 * their calibration is flattest, and their transfer made a skewed mouth of
 * a symmetric smile.
 *
 * The eye's slant, `canthalTilt`, is the inclination of the palpebral
 * fissure (Farkas 1994: the en-ex line against the horizontal), read as the
 * exocanthion's rise above endocanthion over the fissure's length, the sine
 * of the angle, signed and positive when the outer corner is higher. The
 * lateral canthal tendon sets that corner, so the index pairs with the
 * lateral canthus elevation pair; the medial corner is held by the medial
 * tendon to the lacrimal crest and is the reference. On the basis a full
 * unit of the pair turns the fissure about 0.065 (3.7 degrees) and moves no
 * other index by more than 2.4 percent.
 *
 * Twelve more indices carry the fine controls a frontal photograph shows
 * beyond those: the eyes' height above subnasale (`eyeLevel`), the lid
 * aperture at the fissure's medial and lateral thirds, the brow's slope
 * from head to tail, the Cupid's bow's width and depth, the vermilion's
 * height at its lateral thirds, the cheek contour below the zygoma, the
 * nasal sidewalls at the upper and middle dorsum and the temples' width.
 * Each moves its own paired control's index by 8 to 121 percent at full
 * weight on the basis, more than any other of the new controls moves it but
 * one: the upper lip's lateral elevation also raises the bow's peaks, a
 * cross effect the square solve carries. Controls a frontal photograph does
 * not move (the nasal tip's width, the chin's triangularity) and pairs it
 * cannot tell apart (the lower nose and nostril widths, both reading as
 * alar width) have no index.
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
   * Each channel's share of the control, aligned with `channels`; absent,
   * every channel takes the control's value.
   */
  gains?: readonly number[];
  /**
   * The channels are expression channels: the index reads a state of the
   * face, not its form, so the control is written as expression.
   */
  expression?: true;
  /**
   * Channels a negative control writes, at its magnitude: a signed index
   * whose two directions are two units (the mouth moved to either side).
   * `channels` then take the positive values only.
   */
  negative?: readonly string[];
}

/**
 * Each channel's weight under one index's control value: `channels` scaled
 * by their gains for a positive value, `negative` at its magnitude for a
 * negative one, every other channel of the index at zero.
 */
export function faceAnthropometryWeights(
  index: IFaceAnthropometryIndex,
  value: number,
): [string, number][] {
  const positive = index.channels.map((channel, c): [string, number] => [
    channel,
    index.negative !== undefined && value < 0
      ? 0
      : value * (index.gains?.[c] ?? 1),
  ]);
  const negative = (index.negative ?? []).map((channel): [string, number] => [
    channel,
    value < 0 ? -value : 0,
  ]);
  return [...positive, ...negative];
}

/** Midline landmarks whose principal axis defines the face's vertical. */
export const FACE_ANTHROPOMETRY_MIDLINE = [
  9, 168, 6, 2, 0, 13, 14, 17, 152, 199,
] as const;

/**
 * The landmark index a caller gives the upper incisal edge, past the
 * detector's 468 mesh landmarks: on a photograph the edge its mouth profile
 * reads, on the model the crowns' own edge.
 */
export const FACE_ANTHROPOMETRY_UPPER_EDGE = 468;

/** The landmark index a caller gives the lower incisal edge, as the upper. */
export const FACE_ANTHROPOMETRY_LOWER_EDGE = 469;

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
    id: "canthalTilt",
    definition:
      "mean exocanthion rise above endocanthion (33 over 133, 263 over 362) over each fissure's length, signed, positive when the outer corner is higher",
    channels: ["leftLateralCanthusElevation", "rightLateralCanthusElevation"],
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
    channels: ["mouthLowerDownLeft", "mouthLowerDownRight"],
    expression: true,
  },
  {
    id: "upperDisplay",
    definition:
      "upper incisal edge (FACE_ANTHROPOMETRY_UPPER_EDGE) below stomion superius (13) over mouth width, signed",
    channels: ["mouthUpperUpLeft", "mouthUpperUpRight"],
    expression: true,
  },
  {
    id: "incisalGap",
    definition:
      "lower incisal edge (FACE_ANTHROPOMETRY_LOWER_EDGE) below the upper (FACE_ANTHROPOMETRY_UPPER_EDGE) over mouth width, signed",
    channels: ["jawOpen"],
    expression: true,
  },
  {
    id: "mouthShift",
    definition:
      "lip centre (midpoint of 13 and 14) across from subnasale (2) over mouth width, signed",
    channels: ["mouthLeft"],
    negative: ["mouthRight"],
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
  {
    id: "eyeLevel",
    definition:
      "the canthi's mean height (33, 133, 263, 362) above subnasale (2) over n-me height",
    channels: ["leftEyeElevation", "rightEyeElevation"],
  },
  {
    id: "medialAperture",
    definition:
      "mean lid-to-lid height at the fissure's medial third (157-154, 384-381) over fissure length",
    channels: ["leftMedialEyeApertureHeight", "rightMedialEyeApertureHeight"],
  },
  {
    id: "lateralAperture",
    definition:
      "mean lid-to-lid height at the fissure's lateral third (161-163, 388-390) over fissure length",
    channels: ["leftLateralEyeApertureHeight", "rightLateralEyeApertureHeight"],
  },
  {
    id: "browSlope",
    definition:
      "mean brow head above brow tail (107 over 70, 336 over 300) over fissure length, signed",
    channels: ["browAngle"],
  },
  {
    id: "cupidsBowWidth",
    definition: "Cupid's bow peaks' width (37, 267) over mouth width",
    channels: ["cupidsBowWidth"],
  },
  {
    id: "cupidsBowDepth",
    definition:
      "Cupid's bow peaks (37, 267) above labrale superius (0) over mouth width, signed",
    channels: ["cupidsBowDefinition"],
  },
  {
    id: "upperLateralVermilion",
    definition:
      "mean upper vermilion height at its lateral third (39-81, 269-311) over mouth width",
    channels: ["upperLipLateralElevation"],
  },
  {
    id: "lowerLateralVermilion",
    definition:
      "mean lower vermilion height at its lateral third (178-181, 402-405) over mouth width",
    channels: ["lowerLipLateralElevation"],
  },
  {
    id: "cheekProminence",
    definition:
      "cheek contour width below the zygoma (123, 352) over face width",
    channels: ["leftCheekBone", "rightCheekBone"],
  },
  {
    id: "noseUpperWidth",
    definition:
      "nasal sidewall width at the upper dorsum (193, 417) over face width",
    channels: ["noseUpperWidth"],
  },
  {
    id: "noseMiddleWidth",
    definition:
      "nasal sidewall width at the middle dorsum (196, 419) over face width",
    channels: ["noseMiddleWidth"],
  },
  {
    id: "templeWidth",
    definition: "temple contour width (21, 251) over face width",
    channels: ["templeWidth"],
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
    canthalTilt: ((): number | null => {
      const rise = (en: number, ex: number): number | null => {
        const [p, q] = [at(en), at(ex)];
        const length = D(en, ex);
        return p && q && length !== null && length > 0
          ? (p[1] - q[1]) / length
          : null;
      };
      return mean(rise(133, 33), rise(362, 263));
    })(),
    noseWidth: ratio(W(129, 358), fw),
    noseHeight: ratio(H(168, 2), fh),
    mouthWidth: ratio(mw, fw),
    upperVermilion: ratio(H(0, 13), mw),
    lowerVermilion: ratio(H(14, 17), mw),
    upperLip: ratio(H(2, 13), H(2, 152)),
    lipParting: ratio(H(13, 14), mw),
    incisalGap: ((): number | null => {
      const [upper, lower] = [
        FACE_ANTHROPOMETRY_UPPER_EDGE,
        FACE_ANTHROPOMETRY_LOWER_EDGE,
      ].map(at);
      return upper && lower && mw !== null && mw > 0
        ? (lower[1] - upper[1]) / mw
        : null;
    })(),
    upperDisplay: ((): number | null => {
      const [lip, edge] = [13, FACE_ANTHROPOMETRY_UPPER_EDGE].map(at);
      return lip && edge && mw !== null && mw > 0
        ? (edge[1] - lip[1]) / mw
        : null;
    })(),
    cornerLift: ((): number | null => {
      const [u, l, r, q] = [13, 14, 61, 291].map(at);
      return u && l && r && q && mw !== null && mw > 0
        ? ((u[1] + l[1]) / 2 - (r[1] + q[1]) / 2) / mw
        : null;
    })(),
    mouthShift: ((): number | null => {
      const [u, l, sn] = [13, 14, 2].map(at);
      return u && l && sn && mw !== null && mw > 0
        ? ((u[0] + l[0]) / 2 - sn[0]) / mw
        : null;
    })(),
    lowerFaceWidth: ratio(W(136, 365), fw),
    chinWidth: ratio(W(176, 400), fw),
    chinHeight: ratio(H(17, 152), fh),
    browHeight: ratio(mean(H(105, 159), H(334, 386)), fl),
    eyeLevel: ((): number | null => {
      const eye = [33, 133, 263, 362].map(at);
      const [sn] = [2].map(at);
      return eye.every((p) => p !== undefined) && sn && fh !== null && fh > 0
        ? (sn[1] - eye.reduce((sum, p) => sum + p![1], 0) / 4) / fh
        : null;
    })(),
    medialAperture: ratio(mean(H(157, 154), H(384, 381)), fl),
    lateralAperture: ratio(mean(H(161, 163), H(388, 390)), fl),
    browSlope: ((): number | null => {
      const rise = (head: number, tail: number): number | null => {
        const [p, q] = [at(head), at(tail)];
        return p && q ? q[1] - p[1] : null;
      };
      return ratio(mean(rise(107, 70), rise(336, 300)), fl);
    })(),
    cupidsBowWidth: ratio(W(37, 267), mw),
    cupidsBowDepth: ((): number | null => {
      const [ls, r, l] = [0, 37, 267].map(at);
      return ls && r && l && mw !== null && mw > 0
        ? (ls[1] - (r[1] + l[1]) / 2) / mw
        : null;
    })(),
    upperLateralVermilion: ratio(mean(H(39, 81), H(269, 311)), mw),
    lowerLateralVermilion: ratio(mean(H(178, 181), H(402, 405)), mw),
    cheekProminence: ratio(W(123, 352), fw),
    noseUpperWidth: ratio(W(193, 417), fw),
    noseMiddleWidth: ratio(W(196, 419), fw),
    templeWidth: ratio(W(21, 251), fw),
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
  // Principal axis angle from +x; turn it onto +y. An axis has no sign, so
  // the turn is taken the way that puts the midline's first landmark (the
  // brow's) above its last (the chin's), +y running down the face as in the
  // image; a height is unsigned, a lift is not.
  let turn = Math.PI / 2 - 0.5 * Math.atan2(2 * sxy, sxx - syy);
  const ends = FACE_ANTHROPOMETRY_MIDLINE.map((k) => points[k]).filter(
    (p): p is readonly [number, number] => p !== undefined,
  );
  const [first, last] = [ends[0]!, ends[ends.length - 1]!];
  const along = (t: number) =>
    Math.sin(t) * (last[0] - first[0]) + Math.cos(t) * (last[1] - first[1]);
  if (along(turn) < 0) turn += Math.PI;
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
