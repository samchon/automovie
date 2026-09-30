import type {
  AutoMovieHumanoidBone,
  IAutoMovieJointConstraint,
} from "@automovie/interface";

/**
 * One rig joint defined by two shape-dependent landmarks and a parent bone.
 *
 * Its rest frame uses the head-to-tail direction and a flexion reference in
 * the common right-handed Y-up, Z-forward frame, in metres. Clinical angles
 * and limits are degrees; the basis supplies measured rest signs and sourced ranges,
 * while `resolveHumanBodySkeleton` computes the current frame after shape
 * evaluation. The optional upper-arm goal is humerothoracic and is resolved
 * after girdle motion. A VRM bone name is an authoring slot, not evidence of
 * an internal bone surface or an independent scapular articulation.
 * In particular, a humerus head-to-elbow line does not settle the shaft's
 * own centre and orientation. In the University of Utah adult CT scapula and
 * humerus dataset (doi:10.5281/zenodo.19077748), the shaft-cylinder centres
 * of 169 complete humeri with no recorded pathology lie a median 4-5 mm off
 * that line. This population observation identifies a missing anatomical
 * frame; it is not a fixed sideways correction to apply to every arm.
 * The current MPFB study records its landmark and constraint sources in
 * `test/studies/human-body/connected-basis/joints-receipt.json`. Other bases
 * must carry their own source and valid range.
 * @author Samchon
 */
export interface IAutoMovieHumanBodyBasisJoint {
  /** Public rig bone driven by this joint. */
  bone: AutoMovieHumanoidBone;

  /** Parent slot, or null for the root (`hips`). */
  parent: AutoMovieHumanoidBone | null;

  /** Landmark ids of the joint centre and of the bone's distal end. */
  head: string;
  /** Landmark at the bone's distal end. */
  tail: string;

  /**
   * The reference direction for the bone frame's X axis, in the basis frame
   * of the neutral. The frame is Y along head to tail, X equal to `Y x F`
   * and Z equal to `X x Y`. Non-humeral joints use this frame for the
   * engine's flexion/abduction/twist axes; the upper arms use it only for
   * skin binding, while their clinical goal uses `shoulder` below.
   */
  reference: [number, number, number];

  /**
   * Landmark ids of two points the joint's flexion axis runs along, from the
   * first to the second, when that axis is fixed in the parent rather than
   * perpendicular to the bone: the hip flexes about the line through both
   * hip centres, which the thigh, leaning out at rest, is not perpendicular
   * to. The axis turns with the shape as the landmarks do, is read in the
   * bone's rest frame, and must lie within 60 degrees of the frame's X; the
   * abduction axis is then the frame's Z made perpendicular to it and the
   * twist axis the third of that orthonormal basis. Omitted, the joint
   * flexes about its frame's X.
   */
  flexionAxis?: [string, string];

  /**
   * Clinical sign of each non-humeral axis under that frame, measured at extraction:
   * flexion is +1 by construction; abduction is the sign that carries the
   * bone away from the midline (or toward the thumb at the wrist); twist is
   * the sign of external rotation. Null marks an axis the constraint holds
   * immobile. These become the bone's `IAutoMovieRestFrame` at pose time.
   */
  signs: {
    flexion: 1;
    abduction: 1 | -1 | null;
    twist: 1 | -1 | null;
  };

  /**
   * Clinical rest angle of each non-humeral axis in degrees, measured from
   * its anatomical zero. The upper arms hold these generic axes at zero;
   * their separate `shoulder.neutral` records the A-pose direction and
   * axial zero in the thorax's anatomical frame.
   */
  neutral: {
    flexion: number;
    abduction: number;
    twist: number;
  };

  /** Generic clinical range, or null for the root; all upper-arm generic axes are held. */
  constraint: IAutoMovieJointConstraint | null;

  /**
   * Spread this bone's axial twist along its skin, as a rig's twist joints
   * do. The bone's rotation relative to its parent is split into a swing
   * and a twist about its rest axis (its head to its one child joint's
   * head); a vertex it moves takes the swing whole and the twist in
   * proportion to where it lies along that axis, none at the head and all
   * of it at the child's head. Absent, the bone carries its skin rigidly.
   */
  distributeTwist?: boolean;

  /**
   * Humerothoracic authoring coordinates for an upper arm. Only the two
   * upper arms carry this field. Their generic Euler axes are held at zero;
   * the shoulder goal is resolved from the thorax after girdle coupling.
   */
  shoulder?: {
    coordinates: "thorax-tt";
    /** Anatomical A-pose direction and axial zero in thorax coordinates. */
    neutral: {
      plane: number;
      elevation: number;
      axialRotation: number;
    };
    /**
     * Total humerothoracic elevation and axial rotation in degrees, and the
     * plane-dependent reach (`humanBodyShoulderReaches`).
     */
    range: {
      elevation: { min: number; max: number };
      axialRotation: { min: number; max: number };
      /**
       * The humeral joint sinus as `[plane, maximum total elevation]` knots:
       * at least three, planes strictly increasing inside [-180, 180),
       * maxima in (0, `elevation.max`], linear between neighbours and
       * periodic across the -180/180 seam. A goal is admitted when its
       * elevation is at most the envelope at its plane; the overhead pole
       * is admitted when any knot reaches 180.
       */
      envelope: [number, number][];
    };
  };
}
