import type { IFacePopulationFacts } from "./facePopulationFacts";
import {
  FACE_UNSEEN_INDICES,
  type FaceUnseenReading,
  type IFaceUnseenNorm,
} from "./faceUnseenIndices";

type FacePopulationAncestry = NonNullable<IFacePopulationFacts["ancestry"]>;

/**
 * Young-adult means by population and sex.
 *
 * E-line: European, Pecora 2008 (17 years), Nanda et al. 1990 (Denver, 18
 * years), Bravo-Hammett et al. 2020 (FaceBase 3D) and, for women, Sforza et
 * al. 2009; African, Isiekwe et al. 2012 (Lagos students) and Oliveira et
 * al. 2021 (Afro-Brazilians) and, for women, Wilson et al. 2023 and Sutter
 * and Turley 1998; East Asian, Kim, Choy and Yun 2002 (Korean students, by
 * sex), Zhang et al. 2025 and Joshi et al. 2015 (Chinese, sexes pooled);
 * each the unweighted mean of its samples.
 *
 * Angles: the posterior means of Wen, Wong, Lin, Yin and McGrath's Bayesian
 * meta-analysis of photogrammetric studies (PLoS One 2015;10:e0134525,
 * Tables 2 and 3: adults 18 to 45, attractive and malocclusion samples
 * excluded), whose Caucasian samples include Middle-Eastern and South-Asian
 * ones.
 *
 * Nasal tip protrusion index: European, the 3D Facial Norms' manual
 * landmarks at 19 to 25 years (Kesterke et al., Biol Sex Differ 2016;7:23,
 * Additional file 1: sn-prn 21.1 and 20.0, n-sn 56.7 and 54.6 mm); African
 * and East Asian, that value times the ratio one instrument measured
 * between the populations (Zaidi et al., PLoS Genet 2017;13:e1006616, 3D,
 * individual data: West African 0.906 and 0.873, East Asian 0.891 and 0.879
 * of European, men and women), which puts African-American women at 32.0
 * against 33.8 measured by caliper (Porter and Olson 2003) and Han Chinese
 * at 32.2 to 33.2 against 33.2 from CT.
 *
 * Cephalic index: the ratio of the mean breadth to the mean length. White
 * and Black, the 2012 US Army survey (ANSUR II, Gordon et al. 2014,
 * NATICK/TR-15/007), soldiers 18 to 35, one instrument for both (the Black
 * women's lengths were taken over braids, so theirs reads low); East Asian,
 * native samples: Japanese adults 18 to 34 (Kouchi and Mochimaru, AIST head
 * database 2008) and Chinese workers (Du et al., Ann Occup Hyg
 * 2008;52:773-782), their two ratios averaged.
 *
 * Ear length over face height (sellion to menton) and ear protrusion over
 * ear length: the means of the individual ratios in ANSUR II, soldiers 18 to 35, White, Black, and those
 * of Chinese, Korean or Japanese ethnicity (47 men and 27 women).
 *
 * Lower vermilion over mouth width (sto-li over ch-ch, the ratio of the
 * means), the samples of the lip envelope revision: European, 3D Facial
 * Norms at 19 to 25 years (9.2 over 50.4 mm, men; 9.1 over 47.7, women);
 * African, Nairobi university students 18 to 30 (Virdi, Wertheim and Naini,
 * Maxillofac Plast Reconstr Surg 2019;41:9: 13.8 over 55.9 and 13.6 over
 * 52.0); East Asian, Hong Kong Chinese 18 to 35 by 3dMD (Jayaratne et al.:
 * 10.98 over 49.7 for men) and, for women, the mean of theirs (9.79 over
 * 45.18) and Korean women's 20 to 39 (Kwon et al., Ann Dermatol
 * 2021;33:52-60: 9.58 over 44.45). These are adults under 40; the lips thin
 * with age and no longitudinal sample gives how far, so an older subject's
 * stand-in is the young adults' (an assumption, as the E-line's ageing is
 * one sample's).
 */
export const FACE_UNSEEN_NORMS: Record<
  FacePopulationAncestry,
  Record<"male" | "female", IFaceUnseenNorm>
