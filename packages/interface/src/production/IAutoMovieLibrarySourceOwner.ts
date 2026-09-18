import { IAutoMovieLibraryBuildContext } from "./IAutoMovieLibraryBuildContext";
import { IAutoMovieLibraryContribution } from "./IAutoMovieLibraryContribution";

/**
 * One named export a library source module registers as an authored owner.
 *
 * The registration names the reviewed H2 it realizes, which is what lets a
 * compiled artifact be attributed to a design decision without a second table
 * mapping files to documents. A module may export several of these, and a
 * module may export none when it is a helper the owners import.
 *
 * @evidence requirements/agent-authoring/source-owned-loop.md#agent-source-result-link Binds one executed source export to the exact reviewed owner its output realizes.
 * @evidence specifications/authoring-and-authority/source-authority-and-derivation.md#spec-authoring-source-derivation-state Types the source-side registration the derived library state is produced from.
 * @author Samchon
 */
export interface IAutoMovieLibrarySourceOwner {
  /**
   * Exact `docs/<branch>/<document>.md#<anchor>` address this export realizes.
   *
   * The address is the registration. A spelling that is not an active design
   * owner unit or reviewed production-settings delivery is refused by name
   * rather than ignored. Production settings use the same registration with
   * an empty semantic contribution so their executed revision is attributable
   * without pretending settings own a model, environment, or context.
   */
  design: string;

  /** Build this owner's contribution deterministically from its own address. */
  build(context: IAutoMovieLibraryBuildContext): IAutoMovieLibraryContribution;
}
