import type { IAutoMovieHumanParameters } from "../structures/IAutoMovieHumanParameters";
import type { IAutoMovieHumanBodyAnatomy } from "../structures/body/IAutoMovieHumanBodyAnatomy";
import { AutoMovieHumanSex } from "../typings/AutoMovieHumanSex";
import { AutoMovieHumanFootConstruction } from "./AutoMovieHumanFootConstruction";
import { AutoMovieHumanBodyBox } from "./AutoMovieHumanBodyBox";
import { AutoMovieHumanBodyBreadths } from "./AutoMovieHumanBodyBreadths";
import { AutoMovieHumanBodyCourses } from "./AutoMovieHumanBodyCourses";
import { AutoMovieHumanBodyFat } from "./AutoMovieHumanBodyFat";
import type { IAutoMovieHumanBodyMeasures } from "./IAutoMovieHumanBodyMeasures";

/**
 * The body's measures under their published names, every field of
 * `IAutoMovieHumanBodyAnatomy`: stature, tapes, segment lengths, skeletal
 * breadths, landmark heights and fat percentage, each the person's own measure
 * or the default its survey regression derives from the person's sex, stature
 * and tapes.
 *
 * A default follows the input that predicts the measure best in the survey: a
 * bone breadth the girth that wraps the same joint, a height the stature or the
 * crotch, a breadth of the foot or hand that segment's own measure. Every
 * coefficient is an ordinary least squares fit of the named survey's public
 * data by sex, listed with its source and its coefficient of determination in
 * `packages/human/docs/work/parameter-anatomy-survey.md`, and the trunk's
 * breadths and depths are reproduced by the survey readings under
 * `test/src/features/human/survey/`. At the chest, the natural waist and the
 * hip, the breadth, depth and girth defaults are held inside the range the
 * supplied measures leave in their box (`AutoMovieHumanBodyBox.place`), so a
 * default never causes a contradiction.
 */
