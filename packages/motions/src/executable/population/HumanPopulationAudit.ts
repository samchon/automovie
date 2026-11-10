import {
  AutoMovieHumanBodyAnatomy,
  type IAutoMovieHumanBodyAnatomy,
  type IAutoMovieHumanParameters,
} from "@automovie/human";

import { HumanPopulationAccess } from "./HumanPopulationAccess";
import { HumanPopulationConditional } from "./HumanPopulationConditional";
import { HumanPopulationSurvey } from "./HumanPopulationSurvey";

type P = IAutoMovieHumanParameters;
type Sex = HumanPopulationSurvey.Sex;
type Variable = HumanPopulationSurvey.Variable;
type Key = AutoMovieHumanBodyAnatomy.TapeControl | "height";
type Field = Exclude<keyof IAutoMovieHumanBodyAnatomy, "sex">;

/**
 * The consistency check of a person's inputs against the declared domain and
 * the published population: each input inside its range and each relation
 * between inputs inside its sex's band.
 */
export namespace HumanPopulationAudit {
  /** One check of a person's inputs. */
  export interface IRow {
    /** Person. */
    person: string;

    /** What was read. */
    site: string;

    /** Value read; NaN when the input is absent. */
    value: number;

    /** Least value that passes. */
    low: number;

    /** Largest value that passes. */
    high: number;

    /** Unit. */
    unit: string;
  }

  /** A relation between a person's inputs that the population bounds. */
  export interface IRelation {
    /** What it relates. */
    label: string;

    /** Where its band comes from. */
    source: string;

    /** The relation's values on a person's inputs, one per side where the input is paired. */
    read: (p: P) => number[];

    /** Band per sex. */
    band: Record<Sex, readonly [number, number]>;
  }

