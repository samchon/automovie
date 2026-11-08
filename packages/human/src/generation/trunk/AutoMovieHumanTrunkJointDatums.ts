import type { IAutoMovieHumanBodyMeasures } from "../IAutoMovieHumanBodyMeasures";
import { AutoMovieHumanArmCurveSpec } from "../arm/AutoMovieHumanArmCurveSpec";
import { AutoMovieHumanArmBones } from "../arm/AutoMovieHumanArmBones";
import { AutoMovieHumanTrunkSegmentFrames } from "./AutoMovieHumanTrunkSegmentFrames";
import { AutoMovieHumanTrunkSpecLandmarks } from "./AutoMovieHumanTrunkSpecLandmarks";

type Vec3 = AutoMovieHumanArmCurveSpec.Vec3;
type ITransform = AutoMovieHumanArmCurveSpec.ITransform;

/**
 * The trunk's joint datums for its limb ports, owned once here and read by
 * the arm and the leg through these transforms: each limb's root frame (ISB
 * humerus at GH, ISB femur at the hip centre) written relative to the trunk
 * frame it hangs from, at the anatomical neutral (no joint rotation; a pose
 * composes its joint rotation after this transform).
 *
 * Shoulder: GH stands below the acromion by de Leva 1996 Table 2's
 * acromion-to-shoulder-centre offset, 0.1044 of the acromion-radiale length
 * along the hanging humerus (`AutoMovieHumanArmBones.ACROMION`, the arm's
 * own longitudinal law), and 12 mm anterior and 6 mm medial of the acromion
 * by Campbell et al. 2009's generic GH offset from the acromion (J Biomech
 * 42:1527-1532, male sample; the women's offset is an input gap). Humerus
 * axes at neutral are the thorax axes (ISB 2005 2.3.4 option 1: X forward,
 * Y from the elbow to GH, Z right).
 *
 * Hip: the femur frame (ISB 2002 2.3.2: origin the hip centre, Y from the
 * knee centre to the hip centre, Z right, X forward) at neutral takes the
 * pelvis axes; its origin is the hip centre of the pelvis frame.
 *
 * The thorax, and with it both shoulder ports, stands on the pelvis by the
 * measured chain of `AutoMovieHumanTrunkSegmentFrames` (2026-11-08): the
 * PSIS-level skin behind the hip centre (Hara et al. 2016's ASIS lead over
 * the hip centre; the hip centre at 0.36 of the ASIS-PSIS depth behind the
 * ASIS plane, CT of 19 women, JBJS Br 92-B Supp II; 10 mm skin, debt), VP
 * ahead of it by the circular-arc back line (Ohlendorf et al. 2023, Sci Rep
 * 13:873; Gray 1918's 28 : 18 column split; the posture inputs), IJ ahead of
 * VP by the neck-base girth circle, the acromion behind IJ by the clavicle's
 * 19.2 degree retraction (Ludewig et al. 2009). For f1 that puts the
 * acromion 49 mm and GH 37 mm behind the hip-centre vertical. It replaces
 * Kendall's ideal plumb line (acromion over the hip centre), a normative
 * ideal rather than a mean, which stood the back line about 50 mm too far
 * forward of the pelvis.
 */
export namespace AutoMovieHumanTrunkJointDatums {
  /** One limb port's datum. */
  export interface IPort {
    /** `left` or `right`. */
    side: "left" | "right";

    /** Trunk frame the limb root hangs from: `thorax` (shoulder) or `pelvis` (hip). */
    parent: "thorax" | "pelvis";

    /** The limb root frame (humerus at GH, femur at the hip centre) relative to that trunk frame at neutral. */
    relative: ITransform;

    /** The bony landmark the port is measured from, parent frame: the acromion or the hip centre. */
    landmark: Vec3;

    /** The same root frame composed into the world. */
    world: ITransform;
  }

  /** Every port with the frames and landmarks they were read from. */
  export interface IOutput {
    /** Trunk frames. */
    frames: AutoMovieHumanTrunkSegmentFrames.IOutput;

    /** Trunk landmarks. */
    landmarks: AutoMovieHumanTrunkSpecLandmarks.IOutput;

    /** Shoulder ports by side. */
    shoulders: Record<"left" | "right", IPort>;

    /** Hip ports by side. */
    hips: Record<"left" | "right", IPort>;
  }

  /**
   * Build the trunk frames, landmarks and all four limb ports from the
   * person's resolved measures: the one entry the arm and leg read.
   *
   * @param measures `AutoMovieHumanBodyAnatomy.resolve` of the person.
   * @param ankleHeight Lateral malleolus height input, calibration mm.
   * @param crotch Crotch height (inseam plus ankle height), calibration mm.
   */
  export function of(measures: IAutoMovieHumanBodyMeasures, ankleHeight: number, crotch: number): IOutput {
    const frames: AutoMovieHumanTrunkSegmentFrames.IOutput = AutoMovieHumanTrunkSegmentFrames.create(measures, ankleHeight);
    const landmarks: AutoMovieHumanTrunkSpecLandmarks.IOutput = AutoMovieHumanTrunkSpecLandmarks.create(frames, measures, crotch);
    return {
      frames,
      landmarks,
      shoulders: { left: shoulder(frames, landmarks, measures.upperArmLength, "left"), right: shoulder(frames, landmarks, measures.upperArmLength, "right") },
      hips: { left: hip(frames, "left"), right: hip(frames, "right") },
    };
  }

  /** Campbell et al. 2009 generic GH offset from the acromion: anterior and medial, mm. */
  export const GH_FROM_ACROMION: { anterior: number; medial: number } = { anterior: 12, medial: 6 };

  /**
   * The shoulder port of one side.
   *
   * @param frames The trunk frames.
   * @param landmarks The trunk landmarks (the acromia).
   * @param acromionRadiale The person's acromion-radiale length, calibration mm.
   * @param side Which shoulder.
   */
  export function shoulder(
    frames: AutoMovieHumanTrunkSegmentFrames.IOutput,
    landmarks: AutoMovieHumanTrunkSpecLandmarks.IOutput,
    acromionRadiale: number,
    side: "left" | "right",
  ): IPort {
    const acromion: Vec3 = AutoMovieHumanTrunkSpecLandmarks.get(landmarks, `acromion.${side}`).point;
    const outward: number = side === "right" ? 1 : -1;
    const gh: Vec3 = [
      acromion[0] + GH_FROM_ACROMION.anterior,
      acromion[1] - AutoMovieHumanArmBones.ACROMION * acromionRadiale,
      acromion[2] - outward * GH_FROM_ACROMION.medial,
    ];
    const relative: ITransform = { origin: gh, axes: AutoMovieHumanArmCurveSpec.IDENTITY.axes };
    return { side, parent: "thorax", relative, landmark: acromion, world: AutoMovieHumanArmCurveSpec.compose(frames.world("thorax"), relative) };
  }

  /**
   * The hip port of one side.
   *
   * @param frames The trunk frames.
   * @param side Which hip.
   */
  export function hip(frames: AutoMovieHumanTrunkSegmentFrames.IOutput, side: "left" | "right"): IPort {
    const centre: Vec3 = frames.hips[side];
    const relative: ITransform = { origin: centre, axes: AutoMovieHumanArmCurveSpec.IDENTITY.axes };
    return { side, parent: "pelvis", relative, landmark: centre, world: AutoMovieHumanArmCurveSpec.compose(frames.world("pelvis"), relative) };
  }
}
