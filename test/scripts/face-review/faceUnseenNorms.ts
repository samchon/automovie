/**
 * The face a frontal photograph cannot show, set to the population it comes
 * from.
 *
 * A frontal photograph records the face's depths (how far the lips, the
 * chin, the nasal root and the nasal tip stand forward) only through
 * outlines the detector does not read as depth, the head behind the face
 * not at all, and the ears without a landmark, so a document has no
 * measurement behind them. The most probable form is then the mean of the
 * subject's population at their sex and age, as adults not chosen for their
 * looks show it (`FACE_UNSEEN_NORMS`), read by the classical definitions:
 *
 * - the lips' distances to Ricketts's E-line (pronasale to soft-tissue
 *   pogonion), positive in front of it, each from its lip's most prominent
 *   point toward the line;
 * - the angle of facial convexity, g-sn-pog';
 * - the nasofrontal angle, between the forehead's tangent and the nasal
 *   dorsum at soft-tissue nasion;
 * - the nasolabial angle, between the columella's tangent from subnasale
 *   and the line from subnasale to labrale superius;
 * - the nasal tip protrusion index, sn-prn over the nose's height n-sn
 *   (Farkas);
 * - the cephalic index, the head's greatest breadth over the scalp (eu-eu,
 *   above the ears) over its length from glabella to opisthocranion (the
 *   midline's most posterior point), which hair hides;
 * - each ear's length (sa-sba, `faceAuricleLength`) over the face's height
 *   from soft-tissue nasion to menton;
 * - each ear's protrusion over its length: the ear's most lateral point
 *   less the head behind it (ANSUR II: from the mastoid to the ear's most
 *   lateral edge, horizontally), the head being the most lateral skin within
 *   5 mm of that point's height and 2 cm behind the auricle;
 * - the lower vermilion's height over the mouth's width, sto-li over ch-ch,
 *   read as the lip envelope revision reads it (`faceVermilionRatios`).
 *   The photograph shows the lower lip, and its border is read from the
 *   midline's colour (`faceLikenessVermilion`); this reading stands in for
 *   the photograph's `lowerVermilion` index only where the photograph does
 *   not measure it (`photographed`): unobserved under the subject's camera
 *   (README "Instrument") or unread (a greyscale print, a lip no redder
 *   than its skin).
 *
 * The profile's landmarks are `faceProfileLandmarks`'s. Each reading is
 * paired with the one control that means it (`FACE_UNSEEN_INDICES`) and
 * solved with the photograph's indices, so the photographed proportions and
 * the population's unseen form hold together.
 *
 * Lips retrude with age; the one longitudinal sample (Pecora, Baccetti and
 * McNamara, Am J Orthod Dentofacial Orthop 2008;134:496-505: the same
 * Michigan subjects at 17, 46 and 57 years) gives that change, applied as a
 * difference from 17 years to every population, which is an assumption: no
 * other population has been followed. The other readings are those of
 * adults and are not aged. `faceUnseenNorm` returns the targets;
 * `measureFaceUnseen` reads the same quantities on a built skin.
 *
 * The nose's projection is held by its index, not by the nasofacial angle
 * (n-prn against g-pog'): the angle also turns with the forehead and the
 * chin, and on the source, whose nose projects 13.1 mm (index 0.27), its
 * norms send the nose, the lips and the chin together to their bounds,
 * where the index is reached at a nose depth of 0.6 to 1.
 */
import type { IAutoMovieHumanFaceBasis } from "@automovie/human";

import type { IFaceAnthropometryIndex } from "./faceAnthropometry";
import { faceAuricleLength, faceAuricleVertices } from "./faceAuricle";
import {
  type FaceMidsagittalPoint,
  faceMidsagittalLandmarks,
  faceMidsagittalProfile,
  faceMidsagittalSection,
  faceProfileLandmarks,
} from "./faceMidsagittal";
import type { IFacePopulationFacts } from "./facePopulationFacts";
import { faceVermilionRatios } from "./prepareLipEnvelopeBasis";

