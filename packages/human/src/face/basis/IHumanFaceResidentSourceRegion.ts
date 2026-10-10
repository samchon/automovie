/**
 * Exact source correspondence of one retained native face region.
 * The region gatherer owns render numbering, including UV splits and removed
 * source components. Coordinates never establish this correspondence.
 *
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
