import type { IAutoMovieHumanParameters } from "../structures/IAutoMovieHumanParameters";
import type { IAutoMovieHumanEar } from "../structures/head/IAutoMovieHumanEar";
import type { IAutoMovieHumanEye } from "../structures/head/IAutoMovieHumanEye";
import type { IAutoMovieHumanHeadIdentity } from "../structures/head/IAutoMovieHumanHeadIdentity";
import { AutoMovieHumanSex } from "../typings/AutoMovieHumanSex";
import { AutoMovieHumanBodyAnatomy } from "./AutoMovieHumanBodyAnatomy";
import type { IAutoMovieHumanBodyMeasures } from "./IAutoMovieHumanBodyMeasures";

/**
 * The head's measures, each the person's own or the adult survey default of
 * the person's sex and stature.
 *
 * A vault dimension follows stature by ANSUR II's lines (head length, breadth
 * and circumference, bizygomatic breadth); a facial distance takes the 3D
 * Facial Norms adult mean of its sex (Weinberg et al. 2016, ages 20 to 40
 * pooled, `docs/sources/weinberg-2016-3d-facial-norms.md`), the eye's height
 * the Caucasian adults of Gao et al. 2025, the jaw's range of motion the
 * 18-year values of Verkouteren et al. 2022, the auricle the Korean adults of
 * Cho et al. 2025, and head height stature over 8.0, the late-adolescent
 * ratio of Snyder et al. 1977 that the field documents. Facial distances
 * follow stature too weakly in these surveys (R2 0.02 to 0.14) for a line to
 * carry more than the sex's mean.
 */
export namespace AutoMovieHumanHeadAnatomy {
  /** A record in which every measure, at any depth, may be omitted. */
  export type Partially<T> = { [K in keyof T]?: T[K] extends number ? T[K] : Partially<T[K]> };

  /** A head input in which every measure may be omitted. */
  export type IInput = Partially<IAutoMovieHumanHeadIdentity>;

