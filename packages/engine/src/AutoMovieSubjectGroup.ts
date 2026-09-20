import type { IAutoMovieShotBuildContext } from "@automovie/interface";
import { AutoMovieSubject } from "./AutoMovieSubject";
import { IAutoMovieSubjectContribution } from "./IAutoMovieSubjectContribution";
import { mergeAutoMovieSubjectContributions } from "./mergeAutoMovieSubjectContributions";

/**
 * A subject that is a collection of subjects.
 *
 * A cluster holds figures, a group holds clusters, a village holds buildings, a
 * map holds everything standing on it. The shape is the same at every level,
 * which is what makes a line battle authorable: a group advancing is one call
 * rather than two thousand.
 *
 * `render` composes its members by default, so a group states what it holds and
 * how it is arranged, not how to draw it. A group that needs to add something
 * of its own (a banner, a dust cue, a shared route) overrides `render` and
 * merges its own contribution with `super.render`, rather than replacing what
 * its members said.
 *
 * @evidence requirements/product/capability-and-content.md#product-project-owned-content Lets a project compose clusters, groups, villages, and maps from its own subjects without an engine-supplied named collection.
 * @evidence specifications/authoring-and-authority/capability-and-content-boundary.md#spec-authoring-capability-input-output Treats a group as an authoring composition whose output remains the same plain subject-contribution boundary.
 * @evidence requirements/asset-authoring/external-assets.md#asset-external-group-composition `AutoMovieSubjectGroup` composes external and local subject contributions under one explicit parent while preserving each member's authored payload and stable order.
 * @evidence requirements/external-inputs/adoption-modes-and-composition.md#external-adoption-group-composition `AutoMovieSubjectGroup` preserves member identity and contribution boundaries when imported and project-native subjects are composed into a higher-level group.
 * @evidence specifications/asset-and-representation/alternatives-instances-and-groups.md#asset-spec-external-adoption-alternatives The group supplies the composition subset of external adoption without flattening member outputs or choosing an adoption mode.
 * @evidence specifications/interchange-and-adoption/adoption-decisions-and-composition.md#interchange-group-composition-boundary Stable member traversal and contribution merging implement the normalized group-composition boundary without parsing external containers.
 */
export abstract class AutoMovieSubjectGroup<
  TDesign,
  TMember extends AutoMovieSubject<unknown>,
> extends AutoMovieSubject<TDesign> {
  /**
   * The subjects this group holds, in a stable order.
   *
   * @evidence requirements/product/capability-and-content.md#product-project-owned-content Exposes the exact project-selected subjects held by the group in the stable order used for composition.
   * @evidence specifications/authoring-and-authority/capability-and-content-boundary.md#spec-authoring-capability-input-output Makes group membership an explicit authoring output rather than discovering members from global state.
   */
  public abstract members(): readonly TMember[];

  /**
   * Merge every member's authored contribution in stable member order.
   *
   * @evidence requirements/product/capability-and-content.md#product-project-owned-content Preserves every member's project-owned payload while composing the group in stable source order.
   * @evidence specifications/authoring-and-authority/capability-and-content-boundary.md#spec-authoring-capability-input-output Emits one plain contribution assembled only from the explicit outputs of its member subjects.
   */
  public render(
    context: IAutoMovieShotBuildContext,
  ): IAutoMovieSubjectContribution {
    return mergeAutoMovieSubjectContributions(
      this.members().map((member) => member.render(context)),
    );
  }
}
