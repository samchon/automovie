import type { IAutoMovieHumanBodyMeasures } from "../IAutoMovieHumanBodyMeasures";
import type { AutoMovieHumanArmCurveSpec } from "../arm/AutoMovieHumanArmCurveSpec";
import { AutoMovieHumanSex } from "../../typings/AutoMovieHumanSex";
// For the later algorithmisation (the neck base's plan default): AutoMovieHumanTrunkNeckBasePlan.
import { AutoMovieHumanTrunkF1Lines } from "./AutoMovieHumanTrunkF1Lines";
import { AutoMovieHumanTrunkSegmentFrames } from "./AutoMovieHumanTrunkSegmentFrames";

type Vec3 = AutoMovieHumanArmCurveSpec.Vec3;

/**
 * L1 of the trunk (S00): the published trunk landmarks and measurement
 * levels, each in its own segment frame (`thorax` with origin IJ, `pelvis`
 * with origin at the hip-centre midpoint), calibration mm. A `point` is a
 * bony or skin point; a `level` is a horizontal plane written as its point
 * on the frame's Y axis, whose skin extent the view outlines own.
 *
 * Heights: ANSUR II (Gordon et al. 2014, `docs/sources/ansur-ii.md`) and
 * ANSUR 1988 lines on stature through `AutoMovieHumanBodyAnatomy`, or the
 * person's own inputs; xiphion by de Leva 1996 Table 4's SUPR-XYPH share of
 * SUPR-MIDH (`de-leva-1996.md`). Breadths: the person's biacromial breadth,
 * bust point width and neck base girth. Forward places that no input fixes
 * are recorded as gaps with their definitions and drawn as interims.
 *
 * f1-only mission (owner, 2026-11-08): the natural waist, omphalion and
 * buttock levels and the neck base (C7's depth behind IJ, the side neck
 * points' half breadth) are f1's authored coordinates
 * (`AutoMovieHumanTrunkF1Lines`), judged against her reference; the laws
 * they replace (the waist's surveyed share, ANSUR II mean stature fractions,
 * the neck base's isotropic plan) stay commented for the later
 * algorithmisation.
 */
export namespace AutoMovieHumanTrunkSpecLandmarks {
  /** One landmark. */
  export interface ILandmark {
    /** Landmark name. */
    name: string;

    /** `point` or `level`. */
    kind: "point" | "level";

    /** `thorax` or `pelvis`. */
    frame: string;

    /** Coordinates in that frame, calibration mm. */
    point: Vec3;

    /** Published definition the landmark satisfies. */
    definition: string;

    /** Basis of the placement. */
    source: AutoMovieHumanArmCurveSpec.ISource;
  }

  /** A landmark quantity whose definition needs an input the person does not supply. */
  export interface IGap {
    /** Quantity. */
    name: string;

    /** Its published definition. */
    definition: string;

    /** The input proposed to close it. */
    proposed: string;

    /** What stands in for it meanwhile. */
    interim: string;
  }

  /** Landmarks and gaps. */
  export interface IOutput {
    /** Every landmark, top to bottom. */
    list: ILandmark[];

    /** Recorded input gaps. */
    gaps: IGap[];
  }

  /** The neck base's placement relative to IJ (thorax frame). */
  export interface INeck {
    /** C7 behind IJ, horizontal, mm. */
    depth: number;

    /** The side neck points' half breadth, mm. */
    half: number;

    /** The side neck points' X relative to IJ, mm (negative behind). */
    forward: number;

    /** Basis of the placement. */
    basis: string;
  }

  /** de Leva 1996 Table 4: SUPR-XYPH over SUPR-MIDH, women / men (142.5 / 529.3, 170.7 / 531.9). */
  export const XIPHION_SHARE: readonly [number, number] = [142.5 / 529.3, 170.7 / 531.9];

  /** ANSUR II iliocristale height on stature, mm, women / men (`ansur-ii.md`, OLS on stature). */
  export const ILIOCRISTALE_ON_STATURE: readonly [readonly [number, number], readonly [number, number]] = [
    [-158.0, 0.7085],
    [-150.4, 0.6901],
  ];

  /** ANSUR II mean stature fractions, women / men: omphalion 0.602 / 0.602, buttock 0.512 / 0.506 (no published line on stature in the note). Not read while S00 is authored for f1. */
  export const FRACTION: Readonly<Record<"omphalion" | "buttock", readonly [number, number]>> = {
    omphalion: [0.602, 0.602],
    buttock: [0.512, 0.506],
  };