export namespace AutoMovieHumanBodyAnatomy {
  /**
   * Every body measure of a person under its published name, supplied or
   * derived. A tape or length left unknown takes its survey line on the
   * person's stature and sex, and an unknown stature the sex's survey mean.
   *
   * @param params Public input.
   * @returns The person's measures, world millimetres and percent.
   */
  export function resolve(params: IAutoMovieHumanParameters): IAutoMovieHumanBodyMeasures {
    const given: IAutoMovieHumanBodyAnatomy = params.body.anatomy;
    const sex: AutoMovieHumanSex = sexOf(params);
    const k: 0 | 1 = sex === AutoMovieHumanSex.Female ? 0 : 1;
    const line = (fit: readonly [ILine, ILine], x: number): number => fit[k].a + fit[k].b * x;
    const stature: number = given.stature ?? STATURE[k];

    // A tape or length is the person's, else its survey line on stature; the
    // top hip girth, which no survey takes, lies at ISO 8559-1 5.3.12's level
    // midway between the waist and hip levels and takes the girths' mean.
    const tape = (name: TapeControl): number =>
      given[TAPE_FIELD[name]] ?? line(TAPE_ON_STATURE[name], stature);

    // Each trunk level's breadth, depth and girth: the person's, else the
    // girth's line on stature and the breadth's and depth's lines on the
    // girth of their own level (`AutoMovieHumanBodyBreadths`), every default
    // then held inside the box range the supplied measures leave
    // (`AutoMovieHumanBodyBox.place`).
    const B: typeof AutoMovieHumanBodyBreadths = AutoMovieHumanBodyBreadths;
    const box = (
      level: AutoMovieHumanBodyBox.Level,
      control: TapeControl,
      breadth: readonly [ILine, ILine],
      depth: readonly [ILine, ILine],
    ): { breadth: number; depth: number; girth: number } => {
      const fields: AutoMovieHumanBodyBox.IFields = AutoMovieHumanBodyBox.FIELDS[level];
      return AutoMovieHumanBodyBox.place(
        { breadth: given[fields.breadth], depth: given[fields.depth], girth: given[fields.girth] },
        tape(control),
        (g: number): number => line(breadth, g),
        (g: number): number => line(depth, g),
      );
    };
    const chest: { breadth: number; depth: number; girth: number } = box("chest", "chest", CHEST_BREADTH_ON_CHEST, B.CHEST_DEPTH_ON_CHEST);
    const natural: { breadth: number; depth: number; girth: number } = box("waist", "waist", B.WAIST_BREADTH_ON_WAIST, B.WAIST_DEPTH_ON_WAIST);
    const pelvis: { breadth: number; depth: number; girth: number } = box("hip", "hip", B.HIP_BREADTH_ON_HIP, B.BUTTOCK_DEPTH_ON_HIP);
    const waist: number = natural.girth;
    const hip: number = pelvis.girth;
    const t = {
      chest: chest.girth,
      underbust: tape("underbust"),
      waist,
      highHip: given.highHipCircumference ?? (waist + hip) / 2,
      hip,
      neckBase: tape("neckBase"),
      neck: tape("neck"),
      bustSpan: tape("bustSpan"),
      neckToWaist: tape("neckToWaist"),
      shoulderToApex: tape("shoulderToApex"),
      upperArmLength: tape("upperArmLength"),
      lowerArmLength: tape("lowerArmLength"),
      bicep: tape("bicep"),
      elbow: tape("elbow"),
      forearm: tape("forearm"),
      wrist: tape("wrist"),
      handCircumference: tape("handCircumference"),
      inseam: tape("inseam"),
      thigh: tape("thigh"),
      knee: tape("knee"),
      calf: tape("calf"),
    };
    const biacromialBreadth: number = given.biacromialBreadth ?? line(BIACROMIAL_ON_STATURE, stature);

    // The natural waist stands at its surveyed share of the span from
    // trochanterion (on stature) to the person's cervicale.
    const waistHeight = (): number => {
      const cervicale: number = given.cervicaleHeight ?? line(CERVICALE_HEIGHT_ON_STATURE, stature);
      const trochanterion: number = line(TROCHANTERION_HEIGHT_ON_STATURE, stature);
      return trochanterion + WAIST_HEIGHT_SHARE[k] * (cervicale - trochanterion);
    };

    // The crotch by ISO 8559-1 5.7.6: the inside leg over the outer ankle
    // point, as the leg's construction places it.
    const feet: NonNullable<IAutoMovieHumanParameters["extremities"]>["feet"] = params.extremities?.feet;
    const expected: AutoMovieHumanFootConstruction.IDimensions = AutoMovieHumanFootConstruction.expected(
      stature,
      k === 0 ? 1 : -1,
      1,
    );
    const ankle: number = feet === undefined ? expected.ankle : (feet.left.ankleHeight + feet.right.ankleHeight) / 2;
    const footBreadth: number = feet === undefined ? expected.breadth : (feet.left.footBreadth + feet.right.footBreadth) / 2;
    const footLength: number = feet === undefined ? expected.length : (feet.left.footLength + feet.right.footLength) / 2;
    const hands: NonNullable<IAutoMovieHumanParameters["extremities"]>["hands"] = params.extremities?.hands;
    const handBreadth: number =
      hands === undefined
        ? line(HAND_BREADTH_ON_HAND_CIRCUMFERENCE, t.handCircumference)
        : (hands.left.handBreadth + hands.right.handBreadth) / 2;

    // The foot's girths and instep and the crotch's course default by their
    // surveyed lines and share (`AutoMovieHumanBodyCourses`). A crotch length
    // supplied alone keeps the surveyed posterior share of it, and a posterior
    // part supplied alone sets the whole by the same share, so a default never
    // stands shorter than its own part.
    const C: typeof AutoMovieHumanBodyCourses = AutoMovieHumanBodyCourses;
    const crotchLength: number =
      given.crotchLength ??
      (given.posteriorCrotchLength === undefined
        ? line(C.CROTCH_ON_HIP, t.hip)
        : given.posteriorCrotchLength / C.POSTERIOR_CROTCH_SHARE[k]);
    return {
      stature,
      chestCircumference: t.chest,
      underbustCircumference: t.underbust,
      waistCircumference: t.waist,
      highHipCircumference: t.highHip,
      hipCircumference: t.hip,
      neckBaseCircumference: t.neckBase,
      neckCircumference: t.neck,
      bustPointWidth: t.bustSpan,
      backNeckToWaist: t.neckToWaist,
      acrossBackShoulderWidth:
        given.acrossBackShoulderWidth ?? ACROSS_BACK_OVER_BIACROMIAL * biacromialBreadth,
      sideNeckToBustPoint: t.shoulderToApex,
      upperArmLength: t.upperArmLength,
      forearmLength: t.lowerArmLength,
      upperArmCircumference: t.bicep,
      elbowCircumference: t.elbow,
      forearmCircumference: t.forearm,
      wristCircumference: t.wrist,
      handCircumference: t.handCircumference,
      inseam: t.inseam,
      thighCircumference: t.thigh,
      kneeCircumference: t.knee,
      calfCircumference: t.calf,
      sex,
      biacromialBreadth,
      acromialHeight: given.acromialHeight ?? line(ACROMIAL_HEIGHT_ON_STATURE, stature),
      cervicaleHeight: given.cervicaleHeight ?? line(CERVICALE_HEIGHT_ON_STATURE, stature),
      sideNeckPointHeight: given.sideNeckPointHeight ?? line(SIDE_NECK_POINT_HEIGHT_ON_STATURE, stature),
      suprasternaleHeight: given.suprasternaleHeight ?? line(SUPRASTERNALE_HEIGHT_ON_STATURE, stature),
      axillaHeight: given.axillaHeight ?? line(AXILLA_HEIGHT_ON_STATURE, stature),
      waistHeight: given.waistHeight ?? waistHeight(),
      chestBreadth: chest.breadth,
      chestDepth: chest.depth,
      waistBreadth: natural.breadth,
      waistDepth: natural.depth,
      hipBreadth: pelvis.breadth,
      buttockDepth: pelvis.depth,
      bideltoidBreadth: given.bideltoidBreadth ?? line(B.BIDELTOID_ON_CHEST, t.chest),
      bicristalBreadth: given.bicristalBreadth ?? line(B.BICRISTAL_ON_HIP_BREADTH, pelvis.breadth),
      elbowBreadth: given.elbowBreadth ?? line(ELBOW_BREADTH_ON_FOREARM, t.forearm),
      wristBreadth: given.wristBreadth ?? line(WRIST_BREADTH_ON_WRIST, t.wrist),
      kneeBreadth: given.kneeBreadth ?? line(KNEE_BREADTH_ON_KNEE, t.knee),
      bimalleolarBreadth: given.bimalleolarBreadth ?? line(BIMALLEOLAR_ON_STATURE, stature),
      ankleCircumference: given.ankleCircumference ?? line(ANKLE_ON_CALF, t.calf),
      heelBreadth: given.heelBreadth ?? line(HEEL_ON_FOOT_BREADTH, footBreadth),
      ballOfFootLength: given.ballOfFootLength ?? line(BALL_OF_FOOT_ON_FOOT_LENGTH, footLength),
      ballOfFootCircumference: given.ballOfFootCircumference ?? line(C.BALL_OF_FOOT_ON_FOOT_BREADTH, footBreadth),
      heelAnkleCircumference: given.heelAnkleCircumference ?? line(C.HEEL_ANKLE_ON_FOOT_LENGTH, footLength),
      instepLength: given.instepLength ?? line(C.INSTEP_ON_FOOT_LENGTH, footLength),
      glutealFurrowHeight: given.glutealFurrowHeight ?? line(GLUTEAL_FURROW_ON_CROTCH, t.inseam + ankle),
      crotchLength,
      posteriorCrotchLength: given.posteriorCrotchLength ?? C.POSTERIOR_CROTCH_SHARE[k] * crotchLength,
      thumbBreadth: given.thumbBreadth ?? line(THUMB_ON_HAND_BREADTH, handBreadth),
      bodyFatPercentage: given.bodyFatPercentage ?? AutoMovieHumanBodyFat.navy(sex, stature, t.neck, t.waist, t.hip),
    };
  }

