import type { IAutoMovieConstructionProfile } from "./IAutoMovieConstructionProfile";
import type { IAutoMovieConstructionProfilePhase } from "./IAutoMovieConstructionProfilePhase";
import type { IAutoMovieSolidAtlas } from "./IAutoMovieSolidAtlas";
import type { IAutoMovieSolidSurface } from "./IAutoMovieSolidSurface";

/** Source-backed profile queries retained after declaration admission. */
export namespace IAutoMoviePreparedConstructionProfile {
  /**
   * Original section/atlas readers with source identity and no final mesh
   * claim.
   *
   * Treat the definition, maps, surface records and original dependencies as
   * immutable while any reader exists. The declaration was cloned but its
   * functions were not; mutating exposed records is not an invalidation API.
   */
  export interface IPrepared {
    /** Detached pure declaration; edits require another preparation. */
    definition: IAutoMovieConstructionProfile;

    /**
     * Piece charts in declared loop/piece order; kept checks finite retained
     * coordinates and across maps an open piece side to the adjacent piece
     * endpoint after checking endpoint agreement.
     */
    atlas: IAutoMovieSolidAtlas;

    /** Piece id to the same actual atlas surface identity. */
    surfaces: ReadonlyMap<string, IAutoMovieSolidSurface>;

    /**
     * Piece-keyed wrappers over the same original functions with their full
     * original station domains and supported clock neighborhoods, before
     * retained restrictions.
     */
    originals: ReadonlyMap<string, IAutoMovieSolidSurface>;

    /**
     * Fresh list of active loop IDs in declaration order at station
     * millimetres, after checking actual adjacent piece endpoints. Throws for a
     * nonfinite or out-of-family station, no active loop, or an endpoint
     * mismatch. Callback exceptions propagate; an empty successful result is
     * never returned.
     */
    section(station: number): readonly string[];

    /**
     * Fresh world phase reading at a named piece, station millimetres and
     * normalized coordinate in [0,1]. Rejects an unknown piece, out-of-domain
     * query or missing first phase derivative. Second phase may be null
     * independently of complete physical2; original callback throws propagate.
     */
    phase(
      piece: string,
      station: number,
      coordinate: number,
    ): IAutoMovieConstructionProfilePhase.IReading;

    /**
     * Region membership at piece coordinate [0,1] and station millimetres.
     * Unknown region/piece IDs throw. A known address outside its piece,
     * retained chart or region domain returns false; without a trim owner it
     * returns true there. Otherwise it calls the original trim predicate with
     * the converted original clock and propagates its exceptions.
     */
    contains(
      region: string,
      piece: string,
      station: number,
      coordinate: number,
    ): boolean;
  }
}