  /**
   * Every head measure of a person, supplied or derived.
   *
   * @param params Public input.
   * @returns The complete head identity, millimetres and the dimensionless index.
   */
  export function resolve(params: IAutoMovieHumanParameters): IAutoMovieHumanHeadIdentity {
    const body: IAutoMovieHumanBodyMeasures = AutoMovieHumanBodyAnatomy.resolve(params);
    const k: 0 | 1 = body.sex === AutoMovieHumanSex.Female ? 0 : 1;
    const S: number = body.stature;
    const given: IInput = params.head ?? {};
    const of = (pair: readonly [number, number]): number => pair[k];
    const line = (fit: readonly [AutoMovieHumanBodyAnatomy.ILine, AutoMovieHumanBodyAnatomy.ILine]): number => fit[k].a + fit[k].b * S;
    const length: number = given.length ?? line(HEAD_LENGTH_ON_STATURE);
    const eye = (side: Partial<IAutoMovieHumanEye> | undefined): IAutoMovieHumanEye => ({
      palpebralFissureLength: side?.palpebralFissureLength ?? of(FACE.palpebralFissureLength),
      palpebralFissureHeight: side?.palpebralFissureHeight ?? of(FACE.palpebralFissureHeight),
    });
    const ear = (side: Partial<IAutoMovieHumanEar> | undefined): IAutoMovieHumanEar => ({
      length: side?.length ?? of(EAR.length),
      breadth: side?.breadth ?? of(EAR.breadth),
      protrusion: side?.protrusion ?? of(EAR.protrusion),
    });
    return {
      length,
      cephalicIndex: given.cephalicIndex ?? (100 * line(HEAD_BREADTH_ON_STATURE)) / length,
      circumference: given.circumference ?? line(HEAD_CIRCUMFERENCE_ON_STATURE),
      height: given.height ?? S / STATURE_OVER_HEAD_HEIGHT,
      faceHeight: given.faceHeight ?? of(FACE.faceHeight),
      faceWidth: given.faceWidth ?? line(FACE_WIDTH_ON_STATURE),
      mandibularWidth: given.mandibularWidth ?? of(FACE.mandibularWidth),
      minimumFrontalWidth: given.minimumFrontalWidth ?? of(FACE.minimumFrontalWidth),
      mouthOpening: given.mouthOpening ?? of(FACE.mouthOpening),
      mandibularLaterotrusion: given.mandibularLaterotrusion ?? of(FACE.mandibularLaterotrusion),
      // The person's own measured face inputs pass through when given; absent, each reader keeps its documented default law.
      ...(given.bitragionMentonArc !== undefined ? { bitragionMentonArc: Number(given.bitragionMentonArc) } : {}),
      ...(given.bitragionSubnasaleArc !== undefined ? { bitragionSubnasaleArc: Number(given.bitragionSubnasaleArc) } : {}),
      ...(given.submentalInclination !== undefined ? { submentalInclination: Number(given.submentalInclination) } : {}),
      ...(given.subnasaleAheadOfGlabella !== undefined ? { subnasaleAheadOfGlabella: Number(given.subnasaleAheadOfGlabella) } : {}),
      ...(given.glabellaAheadOfNasion !== undefined ? { glabellaAheadOfNasion: Number(given.glabellaAheadOfNasion) } : {}),
      ...(given.glabellaAboveNasion !== undefined ? { glabellaAboveNasion: Number(given.glabellaAboveNasion) } : {}),
      ...(given.pogonionAheadOfGlabella !== undefined ? { pogonionAheadOfGlabella: Number(given.pogonionAheadOfGlabella) } : {}),
      ...(given.pogonionAboveMenton !== undefined ? { pogonionAboveMenton: Number(given.pogonionAboveMenton) } : {}),
      ...(given.tragionNasionDepth !== undefined ? { tragionNasionDepth: Number(given.tragionNasionDepth) } : {}),
      ...(given.tragionSubnasaleDepth !== undefined ? { tragionSubnasaleDepth: Number(given.tragionSubnasaleDepth) } : {}),
      ...(given.tragionGnathionDepth !== undefined ? { tragionGnathionDepth: Number(given.tragionGnathionDepth) } : {}),
      ...(given.upperLipProtrusion !== undefined ? { upperLipProtrusion: Number(given.upperLipProtrusion) } : {}),
      ...(given.lowerLipProtrusion !== undefined ? { lowerLipProtrusion: Number(given.lowerLipProtrusion) } : {}),
      ...(given.bitragionBreadth !== undefined ? { bitragionBreadth: Number(given.bitragionBreadth) } : {}),
      ...(given.nasalBridgeLength !== undefined ? { nasalBridgeLength: Number(given.nasalBridgeLength) } : {}),
      ...(given.tragionTopOfHead !== undefined ? { tragionTopOfHead: Number(given.tragionTopOfHead) } : {}),
      ...(given.upperFacialHeight !== undefined ? { upperFacialHeight: Number(given.upperFacialHeight) } : {}),
      ...(given.upperLipHeight !== undefined ? { upperLipHeight: Number(given.upperLipHeight) } : {}),
      ...(given.bitragionCoronalArc !== undefined ? { bitragionCoronalArc: Number(given.bitragionCoronalArc) } : {}),
      ...(given.cervicalArrowApexBehindTragion !== undefined ? { cervicalArrowApexBehindTragion: Number(given.cervicalArrowApexBehindTragion) } : {}),
      ...(given.cervicalArrowApexBelowTragion !== undefined ? { cervicalArrowApexBelowTragion: Number(given.cervicalArrowApexBelowTragion) } : {}),
      face: {
        eyePair: { left: eye(given.face?.eyePair?.left), right: eye(given.face?.eyePair?.right) },
        intercanthalWidth: given.face?.intercanthalWidth ?? of(FACE.intercanthalWidth),
        nose: {
          width: given.face?.nose?.width ?? of(FACE.noseWidth),
          height: given.face?.nose?.height ?? of(FACE.noseHeight),
          protrusion: given.face?.nose?.protrusion ?? of(FACE.noseProtrusion),
        },
        mouth: {
          width: given.face?.mouth?.width ?? of(FACE.mouthWidth),
          upperVermilionHeight: given.face?.mouth?.upperVermilionHeight ?? of(FACE.upperVermilionHeight),
          lowerVermilionHeight: given.face?.mouth?.lowerVermilionHeight ?? of(FACE.lowerVermilionHeight),
        },
      },
      earPair: { left: ear(given.earPair?.left), right: ear(given.earPair?.right) },
    };
  }

  /** Head length g-op on stature, mm; ANSUR II, women then men. */
  export const HEAD_LENGTH_ON_STATURE: readonly [AutoMovieHumanBodyAnatomy.ILine, AutoMovieHumanBodyAnatomy.ILine] = [
    { a: 122.19, b: 0.0415 },
    { a: 133.08, b: 0.0378 },
  ];

  /** Head breadth eu-eu on stature, mm; ANSUR II. */
  export const HEAD_BREADTH_ON_STATURE: readonly [AutoMovieHumanBodyAnatomy.ILine, AutoMovieHumanBodyAnatomy.ILine] = [
    { a: 127.19, b: 0.0126 },
    { a: 143.69, b: 0.0061 },
  ];