  /**
   * Relations between inputs measured by the survey's own definitions, each
   * band its sex's per-subject mean plus and minus {@link HumanPopulationSurvey.BAND}
   * SD in ANSUR 1988 (`ansur-1988-boundary-people.md`); the cephalic index's
   * band also takes in Du et al. 2008's Chinese workers
   * (`du-2008-chinese-workers.md`), since head shape varies by ancestry more
   * than within one Army. The cephalic index per sex is ANSUR 1988's, women
   * 77.23 (3.52) and men 77.04 (3.68), united with Du 2008's ratio of means
   * and the SD of its parts taken as uncorrelated: women 150.5 / 176.7 =
   * 85.17, SD 85.17 * hypot(7.1 / 150.5, 7.5 / 176.7) = 5.40; men 157.2 /
   * 185.7 = 84.65, SD 84.65 * hypot(5.3 / 157.2, 5.8 / 185.7) = 3.89.
   *
   * Face width over head breadth (ANSUR 1988 0.909 and 0.926, SD 0.028 and
   * 0.029) is not checked: three of the four reference people read 0.78 to
   * 0.80, 4 SD below either sex, the same offset on each, which marks a
   * definition gap (their face width is a zygion located on skin that shows no
   * arch maximum, `measureDefinitions.ts`) rather than three impossible heads.
   */
  export const RELATIONS: readonly IRelation[] = [
    survey(
      "natural waist / hip",
      (p: P): number[] => [v(p, "waist") / v(p, "hip")],
      [0.7503, 0.0431],
      [0.8533, 0.0418],
    ),
    survey(
      "chest / hip",
      (p: P): number[] => [v(p, "chest") / v(p, "hip")],
      [0.9389, 0.0474],
      [1.0082, 0.0408],
    ),
    survey(
      "chest / natural waist",
      (p: P): number[] => [v(p, "chest") / v(p, "waist")],
      [1.253, 0.0547],
      [1.1831, 0.0503],
    ),
    survey(
      "underbust / chest",
      (p: P): number[] => [v(p, "underbust") / v(p, "chest")],
      [0.8492, 0.029],
      [0.9343, 0.0169],
    ),
    survey(
      "bust span / chest",
      (p: P): number[] => [v(p, "bustSpan") / v(p, "chest")],
      [0.2041, 0.0158],
      [0.2179, 0.0136],
    ),
    survey(
      "shoulder to apex (neck to bust point) / stature",
      (p: P): number[] => [v(p, "shoulderToApex") / v(p, "height")],
      [0.1646, 0.0134],
      [0.1552, 0.0096],
    ),
    survey(
      "neck base / neck",
      (p: P): number[] => [v(p, "neckBase") / v(p, "neck")],
      [1.0968, 0.0238],
      [1.0762, 0.0228],
    ),
    survey(
      "neck / chest",
      (p: P): number[] => [v(p, "neck") / v(p, "chest")],
      [0.349, 0.0185],
      [0.3837, 0.0189],
    ),
    survey(
      "thigh / hip",
      (p: P): number[] => [v(p, "thigh") / v(p, "hip")],
      [0.5998, 0.0199],
      [0.6059, 0.0201],
    ),
    survey(
      "knee / thigh",
      (p: P): number[] => [v(p, "knee") / v(p, "thigh")],
      [0.6306, 0.0285],
      [0.6496, 0.0315],
    ),
    survey(
      "calf / knee",
      (p: P): number[] => [v(p, "calf") / v(p, "knee")],
      [0.9657, 0.041],
      [0.9788, 0.0415],
    ),
    survey(
      "wrist / elbow",
      (p: P): number[] => [v(p, "wrist") / v(p, "elbow")],
      [0.6354, 0.023],
      [0.6294, 0.0218],
    ),
    survey(
      "upper arm (acromion-radiale) / stature",
      (p: P): number[] => [v(p, "upperArmLength") / v(p, "height")],
      [0.1914, 0.0065],
      [0.1941, 0.0059],
    ),
    survey(
      "lower arm (radiale-stylion) / stature",
      (p: P): number[] => [v(p, "lowerArmLength") / v(p, "height")],
      [0.1494, 0.0071],
      [0.1537, 0.0064],
    ),
    survey(
      "lower arm / upper arm",
      (p: P): number[] => [v(p, "lowerArmLength") / v(p, "upperArmLength")],
      [0.7808, 0.0327],
      [0.7921, 0.0309],
    ),
    survey(
      "hand circumference / hand breadth",
      (p: P): number[] =>
        HumanPopulationAccess.hands(p).map(
          (h: HumanPopulationAccess.IHand): number =>
            v(p, "handCircumference") / h.handBreadth,
        ),
      [2.3444, 0.0304],
      [2.3646, 0.0343],
    ),
    survey(
      "hand breadth / hand length",
      (p: P): number[] =>
        HumanPopulationAccess.hands(p).map(
          (h: HumanPopulationAccess.IHand): number =>
            h.handBreadth / h.handLength,
        ),
      [0.4407, 0.0201],
      [0.4672, 0.0213],
    ),
    survey(
      "hand length / stature",
      (p: P): number[] =>
        HumanPopulationAccess.hands(p).map(
          (h: HumanPopulationAccess.IHand): number =>
            h.handLength / v(p, "height"),
        ),
      [0.1108, 0.0046],
      [0.1104, 0.0043],
    ),
    survey(
      "foot breadth / foot length",
      (p: P): number[] =>
        HumanPopulationAccess.feet(p).map(
          (f: HumanPopulationAccess.IFoot): number =>
            f.footBreadth / f.footLength,
        ),
      [0.3673, 0.0183],
      [0.3734, 0.0171],
    ),
    survey(
      "foot length / stature",
      (p: P): number[] =>
        HumanPopulationAccess.feet(p).map(
          (f: HumanPopulationAccess.IFoot): number =>
            f.footLength / v(p, "height"),
        ),
      [0.15, 0.0056],
      [0.1536, 0.0054],
    ),
    survey(
      "lateral malleolus height / stature",
      (p: P): number[] =>
        HumanPopulationAccess.feet(p).map(
          (f: HumanPopulationAccess.IFoot): number =>
            f.ankleHeight / v(p, "height"),
        ),
      [0.0372, 0.003],
      [0.0382, 0.0028],
    ),
    survey(
      "head length / stature",
      (p: P): number[] => [p.head.length / v(p, "height")],
      [0.115, 0.0048],
      [0.1124, 0.0048],
    ),
    survey(
      "head circumference / perimeter of the ellipse of head length and breadth",
      (p: P): number[] => [
        p.head.circumference /
          HumanPopulationAccess.ellipse(
            p.head.length / 2,
            (p.head.length * p.head.cephalicIndex) / 200,
          ),
      ],
      [2.0881, 0.0238],
      [2.0633, 0.0207],
    ),
    survey(
      "ear length / head length",
      (p: P): number[] => [
        p.head.earPair.left.length / p.head.length,
        p.head.earPair.right.length / p.head.length,
      ],
      [0.3196, 0.0215],
      [0.3284, 0.0231],
    ),
    {
      label: "cephalic index",
      source:
        "ANSUR 1988 per-subject mean +- 3 SD, united with Du 2008's Chinese ratio of means +- 3 SD of its parts taken as uncorrelated",
      read: (p: P): number[] => [p.head.cephalicIndex],
      band: {
        female: [77.23 - 3 * 3.52, 85.17 + 3 * 5.4],
        male: [77.04 - 3 * 3.68, 84.65 + 3 * 3.89],
      },
    },
  ];