  /**
   * Build the landmarks from the frames and the measures. `neck` is the neck
   * base S00 records with its basis (`AutoMovieHumanTrunkViewCurves`, which
   * keeps the start value); absent, the start value: f1's authored neck base
   * (`AutoMovieHumanTrunkF1Lines.NECK`: C7 behind IJ, the side neck points'
   * half breadth, the side neck points at the neck's mid-depth).
   */
  export function create(frames: AutoMovieHumanTrunkSegmentFrames.IOutput, measures: IAutoMovieHumanBodyMeasures, crotch: number, neck?: INeck): IOutput {
    const k: 0 | 1 = measures.sex === AutoMovieHumanSex.Female ? 0 : 1;
    const S: number = measures.stature;
    const ij: number = frames.heights.suprasternale;
    const hip: number = frames.heights.hip;
    const T: (y: number) => number = (y: number): number => y - ij;
    const P: (y: number) => number = (y: number): number => y - hip;
    const rise: number = measures.cervicaleHeight - ij;
    // The neck base's start value: f1's authored C7 depth and side-neck-point half breadth. The plan law it
    // replaces, for the later algorithmisation: AutoMovieHumanTrunkNeckBasePlan.of(neckBaseCircumference, rise)
    // (depth its diameter, half its radius, the side neck points at -radius).
    const F: typeof AutoMovieHumanTrunkF1Lines = AutoMovieHumanTrunkF1Lines;
    const n: INeck = neck ?? { depth: -F.NECK.c7[0], half: F.NECK.half, forward: F.NECK.c7[0] / 2, basis: "start value: f1's authored neck base (AutoMovieHumanTrunkF1Lines.NECK)" };
    const neckDepth: number = n.depth;
    const half: number = measures.biacromialBreadth / 2;
    // The acromion stands behind IJ by the clavicle's resting retraction over
    // half the biacromial breadth (Ludewig 2009 Table I, 19.2 degrees).
    const setback: number = half * Math.tan(AutoMovieHumanTrunkSegmentFrames.CLAVICLE_RETRACTION);
    const xiphion: number = XIPHION_SHARE[k] * (ij - hip);
    const crest: number = ILIOCRISTALE_ON_STATURE[k][0] + ILIOCRISTALE_ON_STATURE[k][1] * S;

    const list: ILandmark[] = [
      { name: "C7", kind: "point", frame: "thorax", point: [-neckDepth, rise, 0], definition: "Cervicale: the most prominent point of the C7 spinous process (ANSUR II; ISB C7).", source: { kind: "derived", rule: `height by ANSUR II cervicale on stature; ${neckDepth.toFixed(1)} mm behind IJ (${n.basis})` } },
      { name: "side neck point.left", kind: "point", frame: "thorax", point: [n.forward, T(measures.sideNeckPointHeight), -n.half], definition: "ISO 8559-1 3.1.7: the side neck point at the anterior trapezius border on the neck base line.", source: { kind: "derived", rule: `height by ANSUR 1988 side neck height on stature; ${n.half.toFixed(1)} mm from the midline, ${n.forward.toFixed(1)} mm from IJ along X (${n.basis})` } },
      { name: "side neck point.right", kind: "point", frame: "thorax", point: [n.forward, T(measures.sideNeckPointHeight), n.half], definition: "ISO 8559-1 3.1.7 (mirror).", source: { kind: "derived", rule: "reflection z -> -z" } },
      // The acromion is a skin landmark (the most lateral point of the acromial process): f1's authored side
      // at the acromion height (AutoMovieHumanTrunkF1Lines.ACROMION_HALF, 170), on S00's skin; the biacromial
      // half breadth (186, a bony caliper breadth) only sets the clavicle's setback.
      { name: "acromion.left", kind: "point", frame: "thorax", point: [-setback, T(measures.acromialHeight), -AutoMovieHumanTrunkF1Lines.ACROMION_HALF], definition: "Acromion: the most lateral point of the acromial process at mid-shoulder, on the skin (ANSUR II).", source: { kind: "derived", rule: "ANSUR II acromial height on stature; f1's authored skin half breadth there (AutoMovieHumanTrunkF1Lines.ACROMION_HALF); setback by the clavicle's 19.2 degree retraction over the biacromial half breadth (Ludewig 2009)" } },
      { name: "acromion.right", kind: "point", frame: "thorax", point: [-setback, T(measures.acromialHeight), AutoMovieHumanTrunkF1Lines.ACROMION_HALF], definition: "Acromion (mirror).", source: { kind: "derived", rule: "reflection z -> -z" } },
      { name: "IJ", kind: "point", frame: "thorax", point: [0, 0, 0], definition: "Incisura jugularis, deepest point (ISB thorax origin); ANSUR suprasternale.", source: { kind: "input", field: "suprasternaleHeight" } },
      { name: "axilla", kind: "level", frame: "thorax", point: [0, T(measures.axillaHeight), 0], definition: "Axilla height (ANSUR II): the level of the posterior axillary fold's lower edge.", source: { kind: "derived", rule: "ANSUR II axilla height on stature" } },
      { name: "PX", kind: "point", frame: "thorax", point: [0, -xiphion, 0], definition: "Processus xiphoideus, the most caudal point of the sternum (ISB thorax).", source: { kind: "published", citation: "de Leva 1996 Table 4", detail: `SUPR-XYPH share ${XIPHION_SHARE[k].toFixed(4)} of SUPR-MIDH; forward place on the IJ vertical (gap)` } },
      { name: "T8", kind: "point", frame: "thorax", point: [-neckDepth, -xiphion, 0], definition: "Spinous process of T8 (ISB thorax).", source: { kind: "debt", reason: "height taken at PX and forward place at C7's; both are gaps (Cooperstein 2015 aligns T8 with the inferior scapular angle, no height law)" } },
      // The levels below are f1's authored coordinates (pelvis frame). The laws they replace, for the later
      // algorithmisation: the natural waist at P(measures.waistHeight) (ANSUR 1988 share 0.3564 of
      // trochanterion-to-cervicale), the omphalion and buttock at P(FRACTION.<level>[k] * S).
      { name: "natural waist", kind: "level", frame: "pelvis", point: [0, AutoMovieHumanTrunkF1Lines.LEVELS.waist, 0], definition: "Natural waist: horizontal least girth between rib and iliac crest (ANSUR 1988), the waist tape's site.", source: { kind: "derived", rule: "f1's authored level (AutoMovieHumanTrunkF1Lines.LEVELS.waist: her least girth)" } },
      { name: "omphalion", kind: "level", frame: "pelvis", point: [0, AutoMovieHumanTrunkF1Lines.LEVELS.omphalion, 0], definition: "Omphalion, the navel centre (ANSUR II).", source: { kind: "derived", rule: "f1's authored level (AutoMovieHumanTrunkF1Lines.LEVELS.omphalion)" } },
      { name: "iliocristale", kind: "level", frame: "pelvis", point: [0, P(crest), 0], definition: "Highest palpable point of the iliac crest (ANSUR II).", source: { kind: "published", citation: "ANSUR II", detail: "OLS on stature" } },
      { name: "hip centre.left", kind: "point", frame: "pelvis", point: frames.hips.left, definition: "Hip joint centre (femoral head centre), the pelvis port datum.", source: { kind: "published", citation: "de Leva 1996 Table 2; Hara et al. 2016", detail: "trochanterion plus 2.8 / 3.2 mm; 8 + 0.086 LL outside the ASIS midline" } },
      { name: "hip centre.right", kind: "point", frame: "pelvis", point: frames.hips.right, definition: "Hip joint centre (mirror).", source: { kind: "derived", rule: "reflection z -> -z" } },
      { name: "buttock", kind: "level", frame: "pelvis", point: [0, AutoMovieHumanTrunkF1Lines.LEVELS.buttock, 0], definition: "Buttock point: the posterior prominence, ISO 8559-1 5.3.13 hip girth site.", source: { kind: "derived", rule: "f1's authored level (AutoMovieHumanTrunkF1Lines.LEVELS.buttock: her maximum posterior protrusion)" } },
      { name: "crotch", kind: "level", frame: "pelvis", point: [0, P(crotch), 0], definition: "Crotch: the lower edge of the pubis (ANSUR II); inseam plus lateral malleolus height (ISO 8559-1 5.7.6).", source: { kind: "derived", rule: "inseam + ankle height inputs" } },
      { name: "gluteal fold", kind: "level", frame: "pelvis", point: [0, P(measures.glutealFurrowHeight), 0], definition: "Gluteal furrow height (ANSUR 1988): the lowest point of the gluteal fold.", source: { kind: "derived", rule: "ANSUR 1988 gluteal furrow on crotch height" } },
    ];
    const gaps: IGap[] = [
      { name: "neck base depth and breadth", definition: "IJ-C7 horizontal depth and side-neck-point breadth of the ISO 8559-1 5.3.3 loop", proposed: "neck base breadth (SNP to SNP) and IJ-C7 depth", interim: n.basis },
      { name: "sternal inclination", definition: "PX forward of IJ in standing", proposed: "xiphion depth or sternal angle", interim: "PX on the IJ vertical" },
      { name: "T8 height and depth", definition: "ISB T8 spinous process", proposed: "none: replace by the back profile's own landmarks", interim: "at PX height, on C7's vertical" },
    ];
    return { list, gaps };
  }

  /** The named landmark; throws on an unknown name. */
  export function get(output: IOutput, name: string): ILandmark {
    const found: ILandmark | undefined = output.list.find((l: ILandmark): boolean => l.name === name);
    if (found === undefined) throw new Error(`Unknown trunk landmark ${name}`);
    return found;
  }
}
