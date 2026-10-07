import type { AutoMovieHumanFacePeriocularStationRole } from "@automovie/human/face/structures/AutoMovieHumanFacePeriocularStationRole";

/** One source-authored lid section on the licensed native mesh. */
export interface IHumanSourcePeriocularStationSelection {
  /** Authored section role; not an observed histological boundary. */
  role: AutoMovieHumanFacePeriocularStationRole;
  /** Native topology station ordinal: posterior zero, anterior two. */
  distance: number;
  /** Corresponding native columns in one closed, unrepeated row. */
  nativeVertices: number[];
}
