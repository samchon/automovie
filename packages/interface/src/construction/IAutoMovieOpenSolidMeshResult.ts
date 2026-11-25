import type { IAutoMovieSolidMesh } from "./IAutoMovieSolidMesh";

/** Endpoint cycles plus an explicit inability to close partial periodic ends. */
export interface IAutoMovieOpenSolidMeshResult {
  /** Positive native-chart boundaries with their actual occurrence coordinates. */ cycles: IAutoMovieSolidMesh.IOpen[];
  /** Partial endpoint arcs cannot be treated as complete cap/event rings. */ partial: boolean;
}