  /**
   * The sex whose statistics a person's omitted measures follow: the person's,
   * else female.
   *
   * @param params Public input.
   */
  export function sexOf(params: IAutoMovieHumanParameters): AutoMovieHumanSex {
    return params.body.anatomy.sex ?? AutoMovieHumanSex.Female;
  }

  /**
   * The construction's adiposity coordinate of a person, from the measured fat
   * percentage: the body mass index the percentage implies by Deurenberg et
   * al.'s relation (1991, Br J Nutr 65(2):105-114: percent fat = 1.2 BMI +
   * 0.23 age - 10.8 male - 5.4), at ANSUR 1988's mean age of the sex, as a z
   * score on ANSUR 1988's BMI distribution of the sex over 2.326, clamped to
   * the unit range: the survey the population ends are drawn from, so an end
   * at the 1st or 99th BMI percentile stands at minus or plus 1.
   *
   * @param measures The person's resolved measures.
   * @returns Adiposity coordinate, -1 to 1.
   */
  export function adiposity(measures: IAutoMovieHumanBodyMeasures): number {
    const k: 0 | 1 = measures.sex === AutoMovieHumanSex.Female ? 0 : 1;
    const bmi: number = (measures.bodyFatPercentage - 0.23 * MEAN_AGE[k] + 10.8 * k + 5.4) / 1.2;
    return Math.max(-1, Math.min(1, (bmi - BMI[k][0]) / BMI[k][1] / 2.326));
  }

