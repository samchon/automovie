import type { IAutoMovieHumanBodyMeasures } from "../IAutoMovieHumanBodyMeasures";
import { AutoMovieHumanArmCurveSpec } from "../arm/AutoMovieHumanArmCurveSpec";
// For the later algorithmisation (the measured chain below): AutoMovieHumanBackProfile, AutoMovieHumanTrunkNeckBasePlan.
import { AutoMovieHumanBodyAnatomy } from "../AutoMovieHumanBodyAnatomy";
import { AutoMovieHumanSex } from "../../typings/AutoMovieHumanSex";
import { AutoMovieHumanTrunkF1Lines } from "./AutoMovieHumanTrunkF1Lines";

type Vec3 = AutoMovieHumanArmCurveSpec.Vec3;
type ITransform = AutoMovieHumanArmCurveSpec.ITransform;
type IFrame = AutoMovieHumanArmCurveSpec.ISegmentFrame;

/**
 * L0 of the trunk (S00): the pelvis and thorax segment frames, each a rigid
 * transform relative to its parent, with the joint centres the trunk's ports
 * are built on. World: +X anterior, +Y up, +Z the subject's right, origin on
 * the floor plane under the hip-joint-centre midpoint, calibration mm.
 *
 * Pelvis (Wu et al. 2002, J Biomech 35:543-548, 2.3.1, "pelvic coordinate
 * system"): Z parallel to the line between the anterior superior iliac
 * spines, pointing right; X in the plane of both ASIS and the PSIS midpoint,
 * orthogonal to Z, pointing anteriorly; Y orthogonal to both, cranial. ISB
 * puts the origin at the hip centre of the side studied; the trunk's pelvis
 * frame takes the midpoint of both hip centres (de Leva's MIDH), so each ISB
 * per-side pelvis frame is this one translated half the hip-centre
 * separation along Z. The ASIS-PSIS plane's tilt in standing needs the ASIS
 * and PSIS heights, which no input supplies (input gap): the axes stand
 * parallel to the world's.
 *
 * Hip centres (the pelvis ports' datums): height at ANSUR II trochanterion
 * height on stature (Gordon et al. 2014, `docs/sources/ansur-ii.md`) plus de
 * Leva 1996 Table 2's 2.8 mm (women) / 3.2 mm (men) proximal offset
 * (`de-leva-1996.md`); lateral by Hara et al. 2016's `Y = 8 + 0.086 LL`
 * outside the ASIS midline (`hara-2016.md`), `LL` the ASIS-to-malleolus
 * length, read as the vertical drop from the ASIS (Hara's `Z = -9 - 0.078
 * LL` above the hip centre) to the lateral malleolus height input.
 *
 * Thorax (Wu et al. 2005, J Biomech 38:981-992, 2.3.1): origin IJ (deepest
 * point of the incisura jugularis); Y from the PX/T8 midpoint to the IJ/C7
 * midpoint, up; Z normal to the plane of IJ, C7 and that midpoint, right; X
 * forward. f1-only mission (owner, 2026-11-08): IJ stands at f1's
 * suprasternale height (her measured input) and forward of the hip centres
 * by the authored coordinate `AutoMovieHumanTrunkF1Lines.IJ` (judged against
 * her registered notch). The measured chain it replaces, kept for the later
 * algorithmisation:
 * 1. the ASIS midpoint stands `0.063 LL - 11` mm ahead of the hip centre
 *    (Hara et al. 2016), and the hip centre lies {@link HIP_DEPTH_SHARE} of
 *    the ASIS-PSIS depth behind the ASIS plane (CT, women), so the PSIS stand
 *    `lead (1 / share - 1)` behind the hip centre; the skin over them
 *    {@link PSIS_SKIN} further back;
 * 2. VP stands ahead of that PSIS-level skin by the circular-arc back line
 *    (`AutoMovieHumanBackProfile`: Ohlendorf 2023, Gray 28 : 18, the posture
 *    inputs);
 * 3. IJ stands ahead of VP by the neck-base loop's plan depth
 *    (`AutoMovieHumanTrunkNeckBasePlan`).
 * That chain placed f1's IJ at X 16.4 (the authored 16.5 agrees: the
 * registered reference's PSIS-level back stood within 0.7 mm of the chain's).
 * The acromion stands behind IJ by the clavicle's resting retraction
 * (Ludewig et al. 2009 Table I, 19.2 degrees, `ludewig-2009-shoulder-complex.md`)
 * over half the biacromial breadth. The sternoclavicular joints' lateral
 * offset from IJ is an input gap (taking it zero lengthens the setback by
 * about 5 mm). The thoracic inclination of Y (from PX/T8 heights and depths)
 * is an input gap, so the thorax axes stand parallel to the pelvis's.
 */
