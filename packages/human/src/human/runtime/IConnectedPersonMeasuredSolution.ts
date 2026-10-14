import type { IAutoMovieHumanPersonDocument } from "@automovie/human";

/**
 * A person measurement solved in the measurement worker: the person with the solved body channel, the value its final Float32 skin measures, and whether the target lies within the measurement's source sample. The reading is numerical rest-state output from the paired whole-person evaluator. Source-sample membership classifies the requested target, not geometry feasibility or clinical validity, and the panel separately admits the returned candidate under current intent.
 *
 * @evidence contracts/common.md#principled-implementation The worker returns the one-channel candidate together with its final Float32 rest-skin reading and the requested target's source-sample classification.
 * @evidence contracts/common.md#clear-and-simple-design Numerical achieved value and observational sample metadata travel separately from the panel's admission and history decision.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts An outside-source-sample target is not silently clamped, and numerical feasibility is not promoted to population observation or clinical validity.
 * @evidence contracts/common.md#meaningful-documentation The comment identifies paired rest-state provenance, requested-target sample classification and separate editor candidate admission.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The output schema selects no inverse, Float32 construction or measurement algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work One candidate result implements no reusable numerical identity across complete documents and targets.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Ordinary document and scalar data acquire no worker or prepared renderer allocation.
 *
 * @author Samchon
 */
export interface IConnectedPersonMeasuredSolution {
  /** The person with the solved body channel; everything else unchanged. */
  document: IAutoMovieHumanPersonDocument;

  /** The value the solved person's final Float32 skin measures, metres. */
  actualMetres: number;

  /** Whether the target lies within the range the measurement's source sample observed. */
  population: "within-source-sample" | "outside-source-sample";
}
