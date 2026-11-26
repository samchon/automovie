import type { IAutoMovieSolidSurface } from "./IAutoMovieSolidSurface";

/** Data and callback contracts shared by the SolidMeshLoop operations. */
export namespace IAutoMovieSolidMeshLoop {
  /** A point classifier in chart coordinates, with a world-mm margin. */
  export type Classifier = (
    u: number,
    v: number,
    jet: IAutoMovieSolidSurface.IJet,
    margin: number,
  ) => boolean;
}
