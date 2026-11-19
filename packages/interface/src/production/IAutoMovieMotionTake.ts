import type { IAutoMovieMotionTakeAnchor } from "./IAutoMovieMotionTakeAnchor";
import type { IAutoMovieMotionTakeProvenance } from "./IAutoMovieMotionTakeProvenance";
import type { IAutoMovieShotContract } from "./IAutoMovieShotContract";

/**
 * Version 1 of a saved motion take for deterministic authored replay.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the project, registered source, cut occurrence, provenance, optional parent and replay mode which the production host uses on restart.
 * @evidence contracts/development/design.md#principled-representation A literal version and replay mode select the supported restart semantics; an optional parent binds a branch to immutable bytes of its original saved take.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Reuses film's source pointer convention and delegates file access, editorial admission and owner reconstruction to their respective runtimes.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The payload stores references and scalar identity evidence; it carries neither sampled poses nor engine caches, and an authored replay makes no claim of native solver restore.
 */
export interface IAutoMovieMotionTake {
  /** Artifact schema version. */
  version: 1;

  /** Stable installed production identity. */
  production: string;

  /** Stable take identity within the production. */
  take: string;

  /** Independently selected production module and named export that rebuild this take. */
  source: IAutoMovieShotContract["source"];

  /** Reconstruction method for this schema. */
  replay: "authored";

  /** Exact occurrence and paired times where the take was saved. */
  anchor: IAutoMovieMotionTakeAnchor;

  /** Facts independently rederived by the host before reopening. */
  provenance: IAutoMovieMotionTakeProvenance;

  /** Parent take when this artifact publishes a branch. */
  parent?: IAutoMovieMotionTakeProvenance["files"][number];
}