type FacePopulationAncestry = NonNullable<IFacePopulationFacts["ancestry"]>;

/**
 * The unseen form's norms: E-line distances in metres, angles in degrees,
 * the cephalic index and the ear's length over the face's height as ratios.
 */
export interface IFaceUnseenNorm {
  eLineUpper: number;
  eLineLower: number;
  facialConvexity: number;
  nasofrontal: number;
  nasolabial: number;
  nasalProtrusion: number;
  cephalicIndex: number;
  earLength: number;
  earProtrusion: number;
  lowerVermilion: number;
}

/** One reading of the unseen form on the model. */
export type FaceUnseenReading =
  | Exclude<keyof IFaceUnseenNorm, "earLength" | "earProtrusion">
  | "earLengthLeft"
  | "earLengthRight"
  | "earProtrusionLeft"
  | "earProtrusionRight";

/** One unseen reading, the norm it is held to and the control that means it. */
export interface IFaceUnseenIndex extends IFaceAnthropometryIndex {
  id: FaceUnseenReading;
  norm: keyof IFaceUnseenNorm;
  /** The least difference the reading resolves (metres, degrees, ratio). */
  resolution: number;
  /** The population's standard deviation of the reading, same units. */
  spread: number;
  /**
   * The photograph's index this reading stands in for: it holds only where
   * the photograph does not measure that index.
   */
  photographed?: string;
}

/**
 * Each unseen reading's control. Lip protrusion is the dentoalveolar
 * position the whole mouth moves with, and the lower lip's own fullness sets
 * it apart from the upper; the chin's projection closes the facial
 * convexity, the nasal root's depth the nasofrontal angle, the columella's
 * inclination the nasolabial angle, the nose's depth its tip's
 * protrusion, the occiput's depth the head's length, and each ear's scale
 * its length and its flap its protrusion. Distances resolve to 0.01 mm, angles to 0.01 degree, a
 * tenth of the profile's sampling, and ratios to 0.0001. Each spread is
 * the reading's standard deviation among adults: 2 mm to the E-line
 * (Ricketts 1968), 4 degrees of convexity and 8 of the nasolabial angle
 * (Legan and Burstone 1980), 7 of the nasofrontal angle (Farkas 1994,
 * North American White), 0.02 of the nasal tip protrusion index (Zaidi
 * 2017, individual data), 0.03 of the cephalic index and 0.04 of the ear's
 * ratio, and 0.045 of the ear's protrusion over its length (ANSUR II),
 * and 0.036 of the lower vermilion over the mouth's width (the root mean
 * square of the samples' ratio deviations below, by the delta method).
 */
