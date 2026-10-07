/**
 * What the neutral lid seat authoring did to one eye's cage.
 *
 * @author Samchon
 */
export interface IHumanSourceLidSeatSide {
  /** Anatomical side. */
  side: "left" | "right";

  /** Signed height of the unmoved medial join above the source globe, in metres. */
  medialJoinHeightMetres: number;

  /** Upper margin columns in the authored bed, including the medial join. */
  upperBedColumns: number;

  /** Lower margin columns in the authored bed, including the medial join. */
  lowerBedColumns: number;

  /** Actual unedited upper margin arc used for the blend, in metres. */
  upperBedArcMetres: number;

  /** Actual unedited lower margin arc used for the blend, in metres. */
  lowerBedArcMetres: number;

  /** Posterior margin heights before authoring, per cage column, in metres. */
  posteriorBeforeMetres: number[];

  /** Posterior margin heights measured again on the authored positions, in metres. */
  posteriorAfterMetres: number[];

  /** Canonical source vertices that moved, ascending. */
  movedSourceVertices: number[];

  /** Largest displacement of any moved vertex, in metres. */
  maximumDisplacementMetres: number;

  /** Actual canonical-root triangle population carrying the displacement. */
  displacementTriangles: number[];

  /** Complete oriented native boundary cycles in canonical-root source IDs. */
  posteriorBoundary: number[];

  /** Fixed outer movement boundary; source-authored, not a clinical septum. */
  preseptalBoundary: number[];
}