export namespace AutoMovieHumanTrunkSegmentFrames {
  /** The frames, joint centres and the heights they were placed from. */
  export interface IOutput {
    /** Pelvis frame: root, placed in the world at the hip-centre midpoint. */
    pelvis: IFrame;

    /** Thorax frame, parent pelvis. */
    thorax: IFrame;

    /** Hip joint centres in the pelvis frame, calibration mm. */
    hips: { left: Vec3; right: Vec3 };

    /** World heights the frames stand on, calibration mm: the hip centres, IJ, C7, the acromia, and the ASIS by Hara's drop above the hip centre. */
    heights: Record<"hip" | "suprasternale" | "cervicale" | "acromion" | "asis", number>;

    /** Recorded input gaps of the frames. */
    gaps: IGap[];

    /** Compose a named frame into the world. */
    world(name: string): ITransform;
  }

  /** A frame quantity whose published definition needs an input the person does not supply. */
  export interface IGap {
    /** Quantity. */
    name: string;

    /** Its published definition. */
    definition: string;

    /** What stands in for it. */
    interim: string;
  }

  /** de Leva 1996 Table 2: hip joint centre above trochanterion, mm, women / men. */
  export const HIP_OVER_TROCHANTERION: readonly [number, number] = [2.8, 3.2];

  /** Hara et al. 2016: hip centre outside the ASIS midline, `8 + 0.086 LL`, mm. */
  export const HARA_LATERAL: readonly [number, number] = [8, 0.086];

  /** Hara et al. 2016: hip centre below the ASIS, `9 + 0.078 LL`, mm. */
  export const HARA_DROP: readonly [number, number] = [9, 0.078];

  /** Hara et al. 2016: hip centre behind the ASIS midpoint, `-(11 - 0.063 LL)` along X, so the ASIS midpoint stands `0.063 LL - 11` mm ahead of the hip centre. */
  export const HARA_FORWARD: readonly [number, number] = [11, 0.063];

  /** Ludewig et al. 2009 Table I: sternoclavicular retraction at rest, radians (19.2 degrees). */
  export const CLAVICLE_RETRACTION: number = (19.2 * Math.PI) / 180;

  /**
   * The hip centre's posterior offset from the ASIS plane as a share of the
   * pelvic depth (ASIS to PSIS), women: 0.36 +- 0.017 (CT of 37 normal hips,
   * 19 female; J Bone Joint Surg Br 92-B Supp II, 0301-620X.92BSUPP_II.0920296,
   * read through its abstract: debt). Not read while S00 is authored for f1.
   */
  export const HIP_DEPTH_SHARE: number = 0.36;

  /** Skin over the posterior superior iliac spines, mm (debt: no published thickness read; the dimples tether thin skin to the spines). Not read while S00 is authored for f1. */
  export const PSIS_SKIN: number = 10;