  /** Head circumference on stature, mm; ANSUR II. */
  export const HEAD_CIRCUMFERENCE_ON_STATURE: readonly [AutoMovieHumanBodyAnatomy.ILine, AutoMovieHumanBodyAnatomy.ILine] = [
    { a: 406.66, b: 0.0948 },
    { a: 433.53, b: 0.0802 },
  ];

  /** Bizygomatic breadth zy-zy on stature, mm; ANSUR II. */
  export const FACE_WIDTH_ON_STATURE: readonly [AutoMovieHumanBodyAnatomy.ILine, AutoMovieHumanBodyAnatomy.ILine] = [
    { a: 107.09, b: 0.0164 },
    { a: 120.01, b: 0.0129 },
  ];

  /** Stature over menton-vertex head height in late adolescence (Snyder et al. 1977, UM-HSRI-77-17). */
  export const STATURE_OVER_HEAD_HEIGHT: number = 8.0;

  /** A head measure that defaults to its sex's adult mean. */
  export type FaceMean =
    | "faceHeight"
    | "mandibularWidth"
    | "minimumFrontalWidth"
    | "mouthOpening"
    | "mandibularLaterotrusion"
    | "palpebralFissureLength"
    | "palpebralFissureHeight"
    | "intercanthalWidth"
    | "noseWidth"
    | "noseHeight"
    | "noseProtrusion"
    | "mouthWidth"
    | "upperVermilionHeight"
    | "lowerVermilionHeight";

  /** Adult means by sex, women then men, mm. */
  export const FACE: Readonly<Record<FaceMean, readonly [number, number]>> = {
    /** Morphological face height n-gn; Weinberg 2016: 118.6 (6.1) and 127.2 (6.6). */
    faceHeight: [118.6, 127.2],

    /** Mandibular width go-go; Weinberg 2016: 97.0 (7.0) and 104.5 (7.5). */
    mandibularWidth: [97.0, 104.5],

    /** Minimum frontal width ft-ft; Weinberg 2016: 105.5 (8.0) and 111.4 (9.1). */
    minimumFrontalWidth: [105.5, 111.4],

    /** Active maximum mouth opening at 18 years; Verkouteren 2022: 50.5 and 55.3. */
    mouthOpening: [50.5, 55.3],

    /** Lateral excursion of the lower incisors at 18 years; Verkouteren 2022: 10.3 and 10.4. */
    mandibularLaterotrusion: [10.3, 10.4],

    /** Palpebral fissure length en-ex; Weinberg 2016: 27.8 (2.0) and 28.8 (1.9). */
    palpebralFissureLength: [27.8, 28.8],

    /** Palpebral fissure height at the pupil; Gao 2025, Caucasian adults: 11.63 (1.04) and 11.61 (1.02). */
    palpebralFissureHeight: [11.63, 11.61],

    /** Intercanthal width en-en; Weinberg 2016: 31.3 (2.8) and 32.7 (3.0). */
    intercanthalWidth: [31.3, 32.7],

    /** Nasal width al-al; Weinberg 2016: 32.6 (2.3) and 36.1 (2.6). */
    noseWidth: [32.6, 36.1],

    /** Nasal height n-sn; Weinberg 2016: 54.7 (3.9) and 56.6 (3.9). */
    noseHeight: [54.7, 56.6],

    /** Nasal protrusion sn-prn; Weinberg 2016: 20.2 (1.9) and 21.0 (2.0). */
    noseProtrusion: [20.2, 21.0],

    /** Labial fissure width ch-ch; Weinberg 2016: 48.1 (3.5) and 50.9 (3.8). */
    mouthWidth: [48.1, 50.9],

    /** Upper vermilion height ls-sto; Weinberg 2016: 7.4 (1.4) and 7.5 (1.7). */
    upperVermilionHeight: [7.4, 7.5],

    /** Lower vermilion height sto-li; Weinberg 2016: 8.5 (1.9) and 8.7 (2.3). */
    lowerVermilionHeight: [8.5, 8.7],
  };

  /** Auricle means by sex, mm; Cho et al. 2025, both sides averaged: length, breadth and protrusion at the tragal level. */
  export const EAR: Readonly<Record<keyof IAutoMovieHumanEar, readonly [number, number]>> = {
    length: [64.5, 67.0],
    breadth: [27.4, 29.05],
    protrusion: [17.3, 19.5],
  };
}