  /**
   * The construction's sex coordinate: the end of the person's sex, +1 for a
   * woman and -1 for a man, a table choice rather than a blend.
   *
   * @param measures The person's resolved measures.
   */
  export function sexCoordinate(measures: IAutoMovieHumanBodyMeasures): number {
    return measures.sex === AutoMovieHumanSex.Female ? 1 : -1;
  }

  /** Mean age by sex, years; ANSUR 1988, 26.2 and 27.2 (`docs/sources/ansur-1988.md`). */
  export const MEAN_AGE: readonly [number, number] = [26.2, 27.2];

  /** Body mass index mean and SD by sex, kg/m2; ANSUR 1988 working data, 23.34 (2.65) and 25.42 (3.00). */
  export const BMI: readonly [readonly [number, number], readonly [number, number]] = [
    [23.3357, 2.649],
    [25.4194, 3.0004],
  ];

  /** One sex's straight line `a + b x`. */
  export interface ILine {
    /** Intercept, the measure's unit. */
    a: number;

    /** Slope, the measure's unit per the predictor's. */
    b: number;
  }

  /** Biacromial breadth on stature, mm; ANSUR 1988, R2 0.26 and 0.24. */
  export const BIACROMIAL_ON_STATURE: readonly [ILine, ILine] = [
    { a: 137.22, b: 0.1383 },
    { a: 167.13, b: 0.1309 },
  ];

  /** Acromial height on stature, mm; ANSUR II, R2 0.94 and 0.93 (`docs/sources/ansur-ii.md`). */
  export const ACROMIAL_HEIGHT_ON_STATURE: readonly [ILine, ILine] = [
    { a: -96.9, b: 0.8793 },
    { a: -126.9, b: 0.8926 },
  ];