  /** Survey-defined inputs whose value must lie within what some surveyed adult of the person's sex has. */
  export const RANGES: readonly (readonly [
    string,
    Variable,
    (p: P) => number[],
  ])[] = [
    ["stature (height)", "stature", (p: P): number[] => [v(p, "height")]],
    ["chest", "chest", (p: P): number[] => [v(p, "chest")]],
    ["bust span", "bustSpan", (p: P): number[] => [v(p, "bustSpan")]],
    ["underbust", "underbust", (p: P): number[] => [v(p, "underbust")]],
    [
      "shoulder to apex",
      "neckToBustPoint",
      (p: P): number[] => [v(p, "shoulderToApex")],
    ],
    ["natural waist", "waist", (p: P): number[] => [v(p, "waist")]],
    ["hip", "buttock", (p: P): number[] => [v(p, "hip")]],
    ["neck base", "neckBase", (p: P): number[] => [v(p, "neckBase")]],
    ["neck", "neck", (p: P): number[] => [v(p, "neck")]],
    [
      "upper arm length",
      "acromionRadiale",
      (p: P): number[] => [v(p, "upperArmLength")],
    ],
    [
      "lower arm length",
      "radialeStylion",
      (p: P): number[] => [v(p, "lowerArmLength")],
    ],
    ["elbow", "elbow", (p: P): number[] => [v(p, "elbow")]],
    ["wrist", "wrist", (p: P): number[] => [v(p, "wrist")]],
    ["thigh", "thigh", (p: P): number[] => [v(p, "thigh")]],
    ["knee", "knee", (p: P): number[] => [v(p, "knee")]],
    ["calf", "calf", (p: P): number[] => [v(p, "calf")]],
    [
      "hand circumference",
      "handCircumference",
      (p: P): number[] => [v(p, "handCircumference")],
    ],
    [
      "hand length",
      "handLength",
      (p: P): number[] =>
        HumanPopulationAccess.hands(p).map(
          (h: HumanPopulationAccess.IHand): number => h.handLength,
        ),
    ],
    [
      "hand breadth",
      "handBreadth",
      (p: P): number[] =>
        HumanPopulationAccess.hands(p).map(
          (h: HumanPopulationAccess.IHand): number => h.handBreadth,
        ),
    ],
    [
      "foot length",
      "footLength",
      (p: P): number[] =>
        HumanPopulationAccess.feet(p).map(
          (f: HumanPopulationAccess.IFoot): number => f.footLength,
        ),
    ],
    [
      "foot breadth",
      "footBreadth",
      (p: P): number[] =>
        HumanPopulationAccess.feet(p).map(
          (f: HumanPopulationAccess.IFoot): number => f.footBreadth,
        ),
    ],
    [
      "lateral malleolus height",
      "malleolusHeight",
      (p: P): number[] =>
        HumanPopulationAccess.feet(p).map(
          (f: HumanPopulationAccess.IFoot): number => f.ankleHeight,
        ),
    ],
    ["head length", "headLength", (p: P): number[] => [p.head.length]],
    [
      "head circumference",
      "headCircumference",
      (p: P): number[] => [p.head.circumference],
    ],
    ["face width", "bizygomatic", (p: P): number[] => [p.head.faceWidth]],
    [
      "ear length",
      "earLength",
      (p: P): number[] => [
        p.head.earPair.left.length,
        p.head.earPair.right.length,
      ],
    ],
    [
      "ear protrusion",
      "earProtrusion",
      (p: P): number[] => [
        p.head.earPair.left.protrusion,
        p.head.earPair.right.protrusion,
      ],
    ],
  ];

