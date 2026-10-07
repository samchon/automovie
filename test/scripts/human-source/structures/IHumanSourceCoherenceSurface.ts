/**
 * Whether one published surface kept every coordinate its edit receipt does not list.
 *
 * @author Samchon
 */
export interface IHumanSourceCoherenceSurface {
  /** Which person view holds the surface. */
  view: "head" | "body";

  /** Surface ID, or `landmarks` for the view's landmark table. */
  surface: string;

  /** Vertex count in the reference, then in the candidate. */
  vertices: number[];

  /** True when the triangle index arrays are identical; landmark tables have none and read true. */
  indicesEqual: boolean;

  /** Vertices the receipt lists as moved. */
  editedVertices: number;

  /** Unlisted vertices whose three neutral coordinates are not bit-identical. */
  untouchedPositionMismatches: number;

  /** The first such vertices, at most sixteen, for locating the cause. */
  firstMismatchedVertices: number[];

  /** Endpoint names present in the reference only. */
  endpointsOnlyInReference: string[];

  /** Endpoint names present in the candidate only. */
  endpointsOnlyInCandidate: string[];

  /** Endpoint rows the receipt lists as edited. */
  editedRows: number;

  /** Unlisted endpoint rows that are absent on one side or not bit-identical. */
  untouchedRowMismatches: number;

  /** Endpoints holding such rows. */
  mismatchedEndpoints: string[];
}
