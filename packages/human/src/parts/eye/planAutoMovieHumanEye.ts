import { IAutoMovieHumanMeasurements } from "../../measure/IAutoMovieHumanMeasurements";
import { AutoMovieHumanVector } from "../../skeleton/AutoMovieHumanVector";
import { IAutoMovieHumanSkeleton } from "../../skeleton/IAutoMovieHumanSkeleton";
import { AUTOMOVIE_HUMAN_EYE } from "./AUTOMOVIE_HUMAN_EYE";

/**
 * Size one eyeball for a person and stand it on its eye bone.
 *
 * The globe is a slightly oblate ellipsoid of sclera with a smaller sphere of cornea set into its front, the construction Chen et al. (2016) describe from keratometry against a scleral radius near 12 mm:
 *
 * - The sclera's transverse and vertical semi-axes are half of {@link AUTOMOVIE_HUMAN_EYE}'s diameters; its front-to-back semi-axis is solved so that the corneal apex stands the measured axial length in front of the posterior pole, about 11 mm for an adult, because the axial length includes the corneal bulge.
 * - The cornea is a spherical cap of the measured corneal radius whose base circle is the limbus, the scleral parallel of the limbus diameter, so its height is r - √(r² - (d/2)²), 2.7 mm for an adult and the bulge that moves the upper lid as the eye turns.
 * - The iris is a plane one anterior chamber depth behind the corneal apex, opening on the pupil; the limbal wall joins its root to the limbus.
 *
 * A child's globe, limbus, chamber depth and pupil scale by its axial length over the adult's (see {@link AUTOMOVIE_HUMAN_EYE.growth}); the corneal radius stays, as keratometry barely changes after the first year, so a child's cornea bulges less.
 *
 * The eye bone turns the globe about its joint centre, the centre of rotation, and its tail is the corneal apex looking straight ahead, so the globe is placed with its apex on the tail: its geometric centre lies the bone length minus the apex's own depth in front of the joint, about a millimetre for an adult. The skeleton owns both points, which is what lets the head's lids, drawn on spheres about the same joint, meet the globe the eye module builds.
 *
 * @param props.measurements Resolved measurements of the person
 * @param props.skeleton The person's skeleton at rest
 * @param props.side Which eye
 * @returns The eye's dimensions in its own frame
 * @throws {Error} When the skeleton lacks the eye bone
 */
export function planAutoMovieHumanEye(props: {
  measurements: IAutoMovieHumanMeasurements;
  skeleton: IAutoMovieHumanSkeleton;
  side: "left" | "right";
}): planAutoMovieHumanEye.IPlan {
  const bone: "leftEye" | "rightEye" =
    props.side === "left" ? "leftEye" : "rightEye";
  const joint: IAutoMovieHumanSkeleton.IJoint | undefined =
    props.skeleton.joints.find(
      (j: IAutoMovieHumanSkeleton.IJoint): boolean => j.bone === bone,
    );
  if (joint === undefined) throw new Error(`the skeleton lacks ${bone}`);
  const E: typeof AUTOMOVIE_HUMAN_EYE = AUTOMOVIE_HUMAN_EYE;
  const axial: number = growAxialLength(
    props.measurements.identity.head.headCircumference,
  );
  const scale: number = axial / E.axial;
  const transverse: number = (scale * E.transverse) / 2;
  const vertical: number = (scale * E.vertical) / 2;
  const mean: number = (transverse + vertical) / 2;
  const limbus: number = (scale * E.limbus) / 2;
  const cornea: number = E.cornealRadius;
  const bulge: number = cornea - Math.sqrt(cornea * cornea - limbus * limbus);
  // the limbus parallel on an ellipse of mean radius `mean` and depth `depth` lies at depth·k
  const k: number = Math.sqrt(1 - (limbus / mean) ** 2);
  const depth: number = (axial - bulge) / (1 + k);
  const limbusZ: number = depth * k;
  const apex: number = limbusZ + bulge;
  const length: number = AutoMovieHumanVector.distance(
    joint.position,
    joint.tail,
  );
  return {
    bone,
    centre: joint.position,
    offset: length - apex,
    transverse,
    vertical,
    depth,
    limbus,
    limbusZ,
    cornea,
    corneaZ: apex - cornea,
    apex,
    iris: apex - scale * E.anteriorChamber,
    pupil: (scale * E.pupil) / 2,
    scale,
  };
}
export namespace planAutoMovieHumanEye {
  /**
   * One eye's dimensions, millimetres, in the eye's own frame: origin at the globe's geometric centre, +Z along the line of sight to the corneal apex, +X toward the person's left and +Y up, which at rest is the model frame translated.
   *
   * @author Samchon
   */
  export interface IPlan {
    /** The eye bone the globe rides. */
    bone: "leftEye" | "rightEye";

    /** The bone's joint centre, the centre of rotation, model frame. */
    centre: { x: number; y: number; z: number };

    /** How far the globe's geometric centre lies in front of the joint centre along the line of sight; negative behind it. */
    offset: number;

    /** Transverse semi-axis of the sclera, along X. */
    transverse: number;

    /** Vertical semi-axis of the sclera, along Y. */
    vertical: number;

    /** Front-to-back semi-axis of the sclera, along Z. */
    depth: number;

    /** Limbus radius, where cornea and sclera meet, before the transverse and vertical stretch. */
    limbus: number;

    /** Depth of the limbus plane in front of the centre. */
    limbusZ: number;

    /** Radius of the corneal sphere. */
    cornea: number;

    /** Depth of the corneal sphere's centre. */
    corneaZ: number;

    /** Depth of the corneal apex. */
    apex: number;

    /** Depth of the iris plane, one anterior chamber depth behind the apex. */
    iris: number;

    /** Pupil radius. */
    pupil: number;

    /** The child's axial length over the adult's; one for an adult. */
    scale: number;
  }
}

/**
 * Axial length for a head circumference, linear between {@link AUTOMOVIE_HUMAN_EYE.growth}'s samples and held beyond them.
 *
 * @param circumference Head circumference, millimetres
 * @returns Axial length, millimetres
 */
function growAxialLength(circumference: number): number {
  const xs: readonly number[] = AUTOMOVIE_HUMAN_EYE.growth.circumference;
  const ys: readonly number[] = AUTOMOVIE_HUMAN_EYE.growth.axial;
  if (circumference <= xs[0]!) return ys[0]!;
  for (let i: number = 1; i < xs.length; ++i)
    if (circumference <= xs[i]!) {
      const t: number = (circumference - xs[i - 1]!) / (xs[i]! - xs[i - 1]!);
      return ys[i - 1]! + t * (ys[i]! - ys[i - 1]!);
    }
  return ys[ys.length - 1]!;
}