  /** Cervicale height on stature, mm; ANSUR II, R2 0.97 and 0.97. */
  export const CERVICALE_HEIGHT_ON_STATURE: readonly [ILine, ILine] = [
    { a: -90.4, b: 0.9126 },
    { a: -78.1, b: 0.9084 },
  ];

  /** Side neck point height (lateral neck height) on stature, mm; ANSUR 1988, R2 0.98 and 0.97. */
  export const SIDE_NECK_POINT_HEIGHT_ON_STATURE: readonly [ILine, ILine] = [
    { a: -81.84, b: 0.9073 },
    { a: -85.89, b: 0.9086 },
  ];

  /** Suprasternale height on stature, mm; ANSUR 1988, R2 0.97 and 0.96. */
  export const SUPRASTERNALE_HEIGHT_ON_STATURE: readonly [ILine, ILine] = [
    { a: -79.86, b: 0.8655 },
    { a: -89.26, b: 0.8701 },
  ];

  /**
   * Trochanterion height on stature, mm; ANSUR II, R2 0.74 and 0.72
   * (`docs/sources/ansur-ii.md`): the lower end of the span the natural waist
   * height is read on.
   */
  export const TROCHANTERION_HEIGHT_ON_STATURE: readonly [ILine, ILine] = [
    { a: -126.9, b: 0.597 },
    { a: -169.9, b: 0.6098 },
  ];

  /**
   * The natural waist's place on the span from trochanterion to cervicale,
   * women and men: ANSUR 1988, 0.3564 (SD 0.0335) and 0.3361 (0.0218), the
   * per-subject share's mean (`docs/sources/ansur-1988.md`). The default of an
   * unknown natural waist height is this share of the person's own span.
   */
  export const WAIST_HEIGHT_SHARE: readonly [number, number] = [0.3564, 0.3361];

  /** Axilla height on stature, mm; ANSUR II. */
  export const AXILLA_HEIGHT_ON_STATURE: readonly [ILine, ILine] = [
    { a: -130.5, b: 0.841 },
    { a: -148.4, b: 0.8413 },
  ];

  /** Chest breadth on chest circumference, mm; ANSUR 1988, R2 0.71 and 0.81. */
  export const CHEST_BREADTH_ON_CHEST: readonly [ILine, ILine] = [
    { a: 43.06, b: 0.2608 },
    { a: -8.67, b: 0.333 },
  ];

  /**
   * Humerus biepicondylar breadth on the relaxed maximum forearm girth, mm;
   * Heinz et al. 2003, per side, R2 0.43 and 0.38.
   */
  export const ELBOW_BREADTH_ON_FOREARM: readonly [ILine, ILine] = [
    { a: 23.05, b: 0.1633 },
    { a: 29.23, b: 0.1525 },
  ];

  /** Bistyloid breadth on wrist girth, mm; Heinz et al. 2003, per side, R2 0.56 and 0.40. */
  export const WRIST_BREADTH_ON_WRIST: readonly [ILine, ILine] = [
    { a: 5.41, b: 0.2919 },
    { a: 18.2, b: 0.2213 },
  ];

  /** Femur biepicondylar breadth on knee girth, mm; Heinz et al. 2003, per side, R2 0.59 and 0.33. */
  export const KNEE_BREADTH_ON_KNEE: readonly [ILine, ILine] = [
    { a: 28.1, b: 0.177 },
    { a: 47.85, b: 0.1343 },
  ];

  /** Bimalleolar breadth on stature, mm; ANSUR 1988, R2 0.30 and 0.27. */
  export const BIMALLEOLAR_ON_STATURE: readonly [ILine, ILine] = [
    { a: 20.24, b: 0.0271 },
    { a: 19.45, b: 0.0304 },
  ];

  /** Minimum ankle circumference on calf circumference, mm; ANSUR 1988, R2 0.61 and 0.64. */
  export const ANKLE_ON_CALF: readonly [ILine, ILine] = [
    { a: 62.18, b: 0.4062 },
    { a: 66.38, b: 0.4108 },
  ];

