/**
 * The current closed collider whose original skin faces precede appended cap faces.
 *
 * @author Samchon
 */
export interface IHumanFaceHairRootBoundaryProps {
  /** Flat current XYZ coordinates, head-frame metres, owned by the caller. */
  positions: readonly number[];

  /** Original oriented incidence plus the current cap's appended faces. */
  indices: readonly number[];
}
