import type { IAutoMovieLoftSectionJet } from "../../../construction/IAutoMovieLoftSectionJet";
import type { IAutoMovieLoftSectionPhase } from "../../../construction/IAutoMovieLoftSectionPhase";
import type { IAutoMovieLoftViewSource } from "../../../construction/IAutoMovieLoftViewSource";
import type { IAutoMovieViewPart } from "../../../construction/IAutoMovieViewPart";

/** Type contracts exchanged by AutoMovieHumanFootSource; runtime evaluation remains in Human. */
export namespace IAutoMovieHumanFootSource {
  /** Call-owned scalar/fullness preparation; the original axis remains authoritative.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation Call-owned scalar/fullness preparation; the original axis remains authoritative.
   * @evidence contracts/development/design.md#principled-representation `part`: Shared identity/frame metadata; a direct control owner retains no completed parent. `field`: Actual native coefficients when prepared directly; absent for a region whose full parent is unrequested. `name`: Non-generating name when this owner also has a bounded regional capability.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Returned by AutoMovieHumanFootSource.fromControls. Read by AutoMovieHumanFootConnection.chord, AutoMovieHumanFootConnection.ankle, AutoMovieHumanFootSource.at. Also types AutoMovieHumanFootInterim.owner, AutoMovieHumanFootToeSources.owner.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts `field`: Actual native coefficients when prepared directly; absent for a region whose full parent is unrequested. `name`: Non-generating name when this owner also has a bounded regional capability. `axis`: Identical axis shared by the retained interval and every full coupled result. `region`: Explicit retained interval; reading it does not claim full-parent completion.
   */
  export interface ISource {
    /** Shared identity/frame metadata; a direct control owner retains no completed parent. Legacy complete adapters may carry the actual whole part. */
    part: Pick<IAutoMovieViewPart, "name" | "axis">;

    /** Actual native coefficients when prepared directly; absent for a region whose full parent is unrequested. */
    field?: IAutoMovieLoftViewSource.ISource;

    /** Explicitly complete a regional owner's actual original, retaining its real failure; absent on direct controls. */
    complete?(): IComplete;

    /** Non-generating name when this owner also has a bounded regional capability. */
    name?: string;

    /** Identical axis shared by the retained interval and every full coupled result. */
    axis?: IAutoMovieViewPart["axis"];

    /** Explicit retained interval; reading it does not claim full-parent completion. */
    region?: IRegion;
  }

  /** Explicit complete-part adapter; direct regional/control consumers use only ISource.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation Explicit complete-part adapter; direct regional/control consumers use only ISource.
   * @evidence contracts/development/design.md#principled-representation `part`: Actual completed original, obtained only by prepare or the explicit full resolver. `field`: Actual native coefficients of that explicitly requested complete original.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Returned by AutoMovieHumanFootSource.prepare. Also types AutoMovieHumanFootSource.retained, AutoMovieHumanFootSource.full.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `part`, `field`; callers supply the complete record.
   */
  export interface IComplete extends ISource {
    /** Actual completed original, obtained only by prepare or the explicit full resolver. */
    part: IAutoMovieViewPart;

    /** Actual native coefficients of that explicitly requested complete original. */
    field: IAutoMovieLoftViewSource.ISource;
  }

  /** The unchanged part of a generating family, without a substitute whole-parent declaration.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation The unchanged part of a generating family, without a substitute whole-parent declaration.
   * @evidence contracts/development/design.md#principled-representation `name`: Name of the actual owning production family. `axis`: Same original axis retained by the full family. `domain`: Closed physical station interval, calibration mm.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Returned by AutoMovieHumanLegDistal, AutoMovieHumanLegRegion. Read by AutoMovieHumanFootSource.fromRegion. Also types AutoMovieHumanLegSourceFamily.distal.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `name`, `axis`, `domain`; callers supply the complete record.
   */
  export interface IRegion {
    /** Name of the actual owning production family. */

    name: string;

    /** Same original axis retained by the full family. */

    axis: IAutoMovieViewPart["axis"];

    /** Closed physical station interval, calibration mm. */

    domain: readonly [number, number];

    /** Actual value and separately available physical2 within this interval. */ at(
      station: number,
    ): IStation;
  }

  /** One regular station's value capability and separately qualified physical derivatives.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation One regular station's value capability and separately qualified physical derivatives.
   * @evidence contracts/development/design.md#principled-representation `phase`: Original local phase function, in mm and radians. `jet`: Original physical-station total2, or explicit absence. `unavailable`: The original reason physical derivatives are unavailable.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Returned by AutoMovieHumanFootSource.at. Also types AutoMovieHumanFootConnection.source, AutoMovieHumanFootConnection.local.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `phase`, `jet`, `unavailable`; callers supply the complete record.
   */
  export interface IStation {
    /** Original local phase function, in mm and radians. */
    phase: (phi: number) => IAutoMovieLoftSectionPhase;

    /** Original physical-station total2, or explicit absence. */
    jet: ((phi: number) => IAutoMovieLoftSectionJet) | null;

    /** The original reason physical derivatives are unavailable. */
    unavailable: string | null;
  }

  /** Bounded region with a real, explicit full-original completion capability.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation Bounded region with a real, explicit full-original completion capability.
   * @evidence contracts/development/design.md#principled-representation Bounded region with a real, explicit full-original completion capability.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Returned by AutoMovieHumanFootSource.fromRegion. Also types AutoMovieHumanFootSource.owner.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The representation is used by AutoMovieHumanFootSource.fromRegion, AutoMovieHumanFootSource.owner for bounded region with a real, explicit full-original completion capability.
   */
  export interface IRegional extends ISource {
    /** Complete and admit the actual coupled original, preserving its original failure. */
    complete(): IComplete;
  }

  /** The resolve argument of AutoMovieHumanFootSource.fromRegion. Borrow a retained interval while keeping explicit full-parent demand truthful.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation Borrow a retained interval while keeping explicit full-parent demand truthful.
   * @evidence contracts/development/design.md#principled-representation Borrow a retained interval while keeping explicit full-parent demand truthful. The callable takes  and returns IAutoMovieViewPart.
   * @evidence contracts/development/design.md#minimal-and-owned-surface IAutoMovieHumanFootSource.FromRegionResolve is the canonical exchange used by AutoMovieHumanFootSource.fromRegion.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The representation is used by AutoMovieHumanFootSource.fromRegion for borrow a retained interval while keeping explicit full-parent demand truthful.
   */
  export type FromRegionResolve = () => IAutoMovieViewPart;
}
