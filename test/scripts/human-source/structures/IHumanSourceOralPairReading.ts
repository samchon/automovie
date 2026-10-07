/**
 * One maxillary crown and one mandibular crown that interpenetrate at the source neutral.
 *
 * @author Samchon
 */
export interface IHumanSourceOralPairReading {
  /** ISO identity of the maxillary crown. */
  upper: string;

  /** ISO identity of the mandibular crown. */
  lower: string;

  /** Maxillary crown vertices inside the closed mandibular crown. */
  upperVerticesInsideLower: number;

  /** Mandibular crown vertices inside the closed maxillary crown. */
  lowerVerticesInsideUpper: number;

  /** Deepest vertex of either crown below the other's surface, in metres. */
  deepestMetres: number;

  /** Maxillary crown triangles that cross a mandibular crown triangle. */
  crossingTriangles: number;
}
