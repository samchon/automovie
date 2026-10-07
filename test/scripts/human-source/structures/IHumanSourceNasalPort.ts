/** The provider's original native contour order, before active compaction.
 * This is a source-authored cut boundary, not a clinical nostril aperture.
 * @author Samchon
 */
export interface IHumanSourceNasalPort {
  side: "left" | "right";
  orderedNativeBoundary: number[];
}
