import type { IAutoMovieProfile } from "../core/IAutoMovieProfile";

/**
 * Data and callback contracts shared by the ValidateProfileCapabilities
 * operations.
 */
export namespace IAutoMovieValidateProfileCapabilities {
  /**
   * Admit profile id/name uniqueness and mountable/destructible trait fields:
   * seats/payload, durability and impact-body coefficients.
   */
  export type IProps = {
    /** Profiles attached to one runtime model or model group. */
    profiles: readonly IAutoMovieProfile[];
  };
}
