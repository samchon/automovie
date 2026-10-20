import type { IAutoMovieMesh } from "@automovie/interface";
import type { IWallFace } from "./IWallFace";

/**
 * One caller-owned cut wall mesh paired with the face and void record from which it was produced. Geometry emitters and part assembly carry the physical body and inspection boundary together; this erased pair neither builds geometry nor assigns another wall author.
 */
export interface IWallSolid {
  /** The assigned wall's emitted world-space mesh around its rough voids. */
  mesh: IAutoMovieMesh;

  /** The same wall's pre-cut face, including its hosted door/window cuts. */
  face: IWallFace;
}
