/**
 * Authored shell dimensions relative to the same live host skin.
 *
 * @evidence contracts/common.md#principled-implementation buildHumanFacePeriocularTissues converts explicit mm offset/thickness into two source-normal sheets on the actual live skin, reading inner room against the same ocular exterior.
 * @evidence contracts/common.md#clear-and-simple-design Independent skin-to-outer-sheet distance and further inward thickness keep one meaning for both anterior and posterior lamellae.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Positive finite representable metre dimensions and registered host data are required; deficient room remains for actual admission rather than lifting a shell or reducing its requested thickness.
 * @evidence contracts/common.md#meaningful-documentation Explicit mm inputs distinguish per-tissue requests from the parent whole-section default expansion and do not claim clinical histology.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This section performs no normal offset or ocular projection.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Host/band reuse belongs to the tissue constructor, not these dimensions.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Two caller scalars acquire no skin frames or shell mesh.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanFacePeriocularTissueSection {
  /** Positive inward distance from host skin to the shell's outer sheet, mm. */
  inwardOffsetMm: number;

  /** Positive shell thickness toward the interior, mm; no clinical default. */
  thicknessMm: number;
}
