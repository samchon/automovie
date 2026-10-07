/** One native edge neighbour and its construction-millimetre distance.
 *
 * @evidence contracts/common.md#principled-implementation Pairs a reachable construction vertex with original edge cost for the existing shortest-path traversal.
 * @evidence contracts/common.md#clear-and-simple-design One adjacency record carries neighbour identity and traversal cost.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Preserves measured native edge costs without an inferred anatomical distance.
 * @evidence contracts/common.md#meaningful-documentation Adjacency refers to refined construction mesh vertex ordinals with millimetre costs.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping Defines no anatomical part or group.
 * @evidenceExclude contracts/modeling.md#parameter-channels Transports computational inputs and defines no form-varying channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry Defines no primitive population.
 * @evidenceExclude contracts/modeling.md#shared-boundaries Constructs no joined surface or volume.
 * @evidenceExclude contracts/modeling.md#rendered-observation Owns no displayed part or joint; the assembled consumer owns observation.
 * @evidenceExclude contracts/anatomy.md#anatomical-source Establishes no anatomical quantity or physiological source.
 * @evidenceExclude contracts/anatomy.md#permitted-range Owns no physiological range; anatomical admission remains with its input owner.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Defines no public measurement or physiological control for shaping a person.
 * @evidence contracts/modeling.md#spatial-conventions Adjacency costs preserve the portrait construction mesh millimetre unit.
 * @author Samchon
 */
export interface IPortraitSurfaceNeighbour {
  /** Adjacent vertex ordinal in the refined construction mesh. */
  vertex: number;

  /** Euclidean edge length to that vertex in construction millimetres. */
  length: number;
}
