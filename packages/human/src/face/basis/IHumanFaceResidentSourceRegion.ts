/**
 * Exact source correspondence of one retained native face region.
 * The region gatherer owns render numbering, including UV splits and removed
 * source components. Coordinates never establish this correspondence.
 *
 * @evidence contracts/common.md#principled-implementation The emitted region and its source table come from the same retained incidence and canonical corner owner.
 * @evidence contracts/modeling.md#shared-boundaries Source identities retain their meaning when generated parts replace only one component of a material region.
 * @author Samchon
 */
export interface IHumanFaceResidentSourceRegion {
  /** Native basis surface whose vertex population the source table addresses. */
  surface: string;

  /** Actual retained face part identity, before the person's face prefix. */
  part: string;

  /** Source vertex for each emitted render vertex, in its actual gather order. */
  sources: readonly number[];
}
