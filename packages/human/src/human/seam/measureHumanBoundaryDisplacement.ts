/**
 * Read the largest actual displacement of an existing ordered boundary.
 * Both flat position fields address the same native vertex identities in
 * common body-frame metres. This is a Euclidean observation of the assembly
 * step, not a clearance tolerance or anatomical acceptance bound. An empty
 * boundary has zero displacement. No position field is modified.
 *
 * @evidence contracts/common.md#principled-implementation Corresponding native vertices are subtracted before Euclidean length is read, without a coordinate-based nearest pairing.
 * @evidence contracts/common.md#clear-and-simple-design One boundary displacement reading owns the assembly diagnostic independently of mesh construction.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The result is the actual maximum over the supplied boundary, with no threshold or corrective change.
 * @evidence contracts/common.md#meaningful-documentation States matching native identities, frame, units, empty behavior and observation meaning.
 * @evidence contracts/modeling.md#spatial-conventions The two fields and output remain common body-frame metres.
 * @evidence contracts/modeling.md#shared-boundaries Reads the same registered native boundary before and after conformance.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping Defines no part.
 * @evidenceExclude contracts/modeling.md#parameter-channels Defines no shaping input.
 * @evidenceExclude contracts/modeling.md#emitted-geometry Emits no primitive.
 * @evidenceExclude contracts/modeling.md#rendered-observation Numerical transport supplies no independent render.
 * @evidenceExclude contracts/anatomy.md#anatomical-source Defines no clinical or anatomical quantity.
 * @evidenceExclude contracts/anatomy.md#permitted-range This observation admits no biological state.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Introduces no personal shaping input.
 */
export function measureHumanBoundaryDisplacement(
  boundary: readonly number[],
  before: readonly number[],
  after: readonly number[],
): number {
  let maximum = 0;
  for (const vertex of boundary)
    maximum = Math.max(maximum, Math.hypot(
      after[3 * vertex] - before[3 * vertex],
      after[3 * vertex + 1] - before[3 * vertex + 1],
      after[3 * vertex + 2] - before[3 * vertex + 2],
    ));
  return maximum;
}
