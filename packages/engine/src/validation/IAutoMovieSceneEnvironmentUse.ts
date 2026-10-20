import { IAutoMovieSceneEnvironment } from "@automovie/interface";

/**
 * One shot identity paired with its optional compiled scene environment.
 *
 * @evidence contracts/common.md#principled-implementation Texture closure uses the owning shot id to address image-lighting references and treats absent or null environment as no declared environment use.
 * @evidence contracts/common.md#clear-and-simple-design A small projection lets closure inspect scene lighting without retaining or traversing the whole shot program.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Omission does not synthesize a default sky or make any declared asset proven; actual byte facts and provenance are supplied separately.
 * @evidence contracts/common.md#meaningful-documentation Defines exact shot identity and nullable environment ownership, leaving field admission and lighting execution to their canonical owners.
 * @evidence contracts/performance.md#efficient-algorithms The record performs no environment or texture scan; closure traversal scales with supplied uses.
 * @evidence contracts/performance.md#reuse-equivalent-work The original environment representation is reused, with no duplicate lighting schema or cached byte facts in this row.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns the borrowed environment reference and shot string; no image decoder, scene or GPU handle is acquired.
 */
export interface IAutoMovieSceneEnvironmentUse {
  /** Exact shot id. */
  shot: string;

  /**
   * The scene's declared environment, or null/undefined when it declares none.
   */
  environment?: IAutoMovieSceneEnvironment | null;
}
