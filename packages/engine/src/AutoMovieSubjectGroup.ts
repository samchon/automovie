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
 */
export abstract class AutoMovieSubjectGroup<
  TDesign,
  TMember extends AutoMovieSubject<unknown>,
> extends AutoMovieSubject<TDesign> {
  /** The subjects this group holds, in a stable order. */
  public abstract members(): readonly TMember[];

  /** Merge every member's authored contribution in stable member order. */
  public render(
    context: IAutoMovieShotBuildContext,
  ): IAutoMovieSubjectContribution {
    return mergeAutoMovieSubjectContributions(
      this.members().map((member) => member.render(context)),
    );
  }
}
