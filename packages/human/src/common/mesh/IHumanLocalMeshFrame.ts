import type { IAutoMovieMesh, IAutoMovieVector3 } from "@automovie/interface";

/**
 * One static mesh's publication frame, separate from its source metre frame.
 * The source remains owned by its geometry producer. Subtracting origin gives
 * the local mesh; the ordinary part translation restores its placement.
 */
export interface IHumanLocalMeshFrame {
  /** Original geometry in the producer's metre frame. */
  source: IAutoMovieMesh;
  /** Source-frame position of the publication frame's origin. */
  origin: IAutoMovieVector3;
  /** Same vertices and incidence, translated into the publication frame. */
  mesh: IAutoMovieMesh;
}
