import type { IAutoMovieConstructionProfile } from "./IAutoMovieConstructionProfile";
import type { IAutoMovieConstructionProfilePhase } from "./IAutoMovieConstructionProfilePhase";
import type { IAutoMovieSolidAtlas } from "./IAutoMovieSolidAtlas";
import type { IAutoMovieSolidSurface } from "./IAutoMovieSolidSurface";

/**
 * Source-backed profile queries retained after declaration admission.
 *
 * @evidence contracts/development/design.md#principled-representation One copied declaration indexes retained piece charts and their wider original neighborhoods, both in station-mm/normalized-piece coordinates.
 * @evidence contracts/development/design.md#minimal-and-owned-surface ProfileBody consumes surfaces/originals and grids; source composition consumes the section, phase and region readers.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Preparation retains original callbacks and cannot certify every future query or final closed topology.
 * @evidence contracts/development/common.md#meaningful-documentation Identifies original versus retained ownership and the readers' coordinate system.
 */
export namespace IAutoMoviePreparedConstructionProfile {
  /**
   * Original section/atlas readers with source identity and no final mesh claim.
   *
   * Treat the definition, maps, surface records and original dependencies as
   * immutable while any reader exists. The declaration was cloned but its
   * functions were not; mutating exposed records is not an invalidation API.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Defines copied declaration versus borrowed functions and query/array ownership.
   * @evidence contracts/development/design.md#principled-representation Piece-keyed retained and original surfaces keep the same source function while distinguishing owned station/clock neighborhoods.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Preparation shares one atlas and indexes across section checks, phase reads, region membership and mesh publication.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Declaration admission checks identities and coverage; point/phase/jet readers separately admit requested data and preserve unavailable capabilities as failures.
   */
  export interface IPrepared {
    /** Detached pure declaration; edits require another preparation. */
    definition: IAutoMovieConstructionProfile;

    /** Piece charts in declared loop/piece order; kept checks finite retained coordinates and across maps an open piece side to the adjacent piece endpoint after checking endpoint agreement. */
    atlas: IAutoMovieSolidAtlas;

    /** Piece id to the same actual atlas surface identity. */
    surfaces: ReadonlyMap<string, IAutoMovieSolidSurface>;

    /** Piece-keyed wrappers over the same original functions with their full original station domains and supported clock neighborhoods, before retained restrictions. */
    originals: ReadonlyMap<string, IAutoMovieSolidSurface>;

    /**
     * Fresh list of active loop IDs in declaration order at station millimetres,
     * after checking actual adjacent piece endpoints. Throws for a nonfinite or
     * out-of-family station, no active loop, or an endpoint mismatch. Callback
     * exceptions propagate; an empty successful result is never returned.
     *
     * @evidence contracts/development/common.md#meaningful-documentation Gives station millimetres, fresh ordered IDs and all refused query cases, including no active loop.
     */
    section(station: number): readonly string[];

    /**
     * Fresh world phase reading at a named piece, station millimetres and
     * normalized coordinate in [0,1]. Rejects an unknown piece, out-of-domain
     * query or missing first phase derivative. Second phase may be null
     * independently of complete physical2; original callback throws propagate.
     *
     * @evidence contracts/development/common.md#meaningful-documentation Defines piece/station/normalized-coordinate arguments, fresh world output and separate first/second derivative availability.
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
     *
     * @evidence contracts/development/common.md#meaningful-documentation Distinguishes unknown-address throws, known out-of-domain false, untrimmed true and the original trim callback.
     */
    contains(
      region: string,
      piece: string,
      station: number,
      coordinate: number,
    ): boolean;
  }
}
