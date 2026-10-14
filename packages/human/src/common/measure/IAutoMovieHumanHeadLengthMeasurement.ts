/**
 * The distance from a named glabella to the opisthocranion, read on the
 * person's skin at rest (`readHumanHeadLength`). The opisthocranion
 * is the triangle-edge crossing of the head view's midsagittal section (the plane through the
 * glabella normal to +X) farthest from the glabella, among the crossings at or
 * above a named tragion's height (`findHumanOpisthocranion`).
 *
 * The observed range of the cited source sample is recorded for reporting,
 * not as a bound. A named point or area the head view does not declare
 * refuses the rule by name.
 *
 *
 * @evidence contracts/common.md#principled-implementation Length runs from named glabella to the farthest admitted midsagittal edge crossing above named tragion height; source landmarks determine the search while sample extrema provide reporting context.
 * @evidence contracts/common.md#clear-and-simple-design Rule data selects the length protocol; findHumanOpisthocranion owns the section extremum and readHumanHeadLength owns Euclidean distance.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No target skull length or consumer adjustment is embedded; the actual rest head supplies landmarks and section.
 * @evidence contracts/common.md#meaningful-documentation The prose gives the +X-normal plane, tragion bound, missing-name refusal and metre sample context.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This length declaration executes no section search or distance calculation; those belong to its producers.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Two landmark strings cannot establish equivalent mutable head geometry, and the rule stores no previous length.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Caller-held source strings and sample numbers own no resident geometry, handle, cache or task.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanHeadLengthMeasurement {
  /** Glabella to the farthest admitted midsagittal edge crossing of the back of the head. */
  kind: "head-length";

  /** The head view's skin landmark the length starts at. */
  glabella: string;

  /** The head view's skin landmark whose height bounds the opisthocranion search from below. */
  tragion: string;

  /** Smallest value the cited source sample observed, metres. */
  sampleMinimumMetres: number;

  /** Largest value the cited source sample observed, metres. */
  sampleMaximumMetres: number;
}