export const FACE_UNSEEN_INDICES: readonly IFaceUnseenIndex[] = [
  {
    id: "eLineUpper",
    norm: "eLineUpper",
    definition: "ls' to the E-line (prn-pog'), positive in front",
    channels: ["mouthForwardPosition"],
    resolution: 1e-5,
    spread: 0.002,
  },
  {
    id: "eLineLower",
    norm: "eLineLower",
    definition: "li' to the E-line (prn-pog'), positive in front",
    channels: ["lowerLipVolume"],
    resolution: 1e-5,
    spread: 0.002,
  },
  {
    id: "facialConvexity",
    norm: "facialConvexity",
    definition: "angle g-sn-pog'",
    channels: ["chinProjection"],
    resolution: 0.01,
    spread: 4,
  },
  {
    id: "nasofrontal",
    norm: "nasofrontal",
    definition: "angle between the forehead tangent and n-prn at n",
    channels: ["nasalRootProjection"],
    resolution: 0.01,
    spread: 7,
  },
  {
    id: "nasolabial",
    norm: "nasolabial",
    definition: "angle between the columella tangent and sn-ls at sn",
    channels: ["noseSeptumAngle"],
    resolution: 0.01,
    spread: 8,
  },
  {
    id: "nasalProtrusion",
    norm: "nasalProtrusion",
    definition: "sn-prn over n-sn",
    channels: ["noseDepth"],
    resolution: 1e-4,
    spread: 0.02,
  },
  {
    id: "cephalicIndex",
    norm: "cephalicIndex",
    definition: "eu-eu over g-op",
    channels: ["posteriorHeadDepth"],
    resolution: 1e-4,
    spread: 0.03,
  },
  {
    id: "earLengthLeft",
    norm: "earLength",
    definition: "left sa-sba over n-me",
    channels: ["leftEarScale"],
    resolution: 1e-4,
    spread: 0.04,
  },
  {
    id: "earLengthRight",
    norm: "earLength",
    definition: "right sa-sba over n-me",
    channels: ["rightEarScale"],
    resolution: 1e-4,
    spread: 0.04,
  },
  {
    id: "earProtrusionLeft",
    norm: "earProtrusion",
    definition: "left ear's lateral point to the head behind it, over sa-sba",
    channels: ["leftEarFlap"],
    resolution: 1e-4,
    spread: 0.045,
  },
  {
    id: "earProtrusionRight",
    norm: "earProtrusion",
    definition: "right ear's lateral point to the head behind it, over sa-sba",
    channels: ["rightEarFlap"],
    resolution: 1e-4,
    spread: 0.045,
  },
  {
    id: "lowerVermilion",
    norm: "lowerVermilion",
    definition: "sto-li over ch-ch at rest",
    channels: ["lowerVermilionHeight"],
    resolution: 1e-4,
    spread: 0.036,
    photographed: "lowerVermilion",
  },
];

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

/**
 * The parts of a basis surface the unseen readings are taken over, found
 * once on its neutral: each auricle (the flap its side's ear-shape targets,
 * `leftEarFlap`, `leftEarWing`, `leftEarLobe` and the right ones, move,
 * `faceAuricleVertices` at 1 cm), the head's skin within 3 cm of each
 * auricle's box, the auricle left out (the head behind the ear), and the
 * scalp (the vertices of its hair domains).
 */
export function faceUnseenParts(
  basis: IAutoMovieHumanFaceBasis,
  surface: IAutoMovieHumanFaceBasis["surfaces"][number],
): {
  auricles: { left: number[]; right: number[] };
  mastoids: { left: number[]; right: number[] };
  scalp: number[];
} {
  const P = surface.positions;
  const channels = new Map(basis.channels.map((one) => [one.id, one]));
  const sides = ["left", "right"] as const;
  const auricles = Object.fromEntries(
    sides.map((side) => [
      side,
      faceAuricleVertices({
        positions: P,
        indices: surface.indices,
        region: ["EarFlap", "EarWing", "EarLobe"].flatMap((name) => {
          const one = channels.get(`${side}${name}`);
          return one === undefined
            ? []
            : [one.positive, one.negative].flatMap((endpoint) =>
                (endpoint === null
                  ? []
                  : (surface.targets[endpoint] ?? [])
                ).filter((_, i) => i % 4 === 0),
              );
        }),
        thickness: 0.01,
      }),
    ]),
  ) as Record<"left" | "right", number[]>;
  const skin = new Set(
    surface.regions
      .filter((region) => region.id.endsWith("/skin"))
      .flatMap((region) => region.indices),
  );
  const mastoids = Object.fromEntries(
    sides.map((side) => {
      const auricle = new Set(auricles[side]);
      const box = [0, 1, 2].map((k) => {
        const along = auricles[side].map((v) => P[3 * v + k]!);
        return [Math.min(...along) - 0.03, Math.max(...along) + 0.03] as const;
      });
      return [
        side,
        [...skin].filter(
          (v) =>
            !auricle.has(v) &&
            box.every(
              ([lo, hi], k) => P[3 * v + k]! >= lo && P[3 * v + k]! <= hi,
            ),
        ),
      ];
    }),
  ) as Record<"left" | "right", number[]>;
  const scalp = [
    ...new Set(
      (surface.hairDomains ?? []).flatMap((domain) =>
        domain.triangles.flatMap((t) =>
          surface.indices.slice(3 * t, 3 * t + 3),
        ),
      ),
    ),
  ];
  return { auricles, mastoids, scalp };
}

