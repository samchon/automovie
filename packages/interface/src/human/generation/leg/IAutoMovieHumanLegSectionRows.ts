import type { IAutoMovieHumanLegProfile } from "./IAutoMovieHumanLegProfile";

/**
 * Angular guide rows and thigh/shank sector rows in their source normalization. Runtime construction and admission remain with AutoMovieHumanLegSectionRows in Human.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Describes angular guide rows and thigh/shank sector rows in their source normalization; nested declarations retain their units, frames, optional states and callback contracts.
 * @evidence contracts/development/design.md#principled-representation Angular guide rows and thigh/shank sector rows in their source normalization. Named nested records and aliases preserve these distinctions; callers must satisfy their numeric premises because structural types do not enforce numeric validity.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Interface owns these dependency-free exchange types for AutoMovieHumanLegSectionRows; Human retains the producer, evaluator and validation code, while imported geometry contracts keep their original owner.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The namespace groups the existing LegSectionRows contracts without adding runtime factories, fixture selectors or alternative representations; any fitted or conventional quantities remain identified by their nested declarations.
 */
export namespace IAutoMovieHumanLegSectionRows {
  /** A guide: its section angle (0 forward, increasing toward lateral on the left leg) and its rows.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation A guide: its section angle (0 forward, increasing toward lateral on the left leg) and its rows.
   * @evidence contracts/development/design.md#principled-representation `name`: The guide's name. `angle`: Section angle, radians. `rows`: The landmark rows, `[rho, rho_theta, rho_thetatheta]`.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Read by AutoMovieHumanLegGuides.profile. Also types AutoMovieHumanLegSectionRows.GUIDES.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `name`, `angle`, `rows`; callers supply the complete record.
   */
  export interface IGuide {
    /** The guide's name. */
    name: string;

    /** Section angle, radians. */
    angle: number;

    /** The landmark rows, `[rho, rho_theta, rho_thetatheta]`. */
    rows: readonly IAutoMovieHumanLegProfile.IRow[];
  }

  /** A sector after a guide: its thigh and its shank compartment's rows, `[fullness]`.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation A sector after a guide: its thigh and its shank compartment's rows, `[fullness]`.
   * @evidence contracts/development/design.md#principled-representation `thigh`: The thigh compartment's name. `shank`: The shank compartment's name. `thighRows`: The thigh compartment's rows.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Also types AutoMovieHumanLegSectionRows.SECTORS.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `thigh`, `shank`, `thighRows`, `shankRows`; callers supply the complete record.
   */
  export interface ISector {
    /** The thigh compartment's name. */
    thigh: string;

    /** The shank compartment's name. */
    shank: string;

    /** The thigh compartment's rows. */
    thighRows: readonly IAutoMovieHumanLegProfile.IRow[];

    /** The shank compartment's rows. */
    shankRows: readonly IAutoMovieHumanLegProfile.IRow[];
  }
}