> = {
  european: {
    male: {
      eLineUpper: -0.00458,
      eLineLower: -0.00292,
      facialConvexity: 167.8,
      nasofrontal: 137.9,
      nasolabial: 100.1,
      nasalProtrusion: 0.372,
      cephalicIndex: 0.7708,
      earLength: 0.5225,
      earProtrusion: 0.368,
      lowerVermilion: 0.1825,
    },
    female: {
      eLineUpper: -0.00497,
      eLineLower: -0.00235,
      facialConvexity: 168.2,
      nasofrontal: 140.6,
      nasolabial: 103.3,
      nasalProtrusion: 0.366,
      cephalicIndex: 0.778,
      earLength: 0.5282,
      earProtrusion: 0.3525,
      lowerVermilion: 0.1908,
    },
  },
  african: {
    male: {
      eLineUpper: 0.0026,
      eLineLower: 0.00597,
      facialConvexity: 168.5,
      nasofrontal: 129.7,
      nasolabial: 87.5,
      nasalProtrusion: 0.337,
      cephalicIndex: 0.7671,
      earLength: 0.4976,
      earProtrusion: 0.362,
      lowerVermilion: 0.2469,
    },
    female: {
      eLineUpper: 0.00188,
      eLineLower: 0.00478,
      facialConvexity: 170.8,
      nasofrontal: 132.2,
      nasolabial: 85.9,
      nasalProtrusion: 0.32,
      cephalicIndex: 0.7651,
      earLength: 0.5127,
      earProtrusion: 0.3378,
      lowerVermilion: 0.2615,
    },
  },
  asian: {
    male: {
      eLineUpper: 0.00013,
      eLineLower: 0.00123,
      facialConvexity: 168.3,
      nasofrontal: 133.7,
      nasolabial: 94.7,
      nasalProtrusion: 0.332,
      cephalicIndex: 0.8484,
      earLength: 0.5214,
      earProtrusion: 0.3695,
      lowerVermilion: 0.2209,
    },
    female: {
      eLineUpper: -0.00008,
      eLineLower: 0.00127,
      facialConvexity: 170.2,
      nasofrontal: 139.3,
      nasolabial: 94.2,
      nasalProtrusion: 0.322,
      cephalicIndex: 0.8553,
      earLength: 0.5256,
      earProtrusion: 0.3569,
      lowerVermilion: 0.2161,
    },
  },
};

/** Pecora 2008's change from 17 years, metres, at 17, 46 and 57 years. */
const AGEING: Record<
  "male" | "female",
  { age: number; upper: number; lower: number }[]
> = {
  male: [
    { age: 17, upper: 0, lower: 0 },
    { age: 46, upper: -0.0033, lower: -0.0035 },
    { age: 57, upper: -0.0034, lower: -0.0043 },
  ],
  female: [
    { age: 17, upper: 0, lower: 0 },
    { age: 47.5, upper: -0.0013, lower: -0.0011 },
    { age: 58.5, upper: -0.0012, lower: -0.0016 },
  ],
};

/**
 * The population mean of a subject's unseen form, or null without a
 * recorded sex or ancestry. Age moves it by the longitudinal change,
 * piecewise linearly between the sample's ages and held beyond them.
 */
export function faceUnseenNorm(facts: {
  sex: "male" | "female" | null;
  ancestry: FacePopulationAncestry | null;
  ageYears: number | null;
}): IFaceUnseenNorm | null {
  if (facts.sex === null || facts.ancestry === null) return null;
  const base = FACE_UNSEEN_NORMS[facts.ancestry][facts.sex];
  const curve = AGEING[facts.sex];
  const age = Math.min(
    curve[curve.length - 1]!.age,
    Math.max(curve[0]!.age, facts.ageYears ?? curve[0]!.age),
  );
  const k = Math.max(
    1,
    curve.findIndex((point) => point.age >= age),
  );
  const [a, b] = [curve[k - 1]!, curve[k]!];
  const t = (age - a.age) / (b.age - a.age);
  return {
    ...base,
    eLineUpper: base.eLineUpper + a.upper + t * (b.upper - a.upper),
    eLineLower: base.eLineLower + a.lower + t * (b.lower - a.lower),
  };
}

/**
 * Each unseen reading's adult reference interval: over every ancestry and
 * sex, at the ages its norm is given for (17 and 60 years, the span of the
 * lips' ageing), the norm less and plus twice the index's spread.
 */
export function faceUnseenIntervals(): Record<
  FaceUnseenReading,
  [number, number]
> {
  const ancestries = Object.keys(FACE_UNSEEN_NORMS) as FacePopulationAncestry[];
  return Object.fromEntries(
    FACE_UNSEEN_INDICES.map((index) => {
      const norms = ancestries.flatMap((ancestry) =>
        (["male", "female"] as const).flatMap((sex) =>
          [17, 60].map(
            (ageYears) =>
              faceUnseenNorm({ sex, ancestry, ageYears })![index.norm],
          ),
        ),
      );
      return [
        index.id,
        [
          Math.min(...norms) - 2 * index.spread,
          Math.max(...norms) + 2 * index.spread,
        ],
      ];
    }),
  ) as Record<FaceUnseenReading, [number, number]>;
}

