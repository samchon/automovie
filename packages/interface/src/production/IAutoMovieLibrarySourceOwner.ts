import { IAutoMovieLibraryBuildContext } from "./IAutoMovieLibraryBuildContext";
import { IAutoMovieLibraryContribution } from "./IAutoMovieLibraryContribution";

/**
 * One named export a library source module registers as an authored owner.
 *
 * The registration names the completed H2 it realizes, which is what lets a
 * compiled artifact be attributed to a design decision without a second table
 * mapping files to documents. A module may export several of these, and a
 * module may export none when it is a helper the owners import.
 *
 * @author Samchon
 */
export interface IAutoMovieLibrarySourceOwner {
  /**
   * Exact `docs/<branch>/<document>.md#<anchor>` address this export realizes.
   *
   * The address is the registration. A spelling that is not an active design
   * owner unit or completed production-settings delivery is refused by name
   * rather than ignored. Production settings use the same registration with
   * an empty semantic contribution so their executed revision is attributable
   * without pretending settings own a model, environment, or context.
   */
  design: string;

  /** Build this owner's contribution deterministically from its own address. */
  build(context: IAutoMovieLibraryBuildContext): IAutoMovieLibraryContribution;
}
