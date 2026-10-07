/**
 * How the source tongue meets one registered crown at the source neutral.
 *
 * @author Samchon
 */
export interface IHumanSourceOralCrownReading {
  /** ISO quadrant and position of the registered crown. */
  crown: string;

  /** Rigid owner of the crown. */
  owner: "head" | "jaw";

  /** Tongue vertices inside the closed crown. */
  tongueVerticesInside: number;

  /** Deepest such vertex below the crown surface, in metres; zero when none is inside. */
  tongueDeepestMetres: number;

  /** Tongue triangles that cross a crown triangle. */
  tongueCrossingTriangles: number;

  /** Tongue vertices whose nearest crown feature is an open rim, where no side is defined. */
  boundaryVertices: number;
}
