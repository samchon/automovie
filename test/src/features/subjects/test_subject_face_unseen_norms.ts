import { TestValidator } from "@nestia/e2e";

import {
  FACE_UNSEEN_NORMS,
  faceUnseenNorm,
  measureFaceUnseen,
} from "../../../scripts/face-review/faceUnseenNorms";
import { nclose } from "../internal/predicates";

/**
 * A designed profile (y down the face, z forward, millimetres) swept into a
 * strip across x = -1..1 mm: glabella (60, 160) over a brow whose tangent
 * from nasion (35, 150) touches it at (45, 158), the nasal tip at (0, 175), a columella
 * whose lowest tangent from subnasale (-10, 152) touches (-2, 172), the
 * upper lip swelling to (-20, 156.5), the seam at -30, labrale inferius
 * (-36, 154), the fold at (-43, 146), the chin's front at (-55, 151), its
 * turn under to (-63, 142), a level run under the chin at -65, and the
 * neck.
 */
const PROFILE: [number, number][] = [
  [75, 150],
  [60, 160],
  [45, 158],
  [40, 153],
  [35, 150],
  [0, 175],
  [-2, 172],
  [-6, 161],
  [-10, 152],
  [-14, 153],
  [-20, 156.5],
  [-30, 150],
  [-36, 154],
  [-43, 146],
  [-55, 151],
  [-60, 148.5],
  [-63, 142],
  [-65, 120],
  [-65, 110],
  [-80, 90],
];

/** The angle at `o` between `a` and `b`, degrees. */
const degrees = (
  a: readonly [number, number],
  o: readonly [number, number],
  b: readonly [number, number],
): number =>
  (Math.acos(
    ((a[0] - o[0]) * (b[0] - o[0]) + (a[1] - o[1]) * (b[1] - o[1])) /
      Math.hypot(a[0] - o[0], a[1] - o[1]) /
      Math.hypot(b[0] - o[0], b[1] - o[1]),
  ) *
    180) /
  Math.PI;

const strip = (
  profile: readonly [number, number][] = PROFILE,
): { positions: number[]; indices: number[] } => {
  const positions: number[] = [];
  for (const [y, z] of profile)
    positions.push(-0.001, y / 1000, z / 1000, 0.001, y / 1000, z / 1000);
  const indices: number[] = [];
  for (let k = 0; k + 1 < profile.length; ++k) {
    const a = 2 * k;
    indices.push(a, a + 1, a + 3, a, a + 3, a + 2);
  }
  return { positions, indices };
};

/**
 * The population's unseen form, and the same readings on a built skin.
 * Scenarios:
 * 1. Without a recorded sex or ancestry there is no norm; at 17 years, or
 *    no recorded age, the norm is the population's young-adult mean.
 * 2. Age moves the norm by the longitudinal change: halfway from 17 to 46 a
 *    man's lips have half the change, a 47.5-year-old woman's all of it,
 *    and beyond the sample's ages the change is held.
 * 3. On the strip the E-line runs from the tip (0, 175) to the chin's front
 *    (-55, 151), so the upper lip stands 537.5 / hypot(55, 24) = 8.96 mm
 *    and the lower 291 / hypot(55, 24) = 4.85 mm behind it; the convexity
 *    is g-sn-pog' with g the brow's front (60, 160), the nasofrontal angle
 *    the tangent's point (45, 158) seen from n against prn, and the
 *    nasolabial angle between (-2, 172) and labrale superius (-20, 156.5)
 *    seen from subnasale, and the nasal tip protrusion sn-prn over n-sn; the scalp's two vertices at x = -1 and 1 mm make
 *    the head 2 mm broad, and its length runs from glabella to the neck's
 *    back at (-80, 90); an "ear" of the strip's first two left vertices,
 *    (75, 150) and (60, 160), is hypot(15, 10) mm long over a face from
 *    nasion to menton (-63, 142), and an ear without vertices has no
 *    length; no ear has a protrusion without the head's skin behind it or
 *    without a length. A small ear set off the strip, its lateral point 10
 *    mm out from the head behind it (another head point lies too high to
 *    count), protrudes 10 mm over its length.
 * 4. A surface that does not reach the midsagittal plane has no reading;
 *    a profile with no chin below the lower lip has no E-line or convexity
 *    and keeps its nasal angles, cephalic index and ear length; with no
 *    scalp there is no cephalic index; a profile cut at the nasal tip has
 *    no nasion, so no nasofrontal angle, convexity, nasal tip protrusion,
 *    cephalic index or ear length over the face's height, and keeps its lips and nasolabial
 *    angle.
 */
