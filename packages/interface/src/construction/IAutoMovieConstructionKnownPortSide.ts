import type { IAutoMovieConstructionKnownPortSource } from "./IAutoMovieConstructionKnownPortSource";
import type { IAutoMovieSolidSurface } from "./IAutoMovieSolidSurface";

/** One resolved immutable original neighboring field and its actual chart map. */
export interface IAutoMovieConstructionKnownPortSide {
  /**
   * Same immutable original field used by the band, in kernel world
   * millimetres.
   */
  field: IAutoMovieSolidSurface;

  /** Same original-clock/transverse map used for this field's exact pullback. */
  map: IAutoMovieConstructionKnownPortSource.IMap;
}
