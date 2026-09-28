import type { AutoMovieHumanoidBone } from "@automovie/interface";

/**
 * Declared joint couplings: one joint's motion adding a bounded angle to
 * another joint's clinical axis, applied by the builder to the document's
 * pose before that pose is validated and resolved
 * (`resolveHumanBodyCouplings`). The upper arm supplies a total
 * humerothoracic TT elevation, while its parent girdle can also move. The
 * builder solves the humeral child after the girdle moves so the coupled
 * contribution does not add to the authored total. The intended data is
 * the scapulohumeral rhythm:
 * Inman, Saunders and Abbott 1944 (J Bone Joint Surg 26:1) measured
 * glenohumeral to scapulothoracic motion at about 2:1 past 30 degrees of
 * elevation, and Ludewig et al. 2009 (J Bone Joint Surg Am 91:378) put the
 * clavicle at about 11 degrees of elevation and 16 degrees of retraction at
 * full arm elevation; a basis that declares the rhythm carries those
 * figures as curves from each upper arm's elevation to its girdle bone's
 * abduction and flexion, and a basis that declares nothing poses exactly
 * as before.
 *
 * The current r16 basis drives a public girdle slot with this relation. It
 * has no independent scapular bone or scapulothoracic joint, and its shoulder
 * skin weights do not establish scapular motion. This authored coupling is a
 * rig approximation, not a verified model of the four scapulothoracic degrees
 * of freedom measured by Seth et al. 2016. The anatomy and GPU limitations
 * are recorded in the body atlas and anatomical-layers studies.
 * The connected study's `couplings-receipt.json` records its actual curves;
 * those authored knots are not replacement measurements of scapular motion.
 *
 * A coupling is a declared driver in the sense of the rig control driver
 * requirement rather than a hidden corrective: its input, output, bounded
 * function and range are data of the basis, the builder applies it in a
 * stated order, the editor shows the addition beside the joint row, and the
 * document never stores it. For a TT shoulder source, `source.measure` is
 * the document's total `shoulders[].elevation`, or the measured A-pose
 * elevation when omitted. For a non-humeral source it retains the engine's
 * `swingConeAngle` of the clinical flexion and abduction. The curve is
 * piecewise linear over
 * `[elevation, degrees]` knots: zero at and below the first knot, linear
 * between knots, the last ordinate held past the last knot; a shipped
 * shoulder curve therefore starts at the rest elevation, approximating
 * Inman's 30 degree onset as zero up to it. The ordinate is added to the
 * output joint's clinical angle on `output.axis`, the document's angle when
 * it has one and the rest angle otherwise; the sum is validated like any
 * document angle and refused past the range, never clamped.
 *
 * Admission (`assertHumanBodyRig`) requires a unique nonblank `id`, declared
 * source and output joints, an output axis the output joint's constraint
 * leaves open (which excludes the unconstrained root), at least two finite
 * knots strictly increasing in elevation, the first at or above the source
 * joint's rest elevation with an ordinate of zero so the rest, the hanging
 * arm and every pose below the rest add nothing, every `rest + ordinate`
 * inside the output axis's clinical range, no output joint that
 * is any coupling's source (so no chain and no cycle), and no output axis
 * driven twice. Correctives read the coupled angles, so a joint ramp on the
 * girdle fires on an automatic elevation exactly as on an authored one.
 * @author Samchon
 */
export interface IAutoMovieHumanBodyBasisCoupling {
  /** Name unique among the couplings, shown beside the coupled joint row. */
  id: string;

  /** The driving joint and the measure read from it. */
  source: {
    bone: AutoMovieHumanoidBone;

    /** TT total elevation on an upper arm, otherwise the clinical flexion/abduction swing cone. */
    measure: "elevation";
  };

  /** The driven joint and the clinical axis the ordinate is added to. */
  output: {
    bone: AutoMovieHumanoidBone;
    axis: "flexion" | "abduction" | "twist";
  };

  /** `[elevation, degrees]` knots, strictly increasing in elevation from the source's rest elevation or above, the first ordinate zero. */
  curve: [number, number][];
}
