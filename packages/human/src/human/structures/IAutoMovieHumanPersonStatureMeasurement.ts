/**
 * The person's rest-skin height range: highest minus lowest Float32 sample height (`readHumanPersonRest`). The source's rest head orientation stands in for a standing measurement posture; the calculation does not establish a clinical Frankfurt-plane posture or an independent floor. The observed source-sample range is reporting metadata, not a feasibility bound.
 *
 * @evidence contracts/common.md#principled-implementation The stature discriminator names the rest closed-skin height instrument; observed population extrema remain reporting metadata rather than personal feasibility bounds.
 * @evidence contracts/common.md#clear-and-simple-design A closed literal kind separates stature from girth protocols while retaining their common population-range reporting fields.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Observed minimum and maximum values are caller-visible source metadata; the type does not clamp a person's stature to that population.
 * @evidence contracts/common.md#meaningful-documentation Documentation defines the actual highest-minus-lowest instrument, its posture/floor limitation and metre units for observed extrema.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The measurement descriptor contains no stature scan or inversion; rest reading and measured-channel solving own those algorithms.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A population descriptor coordinates no measurement requests and retains no solved skin result.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Literal and numeric metadata carry no handles; retention is limited to the owning measurement table.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanPersonStatureMeasurement {
  /** Highest minus lowest Float32 rest-skin sample height; standing posture is a source convention. */
  kind: "stature";

  /** Smallest value the cited source sample observed, metres. */
  sampleMinimumMetres: number;

  /** Largest value the cited source sample observed, metres. */
  sampleMaximumMetres: number;
}