  /**
   * Every check of one person's inputs: each body measure inside its declared
   * domain, the declared sex the person's own, each survey
   * measure inside its sex's surveyed range, and each population relation
   * inside its band.
   *
   * @param person Name in findings.
   * @param sex The sex whose statistics the inputs must satisfy.
   * @param p The person's inputs.
   * @returns Every row, passing or not.
   */
  export function audit(person: string, sex: Sex, p: P): IRow[] {
    const rows: IRow[] = [];
    const row: (
      site: string,
      value: number,
      low: number,
      high: number,
      unit: string,
    ) => void = (
      site: string,
      value: number,
      low: number,
      high: number,
      unit: string,
    ): void => {
      rows.push({ person, site, value, low, high, unit });
    };
    const t: HumanPopulationSurvey.ISurvey = HumanPopulationSurvey.SURVEY[sex];

    for (const [key, [low, high]] of Object.entries(
      HumanPopulationSurvey.DOMAIN,
    ) as [Field, readonly [number, number]][])
      row(
        `domain: ${key}`,
        HumanPopulationAccess.measures(p)[key],
        low,
        high,
        "mm",
      );
    row(
      `sex declared on a ${sex} body`,
      HumanPopulationAccess.measures(p).sex === sex ? 1 : 0,
      1,
      1,
      "",
    );
    for (const [label, variable, read] of RANGES)
      for (const value of read(p))
        row(
          `surveyed ${sex} range: ${label}`,
          value,
          t.min[HumanPopulationConditional.index(variable)]!,
          t.max[HumanPopulationConditional.index(variable)]!,
          "mm",
        );
    for (const r of RELATIONS)
      for (const value of r.read(p))
        row(`relation: ${r.label}`, value, r.band[sex][0], r.band[sex][1], "");

    return rows;
  }

  /**
   * Whether a row passes.
   *
   * @param row The row.
   * @returns Whether its value lies in its bounds.
   */
  export function passes(row: IRow): boolean {
    return row.value >= row.low && row.value <= row.high;
  }

  /**
   * A body measure's resolved value on a person, by its reading name.
   *
   * @param p The person's inputs.
   * @param key The measure.
   * @returns Its value.
   */
  function v(p: P, key: Key): number {
    const m: ReturnType<typeof HumanPopulationAccess.measures> =
      HumanPopulationAccess.measures(p);
    return key === "height"
      ? m.stature
      : m[AutoMovieHumanBodyAnatomy.TAPE_FIELD[key]];
  }

  /**
   * A relation whose band is its sex's ANSUR 1988 per-subject mean plus and
   * minus {@link HumanPopulationSurvey.BAND} SD.
   *
   * @param label What it relates.
   * @param read The relation's values on a person.
   * @param female Women's mean and SD.
   * @param male Men's mean and SD.
   * @returns The relation.
   */
  function survey(
    label: string,
    read: (p: P) => number[],
    female: readonly [number, number],
    male: readonly [number, number],
  ): IRelation {
    const band: (m: readonly [number, number]) => readonly [number, number] = (
      m: readonly [number, number],
    ): readonly [number, number] => [
      m[0] - HumanPopulationSurvey.BAND * m[1],
      m[0] + HumanPopulationSurvey.BAND * m[1],
    ];

    return {
      label,
      source: "ANSUR 1988 per-subject mean +- 3 SD",
      read,
      band: { female: band(female), male: band(male) },
    };
  }
}