  /** Heel breadth on foot breadth, mm; ANSUR 1988, R2 0.34 and 0.31. */
  export const HEEL_ON_FOOT_BREADTH: readonly [ILine, ILine] = [
    { a: 11.94, b: 0.5695 },
    { a: 14.59, b: 0.5521 },
  ];

  /** Ball-of-foot length on foot length, mm; ANSUR II, R2 0.88 and 0.86. */
  export const BALL_OF_FOOT_ON_FOOT_LENGTH: readonly [ILine, ILine] = [
    { a: 2.61, b: 0.7286 },
    { a: 0.46, b: 0.7393 },
  ];

  /** Gluteal furrow height on crotch height, mm; ANSUR 1988, R2 0.91 and 0.90. */
  export const GLUTEAL_FURROW_ON_CROTCH: readonly [ILine, ILine] = [
    { a: 25.72, b: 0.9316 },
    { a: 29.79, b: 0.9372 },
  ];

  /** Hand breadth at metacarpale on hand circumference at metacarpale, mm; ANSUR 1988, R2 0.93 and 0.90. */
  export const HAND_BREADTH_ON_HAND_CIRCUMFERENCE: readonly [ILine, ILine] = [
    { a: -0.11, b: 0.4272 },
    { a: 1.92, b: 0.414 },
  ];

  /** Thumb breadth on hand breadth, mm; ANSUR 1988, R2 0.33 and 0.32. */
  export const THUMB_ON_HAND_BREADTH: readonly [ILine, ILine] = [
    { a: 5.39, b: 0.1923 },
    { a: 7.62, b: 0.1827 },
  ];

  /** Mean stature by sex, mm, the default of an unknown height: ANSUR II, 1628.5 and 1756.2. */
  export const STATURE: readonly [number, number] = [1628.5, 1756.2];

  /**
   * Ratio of the ISO 8559-1 5.4.3 across back shoulder width to the straight
   * breadth between the same shoulder points, read on the reference skins f1
   * and f2 by `test_human_anatomy_course` (395.6 over 355.4 and 401.7 over
   * 363.2): the default of an unknown across back width on the person's
   * biacromial breadth, since no survey takes the ISO path.
   */
  export const ACROSS_BACK_OVER_BIACROMIAL: number = 1.11;

