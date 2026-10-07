import type { AutoMovieHumanFacePeriocularStationRole } from "@automovie/human/face/structures/AutoMovieHumanFacePeriocularStationRole";

/**
 * Signed distance of one cage row to the source globe, column by column.
 *
 * @author Samchon
 */
export interface IHumanSourcePeriocularSeatStation {
  /** Authored row role of the registered cage station. */
  role: AutoMovieHumanFacePeriocularStationRole;

  /** One local signed feature distance per cage column, metres; positive is on its outward side. */
  signedDistancesMetres: number[];

  /** Smallest column value, in metres. */
  minimumMetres: number;

  /** Largest column value, in metres. */
  maximumMetres: number;

  /** Columns with a negative local pseudonormal-side reading; not a global inside-volume count. */
  penetratingColumns: number;

  /** Columns whose nearest globe feature is an open rim, where the side is not defined. */
  boundaryColumns: number;
}