export const test_subject_face_unseen_norms = (): void => {
  TestValidator.equals(
    "unrecorded",
    [
      faceUnseenNorm({ sex: null, ancestry: "asian", ageYears: 30 }),
      faceUnseenNorm({ sex: "male", ancestry: null, ageYears: 30 }),
    ],
    [null, null],
  );
  TestValidator.equals(
    "young adult",
    [
      faceUnseenNorm({ sex: "male", ancestry: "asian", ageYears: 17 }),
      faceUnseenNorm({ sex: "female", ancestry: "african", ageYears: null }),
      faceUnseenNorm({ sex: "female", ancestry: "african", ageYears: 12 }),
    ],
    [
      FACE_UNSEEN_NORMS.asian.male,
      FACE_UNSEEN_NORMS.african.female,
      FACE_UNSEEN_NORMS.african.female,
    ],
  );
  const close = (
    norm: ReturnType<typeof faceUnseenNorm>,
    upper: number,
    lower: number,
  ) =>
    norm !== null &&
    nclose(norm.eLineUpper, upper, 1e-12) &&
    nclose(norm.eLineLower, lower, 1e-12);
  const { european } = FACE_UNSEEN_NORMS;
  TestValidator.predicate(
    "ageing",
    close(
      faceUnseenNorm({ sex: "male", ancestry: "european", ageYears: 31.5 }),
      european.male.eLineUpper - 0.00165,
      european.male.eLineLower - 0.00175,
    ) &&
      close(
        faceUnseenNorm({
          sex: "female",
          ancestry: "european",
          ageYears: 47.5,
        }),
        european.female.eLineUpper - 0.0013,
        european.female.eLineLower - 0.0011,
      ) &&
      close(
        faceUnseenNorm({ sex: "male", ancestry: "european", ageYears: 80 }),
        european.male.eLineUpper - 0.0034,
        european.male.eLineLower - 0.0043,
      ),
  );
  const { positions, indices } = strip();
  const options = {
    stomion: -0.03,
    inferius: -0.031,
    scalp: [0, 1],
    auricles: { left: [0, 2], right: [] },
    mastoids: { left: [], right: [] },
    step: 0.00025,
  };
  const measured = measureFaceUnseen({ positions, indices, ...options });
  const [g, forehead, n, prn, sn, pog] = [
    [60, 160],
    [45, 158],
    [35, 150],
    [0, 175],
    [-10, 152],
    [-55, 151],
  ] as const;
  TestValidator.predicate(
    "measured",
    nclose(measured.eLineUpper!, -0.5375 / Math.hypot(55, 24), 1e-5) &&
      nclose(measured.eLineLower!, -0.291 / Math.hypot(55, 24), 1e-5) &&
      nclose(measured.facialConvexity!, degrees(g, sn, pog), 1e-6) &&
      nclose(measured.nasofrontal!, degrees(forehead, n, prn), 1e-6) &&
      nclose(
        measured.nasolabial!,
        degrees([-2, 172], sn, [-20, 156.5]),
        1e-6,
      ) &&
      nclose(
        measured.nasalProtrusion!,
        Math.hypot(10, 23) / Math.hypot(45, 2),
        1e-9,
      ) &&
      nclose(measured.cephalicIndex!, 2 / Math.hypot(140, 70), 1e-9) &&
      nclose(
        measured.earLengthLeft!,
        Math.hypot(15, 10) / Math.hypot(98, 8),
        1e-9,
      ) &&
      measured.earLengthRight === null &&
      measured.earProtrusionLeft === null &&
      measured.earProtrusionRight === null,
  );
  // A small ear off the strip: its lateral point (80, 20, 30) mm, its lobe
  // (75, -30, 35), the head behind it at (70, 22, 20) and, too high to
  // count, (72, 100, 20).
  const base = positions.length / 3;
  const eared = measureFaceUnseen({
    positions: [
      ...positions,
      ...[80, 20, 30, 75, -30, 35, 70, 22, 20, 72, 100, 20].map(
        (v) => v / 1000,
      ),
    ],
    indices,
    ...options,
    auricles: { left: [0, 2], right: [base, base + 1] },
    mastoids: { left: [], right: [base + 2, base + 3] },
  });
  TestValidator.predicate(
    "ear protrusion",
    nclose(eared.earProtrusionRight!, 10 / Math.hypot(5, 50, 5), 1e-9) &&
      nclose(
        eared.earLengthRight!,
        Math.hypot(5, 50, 5) / Math.hypot(98, 8),
        1e-9,
      ),
  );
  const unreadable = {
    eLineUpper: null,
    eLineLower: null,
    facialConvexity: null,
    nasofrontal: null,
    nasolabial: null,
    nasalProtrusion: null,
    cephalicIndex: null,
    earLengthLeft: null,
    earLengthRight: null,
    earProtrusionLeft: null,
    earProtrusionRight: null,
  };
  TestValidator.equals(
    "unreadable",
    [
      measureFaceUnseen({
        positions: positions.map((v, i) => (i % 3 === 0 ? v + 1 : v)),
        indices,
        ...options,
      }),
      measureFaceUnseen({ positions, indices, ...options, inferius: -0.0635 }),
      measureFaceUnseen({ positions, indices, ...options, scalp: [] }),
    ],
    [
      unreadable,
      {
        ...unreadable,
        nasofrontal: measured.nasofrontal,
        nasolabial: measured.nasolabial,
        nasalProtrusion: measured.nasalProtrusion,
        cephalicIndex: measured.cephalicIndex,
        earLengthLeft: measured.earLengthLeft,
      },
      { ...measured, cephalicIndex: null },
    ],
  );
  const cut = measureFaceUnseen({ ...strip(PROFILE.slice(5)), ...options });
  TestValidator.predicate(
    "cut at the tip",
    [
      cut.facialConvexity,
      cut.nasofrontal,
      cut.nasalProtrusion,
      cut.cephalicIndex,
      cut.earLengthLeft,
    ].every((one) => one === null) &&
      nclose(cut.eLineUpper!, measured.eLineUpper!, 1e-12) &&
      nclose(cut.eLineLower!, measured.eLineLower!, 1e-12) &&
      nclose(cut.nasolabial!, measured.nasolabial!, 1e-9),
  );
};
