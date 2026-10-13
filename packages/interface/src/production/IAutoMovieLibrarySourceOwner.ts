import { IAutoMovieLibraryBuildContext } from "./IAutoMovieLibraryBuildContext";
import { IAutoMovieLibraryContribution } from "./IAutoMovieLibraryContribution";

/**
 * One named export a library source module registers as an authored owner.
 *
 * A named export registers the completed H2 it realizes, binding returned artifacts to one design decision. A module can export several owners or serve only as an imported helper.
 *
 * @evidence contracts/common.md#principled-implementation The source linker admits the exact design address and source binding before invoking build with the corresponding owner context; branch admission validates the returned contribution and its identities.
 * @evidence contracts/common.md#clear-and-simple-design One address beside one build method makes artifact attribution local to the named export rather than maintaining a second file-to-owner table.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Unknown addresses and duplicate owner registrations refuse; production-settings owners intentionally return an empty semantic contribution because their executed settings delivery has no model, context or environment payload.
 * @evidence contracts/common.md#meaningful-documentation Defines named-export registration, exact H2 ownership, helper modules, settings-only empty payload and deterministic build context.
 * @author Samchon
 */
export interface IAutoMovieLibrarySourceOwner {
  /**
   * Exact `docs/<branch>/<document>.md#<anchor>` address this export realizes.
   *
   * The address is the registration. A spelling that is not an active design owner unit or completed production-settings delivery is refused by name rather than ignored. Production settings use the same registration with an empty semantic contribution so their executed revision is attributable without pretending settings own a model, environment, or context.
   */
  design: string;

  /**
   * Build this owner's contribution deterministically from its own address and verified precomputed inputs.
   *
   * @evidence contracts/common.md#principled-implementation The ordinary source evaluator invokes this method only after owner and binding admission; the returned data must pass contribution schema, branch ownership and domain validation before publication.
   * @evidence contracts/common.md#clear-and-simple-design A single synchronous context-to-contribution method keeps source execution separate from subsequent persistent publication and precomputed-generator execution.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Returning a payload does not itself complete an owner: empty, cross-branch, invalid and colliding semantic results are refused by the builder.
   * @evidence contracts/common.md#meaningful-documentation States deterministic owner-local construction and verified inputs; the containing registration documents address admission and result ownership.
   */
  build(context: IAutoMovieLibraryBuildContext): IAutoMovieLibraryContribution;
}