/**
 * The triangles of a surface that reach within 5 mm of the midsagittal
 * plane, over which a profile is read.
 */
export function faceMidlineTriangles(
  positions: readonly number[],
  indices: readonly number[],
): number[] {
  const midline: number[] = [];
  for (let t = 0; t < indices.length; t += 3) {
    const triangle = indices.slice(t, t + 3);
    const xs = triangle.map((vertex) => positions[3 * vertex]!);
    if (Math.min(...xs) > 0.005 || Math.max(...xs) < -0.005) continue;
    midline.push(...triangle);
  }
  return midline;
}

/**
 * The unseen readings on a built skin, each null where the surface does not
 * show its landmarks. `stomion` and `inferius` are the vermilion seam's
 * upper and lower heights, `scalp` the vertices hair grows from, over which
 * the head's breadth is read, `auricles` each ear's vertices
 * (`faceAuricleVertices`) and `mastoids` the head's skin about each ear.
 */
export function measureFaceUnseen(props: {
  positions: readonly number[];
  indices: readonly number[];
  stomion: number;
  inferius: number;
  scalp: readonly number[];
  auricles: { left: readonly number[]; right: readonly number[] };
  mastoids: { left: readonly number[]; right: readonly number[] };
  step: number;
  /** The lips' region triangles, the skin's vertices and the contact pair. */
  lips?: {
    indices: readonly number[];
    skin: ReadonlySet<number>;
    contact: { upper: number; lower: number };
  };
}): Record<FaceUnseenReading, number | null> {
  const none = {
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
    lowerVermilion: null,
  };
  let base: ReturnType<typeof faceMidsagittalLandmarks>;
  try {
    base = faceMidsagittalLandmarks({
      positions: props.positions,
      indices: props.indices,
      stomion: props.stomion,
      nose: [props.stomion + 0.015, props.stomion + 0.05],
      chinDepth: 0.03,
      level: 0.2,
      step: props.step,
    });
  } catch {
    return none;
  }
  const segments = faceMidsagittalSection(props.positions, props.indices);
  const ys = segments.flatMap(([a, b]) => [a[0], b[0]]);
  const profile = faceMidsagittalProfile(
    segments,
    Math.max(...ys),
    Math.min(...ys),
    props.step,
  );
  const prn = base.pronasale;
  const sn = base.subnasale;
  const landmarks = faceProfileLandmarks({
    profile,
    pronasale: prn,
    subnasale: sn,
    stomion: props.stomion,
    inferius: props.inferius,
    menton: base.menton,
    root: 0.1,
  });
  const {
    labraleSuperius,
    supramentale,
    pogonion,
    nasion,
    forehead,
    glabella,
  } = landmarks;
  const angle = (
    a: FaceMidsagittalPoint,
    o: FaceMidsagittalPoint,
    b: FaceMidsagittalPoint,
  ) =>
    (Math.acos(
      Math.max(
        -1,
        Math.min(
          1,
          ((a[0] - o[0]) * (b[0] - o[0]) + (a[1] - o[1]) * (b[1] - o[1])) /
            Math.hypot(a[0] - o[0], a[1] - o[1]) /
            Math.hypot(b[0] - o[0], b[1] - o[1]),
        ),
      ),
    ) *
      180) /
    Math.PI;
  // The lips' most prominent points toward the E-line (Ricketts), each the
  // point of its lip standing furthest in front of the line.
  const ahead =
    pogonion === null
      ? null
      : (q: FaceMidsagittalPoint) =>
          ((q[1] - prn[1]) * (pogonion[0] - prn[0]) -
            (q[0] - prn[0]) * (pogonion[1] - prn[1])) /
          Math.hypot(pogonion[0] - prn[0], pogonion[1] - prn[1]) /
          Math.sign(pogonion[0] - prn[0]);
  // Each stretch holds the landmark that bounds it (subnasale, the fold,
  // pronasale), so none is empty.
  const most = (
    points: readonly FaceMidsagittalPoint[],
    score: (q: FaceMidsagittalPoint) => number,
  ) => points.reduce((a, b) => (score(b) > score(a) ? b : a));
  const upperLip = profile.filter(([y]) => y <= sn[0] && y > props.stomion);
  // A chin (and so an E-line) exists only below a fold.
  const eLine = (lip: readonly FaceMidsagittalPoint[]) =>
    ahead === null ? null : ahead(most(lip, ahead));
  // The nasolabial angle's arms run from subnasale along the columella's
  // tangent (the lowest line to the nose's underside) and to labrale
  // superius, which exists: subnasale always has a sample of the profile
  // below it above stomion.
  const columella = most(
    profile.filter(([y]) => y > sn[0] && y <= prn[0]),
    (q) => -Math.atan2(q[0] - sn[0], q[1] - sn[1]),
  );
  // Opisthocranion: the midline's most posterior point.
  const back = segments.flat().reduce((a, b) => (b[1] < a[1] ? b : a));
  const breadth =
    2 *
    Math.max(0, ...props.scalp.map((v) => Math.abs(props.positions[3 * v]!)));
  const height =
    nasion === null
      ? null
      : Math.hypot(nasion[0] - base.menton[0], nasion[1] - base.menton[1]);
  const ear = (vertices: readonly number[]) => {
    const length = faceAuricleLength(props.positions, vertices);
    return length === null || height === null ? null : length / height;
  };
  // The ear's most lateral point against the head behind it.
  const protrusion = (
    auricle: readonly number[],
    head: readonly number[],
  ): number | null => {
    const length = faceAuricleLength(props.positions, auricle);
    if (length === null) return null;
    const P = props.positions;
    const out = (v: number) => Math.abs(P[3 * v]!);
    const edge = auricle.reduce((a, b) => (out(b) > out(a) ? b : a));
    const back = Math.min(...auricle.map((v) => P[3 * v + 2]!));
    const behind = head.filter(
      (v) =>
        Math.abs(P[3 * v + 1]! - P[3 * edge + 1]!) <= 0.005 &&
        P[3 * v + 2]! <= back &&
        P[3 * v + 2]! >= back - 0.02,
    );
    if (behind.length === 0) return null;
    return (out(edge) - Math.max(...behind.map(out))) / length;
  };
  return {
    eLineUpper: eLine(upperLip),
    eLineLower: eLine(
      supramentale === null
        ? []
        : profile.filter(([y]) => y < props.inferius && y >= supramentale[0]),
    ),
    facialConvexity:
      glabella === null || pogonion === null
        ? null
        : angle(glabella, sn, pogonion),
    nasofrontal:
      forehead === null || nasion === null
        ? null
        : angle(forehead, nasion, prn),
    nasolabial: angle(columella, sn, labraleSuperius!),
    nasalProtrusion:
      nasion === null
        ? null
        : Math.hypot(prn[0] - sn[0], prn[1] - sn[1]) /
          Math.hypot(nasion[0] - sn[0], nasion[1] - sn[1]),
    cephalicIndex:
      glabella === null || breadth === 0
        ? null
        : breadth / Math.hypot(glabella[0] - back[0], glabella[1] - back[1]),
    earLengthLeft: ear(props.auricles.left),
    earLengthRight: ear(props.auricles.right),
    earProtrusionLeft: protrusion(props.auricles.left, props.mastoids.left),
    earProtrusionRight: protrusion(props.auricles.right, props.mastoids.right),
    lowerVermilion: ((): number | null => {
      if (props.lips === undefined) return null;
      try {
        return faceVermilionRatios({
          positions: props.positions,
          lips: props.lips.indices,
          skin: props.lips.skin,
          contact: props.lips.contact,
          depth: 0.004,
        }).lower;
      } catch {
        return null;
      }
    })(),
  };
}
