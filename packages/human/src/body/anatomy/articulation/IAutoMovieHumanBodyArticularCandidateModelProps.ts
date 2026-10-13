import type { IAutoMovieHumanBodyAnatomicalInspection } from "../generated/IAutoMovieHumanBodyAnatomicalInspection";

/**
 * Inputs of `createHumanBodyArticularCandidateModel`.
 *
 * `id` and `name` label the produced static model; `inspection` is the generated report whose candidates become its spheres. The report is read only and no whole body skin is substituted for its unavailable outputs.
 *
 * @evidence contracts/common.md#principled-implementation The report type carries qualified analytic candidates into static model creation; identity and display name label the result without implying complete anatomical geometry.
 * @evidence contracts/common.md#clear-and-simple-design Three fields separate output labels from the inspection payload consumed by the candidate model builder.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The payload accepts the actual generated report rather than introducing a whole-body substitute for unavailable candidate anatomy.
 * @evidence contracts/common.md#meaningful-documentation Field comments distinguish static-model identity, display name and the report whose candidates supply spheres.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The props declaration specifies labels and a report reference without choosing a sphere tessellation algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This input record owns no cross-request report cache or invalidation key.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Model labels and the inspection reference remain caller-owned values; this interface acquires no rendering resources.
 * @author Samchon
 */
export interface IAutoMovieHumanBodyArticularCandidateModelProps {
  /** Identity of the produced static model. */
  id: string;

  /** Display name of the produced static model. */
  name: string;

  /** Generated inspection report whose candidates become the spheres. */
  inspection: IAutoMovieHumanBodyAnatomicalInspection;
}
