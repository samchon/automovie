import type { IAutoMovieHumanPersonSourceCell } from "./IAutoMovieHumanPersonSourceCell";
import type { IAutoMovieHumanPersonSourceWeight } from "./IAutoMovieHumanPersonSourceWeight";

/**
 * What proving complete positive chart coverage of a source triangle tree
 * reads: the oriented parent triangles, the cells partitioning them, and each
 * cell sample's preimage over its parent's original corners. All read only.
 *
 * @evidence contracts/common.md#principled-implementation Coverage is decided by the parent tree, its cells and their preimages alone.
 * @evidence contracts/common.md#clear-and-simple-design Three members.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Callers supply actual compiled cells and preimages; nothing is defaulted.
 * @evidence contracts/common.md#meaningful-documentation States each member and that all are read only.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The carrier defines no part.
 * @evidenceExclude contracts/modeling.md#parameter-channels Not a shaping channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The carrier emits no geometry.
 * @evidenceExclude contracts/modeling.md#spatial-conventions IDs and affine weights are dimensionless and carry no frame.
 * @evidence contracts/modeling.md#shared-boundaries Geometric partitions of both skins and their shared normal subdivision are proven through this same carrier.
 * @evidenceExclude contracts/modeling.md#rendered-observation Internal source lineage that is not observed directly.
 * @evidenceExclude contracts/anatomy.md#anatomical-source Carries no anatomical value.
 * @evidenceExclude contracts/anatomy.md#permitted-range Admits numerical lineage, not a biological range.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Compiled or derived lineage, not a caller's shaping input.
 * @author Samchon
 */
export interface IAutoMovieHumanPersonSourceCoverageProps {
  /** Flat oriented original-vertex triples, one per parent triangle. */
  parentTriangles: readonly number[];

  /** Cells partitioning those parents. */
  cells: readonly IAutoMovieHumanPersonSourceCell[];

  /**
   * Preimage of a cell sample over its parent's original corners.
   *
   * @evidence contracts/common.md#principled-implementation Coverage reads each cell sample's actual compiled preimage within its parent.
   * @evidence contracts/common.md#clear-and-simple-design One function of a parent and a sample.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts IAutoMovieHumanPersonSourceCoverageProps.preimage is a signature; it carries no behaviour, special case or compensating path.
   * @evidence contracts/common.md#meaningful-documentation States what preimage it returns.
   * @evidenceExclude contracts/modeling.md#part-identity-and-grouping IAutoMovieHumanPersonSourceCoverageProps.preimage is a declaration and defines no part or group of parts.
   * @evidenceExclude contracts/modeling.md#parameter-channels IAutoMovieHumanPersonSourceCoverageProps.preimage carries no parameter channel of a form.
   * @evidenceExclude contracts/modeling.md#emitted-geometry IAutoMovieHumanPersonSourceCoverageProps.preimage decides no primitive population; it only describes data.
   * @evidenceExclude contracts/modeling.md#spatial-conventions IDs and affine weights are dimensionless.
   * @evidenceExclude contracts/modeling.md#shared-boundaries IAutoMovieHumanPersonSourceCoverageProps.preimage constructs no surface; it describes data only.
   * @evidenceExclude contracts/modeling.md#rendered-observation IAutoMovieHumanPersonSourceCoverageProps.preimage is a declaration and displays nothing itself.
   * @evidenceExclude contracts/anatomy.md#anatomical-source IAutoMovieHumanPersonSourceCoverageProps.preimage carries no anatomical value, range, proportion, landmark or tissue behaviour.
   * @evidenceExclude contracts/anatomy.md#permitted-range IAutoMovieHumanPersonSourceCoverageProps.preimage admits, bounds and combines no anatomical value.
   * @evidenceExclude contracts/anatomy.md#parametric-authority IAutoMovieHumanPersonSourceCoverageProps.preimage defines no input through which a caller shapes a human form.
   */
  preimage: (
    parent: number,
    sample: number,
  ) => readonly IAutoMovieHumanPersonSourceWeight[];
}
