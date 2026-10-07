/** Native construction edge incidence and millimetre length for the existing rim-distance field.
 *
 * @evidence contracts/common.md#principled-implementation Keeps original vertex incidence and measured edge length together so physical rims remain distinct from material boundaries.
 * @evidence contracts/common.md#clear-and-simple-design One edge record serves incidence counting and neighbour construction at their shared owner.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Carries mesh-derived incidence rather than a separate anatomical rim list.
 * @evidence contracts/common.md#meaningful-documentation Original vertex ordinals refer to complete refined skin before material separation; one incident face marks a free rim.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping Defines no anatomical part or group.
 * @evidenceExclude contracts/modeling.md#parameter-channels Transports computational inputs and defines no form-varying channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry Defines no primitive population.
 * @evidenceExclude contracts/modeling.md#shared-boundaries Constructs no joined surface or volume.
 * @evidenceExclude contracts/modeling.md#rendered-observation Owns no displayed part or joint; the assembled consumer owns observation.
 * @evidenceExclude contracts/anatomy.md#anatomical-source Establishes no anatomical quantity or physiological source.
 * @evidenceExclude contracts/anatomy.md#permitted-range Owns no physiological range; anatomical admission remains with its input owner.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Defines no public measurement or physiological control for shaping a person.
 * @evidence contracts/modeling.md#spatial-conventions Edge length retains the refined portrait skin construction millimetres.
 * @author Samchon
 */
export interface IPortraitSurfaceEdge {
  /** First construction vertex ordinal of this undirected edge. */
  a: number;

  /** Second construction vertex ordinal of this undirected edge. */
  b: number;

  /** Number of refined construction triangles incident to the edge. */
  count: number;

  /** Euclidean edge length in construction millimetres. */
  length: number;
}