  /** Build the frames from the person's resolved measures. */
  export function create(measures: IAutoMovieHumanBodyMeasures, ankleHeight: number): IOutput {
    const S: typeof AutoMovieHumanArmCurveSpec = AutoMovieHumanArmCurveSpec;
    const k: 0 | 1 = measures.sex === AutoMovieHumanSex.Female ? 0 : 1;
    const fit: AutoMovieHumanBodyAnatomy.ILine = AutoMovieHumanBodyAnatomy.TROCHANTERION_HEIGHT_ON_STATURE[k];

    // Hip centres: trochanterion plus de Leva's offset; Hara's lateral place.
    const hipY: number = fit.a + fit.b * measures.stature + HIP_OVER_TROCHANTERION[k];
    const length: number = (hipY + HARA_DROP[0] - ankleHeight) / (1 - HARA_DROP[1]);
    const hipZ: number = HARA_LATERAL[0] + HARA_LATERAL[1] * length;

    // Thorax origin IJ: f1's authored forward place (AutoMovieHumanTrunkF1Lines.IJ, pelvis frame) at her
    // measured suprasternale height. The measured chain it replaces, for the later algorithmisation:
    //   const asisLead = HARA_FORWARD[1] * length - HARA_FORWARD[0];
    //   const psis = -(asisLead / HIP_DEPTH_SHARE - asisLead) - PSIS_SKIN;
    //   const vp = psis - AutoMovieHumanBackProfile.of(measures).knots.find(psis knot).x;
    //   const ij = [vp + AutoMovieHumanTrunkNeckBasePlan.of(neckBaseCircumference, cervicale - suprasternale).depth, ...];
    const ij: Vec3 = [AutoMovieHumanTrunkF1Lines.IJ[0], measures.suprasternaleHeight - hipY, 0];

    const pelvis: IFrame = {
      name: "pelvis",
      parent: null,
      basis: { kind: "published", citation: "Wu et al. 2002, J Biomech 35:543-548, 2.3.1", detail: "ISB pelvic axes (Z along ASIS-ASIS right, X anterior in the ASIS-PSIS plane, Y cranial); origin at the hip-centre midpoint (de Leva MIDH); standing pelvic tilt is an input gap, axes parallel to the world." },
      relative: { origin: [0, hipY, 0], axes: S.IDENTITY.axes },
    };
    const thorax: IFrame = {
      name: "thorax",
      parent: "pelvis",
      basis: { kind: "published", citation: "Wu et al. 2005, J Biomech 38:981-992, 2.3.1", detail: "Origin IJ at f1's suprasternale height; forward place the authored f1 coordinate (AutoMovieHumanTrunkF1Lines.IJ, judged against her registered notch); thoracic inclination is an input gap, axes parallel to the pelvis." },
      relative: { origin: ij, axes: S.IDENTITY.axes },
    };
    const frames: Map<string, IFrame> = new Map([
      [pelvis.name, pelvis],
      [thorax.name, thorax],
    ]);
    const gaps: IGap[] = [
      { name: "pelvic tilt", definition: "ISB pelvis X lies in the plane of both ASIS and the PSIS midpoint; its standing tilt follows from the ASIS and PSIS heights and depth", interim: "zero: pelvis axes parallel to the world" },
      { name: "thoracic inclination", definition: "ISB thorax Y from the PX/T8 midpoint to the IJ/C7 midpoint", interim: "zero: thorax axes parallel to the pelvis" },
      { name: "sternoclavicular offset", definition: "lateral distance from IJ to each sternoclavicular joint, where the clavicle's retraction turns", interim: "zero: the retraction turns at IJ" },
      { name: "ASIS-to-malleolus length", definition: "Hara 2016 LL, ASIS to medial malleolus through the medial femoral epicondyle", interim: "vertical drop from the ASIS (Hara's own drop above the hip centre) to the lateral malleolus height input" },
    ];
    return {
      pelvis,
      thorax,
      hips: { left: [0, 0, -hipZ], right: [0, 0, hipZ] },
      heights: { hip: hipY, suprasternale: measures.suprasternaleHeight, cervicale: measures.cervicaleHeight, acromion: measures.acromialHeight, asis: hipY + HARA_DROP[0] + HARA_DROP[1] * length },
      gaps,
      world(name: string): ITransform {
        const frame: IFrame | undefined = frames.get(name);
        if (frame === undefined) throw new Error(`Unknown trunk frame ${name}`);
        return frame.parent === null ? frame.relative : S.compose(this.world(frame.parent), frame.relative);
      },
    };
  }
}
