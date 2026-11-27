import type { IAutoMovieHumanParameters } from "./IAutoMovieHumanParameters";
import type { IAutoMovieHumanHeadInputs } from "./IAutoMovieHumanHeadInputs";
import type { IAutoMovieHumanNeckSource } from "./IAutoMovieHumanNeckSource";
import type { IAutoMovieHumanHeadComposer } from "./IAutoMovieHumanHeadComposer";
import type { IAutoMovieHumanHeadNeckLayout } from "./IAutoMovieHumanHeadNeckLayout";

/**
 * Type contracts exchanged by AutoMovieHumanHeadPose; runtime evaluation
 * remains in Human.
 */
export namespace IAutoMovieHumanHeadPlacement {
  /**
   * One immutable input's common neck owner, before either adjoining original
   * or a part is constructed.
   */
  export interface IShared {
    /**
     * Borrowed public input identity; a changed input needs a new source
     * invocation.
     */
    readonly parameters: IAutoMovieHumanParameters;

    /** Same public-to-head input conversion used by the actual head producer. */
    readonly inputs: IAutoMovieHumanHeadInputs;

    /** Registered numerical neck prior, with no part or loft. */
    readonly neckSource: IAutoMovieHumanNeckSource.IOutput;

    /**
     * Same actual neck constraints and anatomical placement consumed by both
     * producers.
     */
    readonly pose: IOutput;
  }

  /**
   * Direct generating facts; no head source, raw chain or complete calibration
   * is retained.
   */
  export interface IOutput {
    /**
     * Original neck declaration with its real selected placement, in
     * calibration mm.
     */
    readonly neck: IAutoMovieHumanHeadNeckLayout.IOutput;

    /**
     * Existing numerical placement laws, together with this identical neck
     * declaration.
     */
    readonly places: IAutoMovieHumanHeadComposer.IPlaces;
  }
}
