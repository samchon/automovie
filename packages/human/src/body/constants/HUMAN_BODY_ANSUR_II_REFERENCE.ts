type SurveyBand = {
  /** ANSUR II public CSV column, with its protocol in NATICK/TR-11/017. */
  column: string;
  /** First and 99th percentiles in millimetres, not clinical limits. */
  femaleMillimetres: readonly [number, number];
  maleMillimetres: readonly [number, number];
};

/**
 * Observed ANSUR II soldier-size context for four comparable body tapes.
 *
 * The U.S. Army's 2012 working databases contain 1,986 women and 4,082 men
 * aged 17–58. For each named CSV column, the two values are the 1st and 99th
 * percentiles after sorting all nonmissing millimetre readings and linearly
 * interpolating at p(n-1). The female and male CSV SHA-256 digests used here
 * are ed7e800aa97a4d42f8286b988be2fe1883a2e789588169db959864b707d1757a
 * and 0547aea0170e5293de519389981135e75803f02e6d40c77ace740decc0caac64.
 * The Army's release is https://www.army.mil/article/188601/ and its
 * measurement protocol is Hotzman et al., NATICK/TR-11/017 (2011),
 * https://tools.openlab.psu.edu/publicData/ANSURII-TR11-017.pdf.
 *
 * The hip reference is the horizontal tape at maximum buttock projection;
 * wrist is at stylion, calf the maximum standing horizontal tape, and ankle
 * the minimum. The body rules use the left limb and a source rig at rest,
 * while the survey measured the right limb in prescribed postures. These
 * bands describe one military sample, not a human normal range, a diagnostic
 * boundary, or this body's shape envelope. Channels whose protocol differs
 * materially (navel waist, flexed biceps, gluteal-furrow thigh, clothed
 * chest) deliberately have no reference entry.
 */
export const HUMAN_BODY_ANSUR_II_REFERENCE: ReadonlyMap<string, SurveyBand> =
  new Map([
    [
      "measureHipsCirc",
      {
        column: "buttockcircumference",
        femaleMillimetres: [867, 1206.3],
        maleMillimetres: [861.8, 1218],
      },
    ],
    [
      "measureWristCirc",
      {
        column: "wristcircumference",
        femaleMillimetres: [138, 174],
        maleMillimetres: [156, 198],
      },
    ],
    [
      "measureCalfCirc",
      {
        column: "calfcircumference",
        femaleMillimetres: [312.7, 452],
        maleMillimetres: [329.8, 467],
      },
    ],
    [
      "measureAnkleCirc",
      {
        column: "anklecircumference",
        femaleMillimetres: [185, 255],
        maleMillimetres: [198, 268],
      },
    ],
  ]);
