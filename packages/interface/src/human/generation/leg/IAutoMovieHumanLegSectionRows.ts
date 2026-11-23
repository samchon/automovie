import type { IAutoMovieHumanLegProfile } from "./IAutoMovieHumanLegProfile";

/**
 * Angular guide rows and thigh/shank sector rows in their source normalization.
 * Runtime construction and admission remain with AutoMovieHumanLegSectionRows
 * in Human.
 */
export namespace IAutoMovieHumanLegSectionRows {
  /**
   * A guide: its section angle (0 forward, increasing toward lateral on the
   * left leg) and its rows.
   */
  export interface IGuide {
    /** The guide's name. */
    name: string;

    /** Section angle, radians. */
    angle: number;

    /** The landmark rows, `[rho, rho_theta, rho_thetatheta]`. */
    rows: readonly IAutoMovieHumanLegProfile.IRow[];
  }

  /**
   * A sector after a guide: its thigh and its shank compartment's rows,
   * `[fullness]`.
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