  /**
   * Each tape and length on stature, mm, the default of an unknown control:
   * ordinary least squares by sex on ANSUR 1988 (chest, below-bust chest,
   * natural waist, buttock, neck base, bustpoint breadth, natural waist back
   * length, neck to bust point, elbow, wrist and hand circumferences, the
   * proximal thigh just below the gluteal furrow, knee and calf
   * circumferences; the inseam as crotch height less lateral malleolus
   * height), ANSUR II (neck below the larynx, acromion-radiale,
   * radiale-stylion) and Heinz et al. 2003 (forearm). Girths follow stature weakly (R2 0.04 to 0.26), lengths strongly
   * (0.44 to 0.73). The relaxed mid-upper arm circumference, which no survey
   * with stature in hand takes relaxed, is NHANES 2015-2018's mean at 20 to 29
   * years over its mean stature (315 over 1626, 341 over 1758).
   */
  export const TAPE_ON_STATURE: Readonly<Record<TapeControl, readonly [ILine, ILine]>> = {
    chest: [{ a: 545.3, b: 0.222 }, { a: 424.64, b: 0.3228 }],
    underbust: [{ a: 421.77, b: 0.2135 }, { a: 422.58, b: 0.2868 }],
    waist: [{ a: 421.48, b: 0.1866 }, { a: 344.49, b: 0.2822 }],
    hip: [{ a: 410.58, b: 0.3414 }, { a: 327.64, b: 0.3736 }],
    neckBase: [{ a: 183.41, b: 0.0999 }, { a: 218.24, b: 0.1083 }],
    neck: [{ a: 186.11, b: 0.0882 }, { a: 268.79, b: 0.0734 }],
    bustSpan: [{ a: 99.54, b: 0.0523 }, { a: 75.45, b: 0.08 }],
    neckToWaist: [{ a: 61.09, b: 0.1879 }, { a: 49.6, b: 0.2064 }],
    shoulderToApex: [{ a: 106.79, b: 0.0989 }, { a: 80.82, b: 0.1091 }],
    upperArmLength: [{ a: -34.0, b: 0.212 }, { a: -20.9, b: 0.2028 }],
    lowerArmLength: [{ a: -24.5, b: 0.1632 }, { a: -14.4, b: 0.1608 }],
    bicep: [{ a: 0, b: 0.1937 }, { a: 0, b: 0.194 }],
    elbow: [{ a: 100.63, b: 0.0845 }, { a: 96.35, b: 0.1029 }],
    forearm: [{ a: 135.78, b: 0.0618 }, { a: 165.47, b: 0.0658 }],
    wrist: [{ a: 61.16, b: 0.0553 }, { a: 62.05, b: 0.0639 }],
    handCircumference: [{ a: 85.73, b: 0.0616 }, { a: 93.86, b: 0.0683 }],
    inseam: [{ a: -185.34, b: 0.55 }, { a: -199.46, b: 0.5522 }],
    thigh: [{ a: 279.52, b: 0.1846 }, { a: 225.0, b: 0.2116 }],
    knee: [{ a: 127.95, b: 0.1456 }, { a: 119.27, b: 0.1521 }],
    calf: [{ a: 181.53, b: 0.1049 }, { a: 158.19, b: 0.1252 }],
  };

  /** The anatomy record's field for each body control it replaces. */
  export const TAPE_FIELD: Readonly<Record<TapeControl, TapeField>> = {
    chest: "chestCircumference",
    underbust: "underbustCircumference",
    waist: "waistCircumference",
    hip: "hipCircumference",
    neckBase: "neckBaseCircumference",
    neck: "neckCircumference",
    bustSpan: "bustPointWidth",
    neckToWaist: "backNeckToWaist",
    shoulderToApex: "sideNeckToBustPoint",
    upperArmLength: "upperArmLength",
    lowerArmLength: "forearmLength",
    bicep: "upperArmCircumference",
    elbow: "elbowCircumference",
    forearm: "forearmCircumference",
    wrist: "wristCircumference",
    handCircumference: "handCircumference",
    inseam: "inseam",
    thigh: "thighCircumference",
    knee: "kneeCircumference",
    calf: "calfCircumference",
  };

  /** An anatomy field that replaces a body control's tape or length. */
  export type TapeField =
    | "chestCircumference"
    | "underbustCircumference"
    | "waistCircumference"
    | "hipCircumference"
    | "neckBaseCircumference"
    | "neckCircumference"
    | "bustPointWidth"
    | "backNeckToWaist"
    | "sideNeckToBustPoint"
    | "upperArmLength"
    | "forearmLength"
    | "upperArmCircumference"
    | "elbowCircumference"
    | "forearmCircumference"
    | "wristCircumference"
    | "handCircumference"
    | "inseam"
    | "thighCircumference"
    | "kneeCircumference"
    | "calfCircumference";

  /** A body control whose unknown value takes its survey line on stature. */
  export type TapeControl =
    | "chest"
    | "underbust"
    | "waist"
    | "hip"
    | "neckBase"
    | "neck"
    | "bustSpan"
    | "neckToWaist"
    | "shoulderToApex"
    | "upperArmLength"
    | "lowerArmLength"
    | "bicep"
    | "elbow"
    | "forearm"
    | "wrist"
    | "handCircumference"
    | "inseam"
    | "thigh"
    | "knee"
    | "calf";
}

