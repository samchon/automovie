import type { IAutoMovieConstructionKnownPortSource } from "./IAutoMovieConstructionKnownPortSource";
import type { IAutoMovieSolidSurface } from "./IAutoMovieSolidSurface";

/**
 * Resolved original field and its chart map on one side of a known port. The
 * prepared surface borrows both owners throughout the band's lifetime.
 */
export interface IAutoMovieConstructionKnownPortSide {
  /** Original neighboring surface whose positions use kernel world millimetres. */
  field: IAutoMovieSolidSurface;

  /** Original clock/transverse correspondence into that field's actual chart. */
  map: IAutoMovieConstructionKnownPortSource.IMap;
}
