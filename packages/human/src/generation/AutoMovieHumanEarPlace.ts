import type { IAutoMovieHumanEar } from "../structures/head/IAutoMovieHumanEar";
import type { IAutoMovieHumanHeadIdentity } from "../structures/head/IAutoMovieHumanHeadIdentity";
import { AutoMovieHumanSex } from "../typings/AutoMovieHumanSex";

/**
 * The ear's place on the head: how far the auricle's top stands above the
 * tragion, which with the tragion's own height (`AutoMovieHumanHeadArcs.tragionDrop`)
 * places the ear, replacing the head prior's observed `ear.drop`; its
 * fore-aft place ({@link FORWARD}, for `ear.forward`) and the concha's depth
 * ({@link CONCHA_ON_PROTRUSION}) are reference estimates.
 *
 * Source: ANSUR 1988 (Gordon et al. 1989; 2,208 women and 1,774 men) takes the
 * ear length above tragion with the ear length; the line by sex
 * (`test_human_survey_head_arcs`): 6.96 + 0.3645 L in women and 8.12 + 0.3673
 * L in men, R2 0.34 and 0.40, residual SD 1.9 mm; the means are 28.7 (2.3)
 * and 31.9 (2.5) mm.
 * The retained ANSUR survey and the public Cho CT ear length use distinct
 * protocols; this file does not establish their orientation equivalence.
 * HeadLane and its source observer use aboveTragion. The current EarFrame
 * no longer reads FORWARD; forward and concha have no production caller.
 *
 * @evidence contracts/common.md#principled-implementation Separates the retained ANSUR length regression from private normalized placement/depth estimates and states the public-length protocol transfer's limit.
 * @evidence contracts/common.md#clear-and-simple-design Owns the three fixed records and their scalar conversions; head builders own their frame and auricular course.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Adds no observation, fit, asymmetric compensation or claim that the private depth ratio is a published concha protocol.
 * @evidence contracts/common.md#meaningful-documentation Gives source/sample, units, regression and reference uncertainty, current readers and unused helper status.
 * @evidence contracts/performance.md#efficient-algorithms Fixed sex lookup and scalar affine/product conversions take constant time and space.
 * @evidence contracts/performance.md#reuse-equivalent-work All head readers share the same module coefficients; no generated geometry or input-dependent result cache is retained.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Fixed coefficient records live for their module instance; numeric helpers retain no call state and forward returns a fresh caller-owned two-number object.
 */
export namespace AutoMovieHumanEarPlace {
  /** The line on the ear length, women and men, mm. */
  export const ABOVE_TRAGION_ON_LENGTH: readonly [{ readonly a: number; readonly b: number }, { readonly a: number; readonly b: number }] = [
    { a: 6.96, b: 0.3645 },
    { a: 8.12, b: 0.3673 },
  ];

  /**
   * The ear's top above the tragion.
   *
   * @param ear The ear's measures.
   * @param sex The person's sex.
   * @returns Height of the auricle's top over the tragion, mm.
   *
   * @evidence contracts/common.md#principled-implementation Evaluates the sex-specific ANSUR affine regression on supplied ear length; transferring the public Cho protocol to that predictor remains the namespace's stated limitation.
   * @evidence contracts/common.md#clear-and-simple-design Reads one coefficient pair and returns one height for HeadLane without owning the head frame.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Applies no reference-fit offset, clamp or side-specific compensation.
   * @evidence contracts/common.md#meaningful-documentation Names the predictor, millimetres, population and unresolved protocol transfer.
   * @evidence contracts/performance.md#efficient-algorithms One fixed lookup, multiplication and addition use constant time and space.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work A scalar affine expression coordinates no cross-request or effectful work.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Borrows one module coefficient pair and returns a scalar without retaining the input ear.
   */
  export function aboveTragion(ear: IAutoMovieHumanEar, sex: AutoMovieHumanSex): number {
    const fit: { readonly a: number; readonly b: number } = ABOVE_TRAGION_ON_LENGTH[sex === AutoMovieHumanSex.Female ? 0 : 1];
    return fit.a + fit.b * ear.length;
  }

  /**
   * The ear's fore-aft place at the tragion's height, forward of the skull's
   * centre (the midpoint of the midline's front and back where they stand
   * farthest apart) per head length: the rim's most anterior point and the
   * mean of the rim's points. Estimated from the private reference set; no
   * published source found: `test_human_estimate_nasion_ear` reads -0.0996
   * (SD 0.0068) and -0.1406 (SD 0.0215) on eight ears of four people.
   */
  export const FORWARD: { readonly front: number; readonly centre: number } = { front: -0.0996, centre: -0.1406 };

  /**
   * The concha's depth inside the rim per ear protrusion. Estimated from the
   * private reference set; no published source found:
   * `test_human_estimate_face_detail` reads 1.058 (SD 0.096) on eight ears.
   */
  export const CONCHA_ON_PROTRUSION: number = 1.058;

  /**
   * The ear's fore-aft place at the tragion's height.
   *
   * @param head The head's measures, for its length.
   * @returns The rim's front and centre forward of the skull's centre, mm (negative behind it).
   *
   * @evidence contracts/common.md#principled-implementation Scales the retained dimensionless rim-point estimates by supplied head length, preserving their reference-defined origin rather than deriving a new clinical landmark.
   * @evidence contracts/common.md#clear-and-simple-design One two-field conversion reads FORWARD directly; the helper has no current production caller.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Adds no fit, hidden adjustment or assertion that a builder's distinct origin is identical.
   * @evidence contracts/common.md#meaningful-documentation Names the rim points, signed direction, millimetres, source datum and inactive helper status.
   * @evidence contracts/performance.md#efficient-algorithms Two multiplications and one fixed-size result allocation take constant time and space.
   * @evidence contracts/performance.md#reuse-equivalent-work Reads the one fixed FORWARD record; this currently unused conversion retains no input-dependent result cache.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Returns a fresh caller-owned two-number object; the helper retains neither it nor the head input.
   */
  export function forward(head: IAutoMovieHumanHeadIdentity): { front: number; centre: number } {
    return { front: FORWARD.front * head.length, centre: FORWARD.centre * head.length };
  }

  /**
   * The concha's depth inside the rim.
   *
   * @param ear The ear's measures.
   * @returns Depth from the rim inward, mm.
   *
   * @evidence contracts/common.md#principled-implementation Multiplies protrusion by the retained eight-ear depth ratio; this private rim-relative estimate is not Zhu's depth-to-concha-plane measurement.
   * @evidence contracts/common.md#clear-and-simple-design One scalar conversion exposes CONCHA_ON_PROTRUSION; the helper has no current production caller.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Does not relabel protrusion as concha depth or introduce a clinical-plane conversion or new fit.
   * @evidence contracts/common.md#meaningful-documentation States rim-relative depth, units, private sample and the distinct published concha-plane definition.
   * @evidence contracts/performance.md#efficient-algorithms One multiplication takes constant time and space.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work A scalar product coordinates no cross-request or effectful work.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Returns one number and retains neither the ear nor any geometry or source pack.
   */
  export function concha(ear: IAutoMovieHumanEar): number {
    return CONCHA_ON_PROTRUSION * ear.protrusion;
  }
}
