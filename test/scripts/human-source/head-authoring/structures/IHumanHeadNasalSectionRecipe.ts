/** Source-private normal-cone extrusion dimensions, not a measured airway.
 * @author Samchon
 */
export interface IHumanHeadNasalSectionRecipe {
  /** Positive lining depth beyond the rim support, in millimetres. */
  liningDepthMillimetres: number;

  /** Positive first section depth, smaller than lining depth, in millimetres. */
  rimSupportDepthMillimetres: number;
}
