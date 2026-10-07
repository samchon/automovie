import {
  FaceAnthropometryPoint,
  IFaceAnthropometryIndex,
} from "./IFaceAnthropometryIndex";

/**
 * Frontal facial anthropometry read through the face landmark detector, and
 * the shared shape control each index is paired with.
 *
 * The removed `derive-face-documents.ts` measures the same indices on a photograph and
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
 * Seventeen more indices carry the fine controls a frontal photograph shows
 * beyond those: the eyes' height above subnasale (`eyeLevel`), the lid
 * aperture at the fissure's medial and lateral thirds, the brow's slope
 * from head to tail, the Cupid's bow's width and depth, the vermilion's
 * height at its lateral thirds, the cheek contour below the zygoma, the
 * nasal sidewalls at the upper and middle dorsum and the temples' width;
 * the lower lid's slope into the medial canthus, which the epicanthal fold
 * steepens, the upper lid's height to its fold, the lower lid's height to
 * the infraorbital fold, and the nasal tip's and nostrils' heights above
 * subnasale. Each moves its own paired control's index by 8 to 121 percent at full
 * weight on the basis, more than any other of the new controls moves it but
 * one: the upper lip's lateral elevation also raises the bow's peaks, and
 * the nasal base's elevation lifts the tip too, cross effects the square
 * solve carries. Controls a frontal photograph does not move (the nasal
 * tip's width, the chin's triangularity and projection, the jaw's
 * prognathism, the nose's depth and root) and pairs it cannot tell apart
 * (the lower nose and nostril widths, both reading as alar width; the
 * septum and nostril angles, which move the tip and nostrils together)
 * have no index.
 *
 * The pairing is anatomical and was checked on the basis: at full weight
 * every paired control moves its own index by 13 to 45 percent and each other
 * index by a smaller amount (the solve still accounts for those cross
 * effects through the measured Jacobian). `chinBoneWidth` moves no frontal
 * width, and the lower face's contour at the gonial level follows
 * `cheekFullness`, so that is the lower-face width's control. The chin's
 * width at its level is the mandible's outline converging below the
 * mouth's line, `jawTaper`; the source's `chinWidth` shapes the chin's
 * front and moved that outline by under one percent over its envelope.
 *
 * The indices must be independent measurements, or the square solve pairs a
 * control with an index the photograph has already fixed through the
 * others and leaves that control to drift. The face's height is three
 * segments, each its own structure with its own control: the nose, n-sn
 * (`noseHeight`); the upper lip, sn-stoms (the mouth's elevation); the
 * lower lip and chin, stomi-me' (the chin's height below the labiomental
 * fold); the lips' gap lies between them (`lipParting`). Each is read over
 * the face's width, like every width here, and the face's height, their
 * sum, is not an index. Read as n-me' over the face's width and paired with
 * the head's vertical scale, with the nose over n-me', the upper lip over
 * sn-me' and the chin over n-me' besides, the vertical indices were one too
 * many (the chin's equalled (1 - noseHeight) (1 - upperLip) - lipParting
 * mouthWidth / (2 faceHeight) on every reading of round j13): the chin's
 * height control sat at -1.5 to -2 where every index fit and shortened the
 * chin to make up lips that could not part as far as the photograph's; with
 * the chin dropped instead (round j14), the head's scale took up the face's
 * height (-0.5 to -0.8 on 13 of 16 documents), shrinking the forehead no
 * index reads, and the nose's length sat at its end on 9.
 *
 * Pure: reads caller-owned points and returns new values.
 */

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
  // Soft-tissue menton is the jaw outline's (`faceLikenessJawOutline`): the
  // detector's own menton (152) holds its place as the chin lengthens.
  const fl = mean(D(33, 133), D(263, 362));
  const mw = W(61, 291);
  return {
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
    noseHeight: ratio(H(168, 2), fw),
    mouthWidth: ratio(mw, fw),
    // The vermilion's borders are read from the midline's colour
    // (`faceLikenessVermilion`): the detector's own 0 and 17 are placed
    // from the rest of the face.
    upperVermilion: ratio(H(475, 13), mw),
    lowerVermilion: ratio(H(14, 476), mw),
    upperLip: ratio(H(2, 13), fw),
    chinHeight: ratio(H(14, 470), fw),
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
    lowerFaceWidth: ratio(W(471, 472), fw),
    chinWidth: ratio(W(473, 474), fw),
    browHeight: ratio(mean(H(105, 159), H(334, 386)), fl),
    eyeLevel: ((): number | null => {
      const eye = [33, 133, 263, 362].map(at);
      const [sn] = [2].map(at);
      return eye.every((p) => p !== undefined) && sn && fw !== null && fw > 0
        ? (sn[1] - eye.reduce((sum, p) => sum + p![1], 0) / 4) / fw
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
    medialLowerLidSlope: ((): number | null => {
      const slope = (a: number, b: number): number | null => {
        const [p, q] = [at(a), at(b)];
        return p && q && p[0] !== q[0]
          ? Math.abs(p[1] - q[1]) / Math.abs(p[0] - q[0])
          : null;
      };
      return mean(slope(133, 155), slope(362, 382));
    })(),
    upperLidHeight: ratio(mean(H(159, 27), H(386, 257)), fl),
    infraorbitalHeight: ratio(mean(H(145, 230), H(374, 450)), fl),
    noseTipHeight: ratio(H(1, 2), H(168, 2)),
    nostrilHeight: ratio(mean(H(49, 2), H(279, 2)), H(168, 2)),
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
