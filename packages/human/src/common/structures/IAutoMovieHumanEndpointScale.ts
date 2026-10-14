/**
 * The measured metric effect of one named endpoint at unit weight.
 *
 * Distances are metres in the basis frame. They describe the authored
 * displacement field, posed through the joint when the channel drives one: a
 * large `peak` says the endpoint moves geometry far, never that the resulting
 * face is anatomically valid, collision free or a likeness of anyone.
 *
 *
 * @evidence contracts/common.md#principled-implementation RMS displacement across every surface vertex, maximum magnitude and changed-vertex count measure the same unit-weight authored endpoint field.
 * @evidence contracts/common.md#clear-and-simple-design The measurement result separates global displacement, peak and resident count while face/body basis-channel readers own geometry evaluation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A large displacement is not anatomical validity, collision freedom or personal likeness; driven joints remain part of the measured endpoint effect.
 * @evidence contracts/common.md#meaningful-documentation The description uses the common basis frame so both head and body callers retain correct metre units.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Measured endpoint scale result is erased by TypeScript; its runtime consumer owns the actual geometry or measurement traversal.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Measured endpoint scale result specifies caller data and performs no runtime recomputation or cache lookup.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Measured endpoint scale result acquires no runtime handle or retained cache; concrete array and map ownership belongs to its producing and consuming functions.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanEndpointScale {
  /** Root mean square displacement over every vertex of every surface. */
  displacement: number;

  /** Largest single-vertex displacement magnitude. */
  peak: number;

  /** Vertices the endpoint moves, by a sparse row or through the joint it drives, across all surfaces. */
  vertices: number;
}
