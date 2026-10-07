import type { IAutoMovieVector3 } from "@automovie/interface";

/** Original camera framing subject measurements for the facade scenario. */
export interface IFilmFacadeSubject {
  /** World-space subject base in metres. */
  base: IAutoMovieVector3;

  /** Subject height in metres. */
  height: number;

  /** Optional enclosing horizontal radius in metres. */
  radius?: number;
}
