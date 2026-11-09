import { IAutoMovieSceneEnvironment } from "@automovie/interface";

/**
 * One shot identity paired with its optional compiled scene environment.
 *
 * @evidence contracts/development/design.md#principled-representation Texture closure uses the owning shot id to address image-lighting references and treats absent or null environment as no declared environment use.
 * @evidence contracts/development/design.md#minimal-and-owned-surface A small projection lets closure inspect scene lighting without retaining or traversing the whole shot program.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Omission does not synthesize a default sky or make any declared asset proven; actual byte facts and provenance are supplied separately.
 * @evidence contracts/development/common.md#meaningful-documentation Defines exact shot identity and nullable environment ownership, leaving field admission and lighting execution to their canonical owners.
 */
export interface IAutoMovieSceneEnvironmentUse {
  /** Exact shot id. */
  shot: string;

  /**
   * The scene's declared environment, or null/undefined when it declares none.
   */
  environment?: IAutoMovieSceneEnvironment | null;
}
