import { IAutoMovieScriptActNode } from "./IAutoMovieScriptActNode";
import { IAutoMovieScriptBeatNode } from "./IAutoMovieScriptBeatNode";
import { IAutoMovieScriptGroupNode } from "./IAutoMovieScriptGroupNode";
import { IAutoMovieScriptIntentNode } from "./IAutoMovieScriptIntentNode";
import { IAutoMovieScriptSceneNode } from "./IAutoMovieScriptSceneNode";

/**
 * One node of the screenplay refinement tree, which refines one intent down to the beats the pipeline builds shots from.
 *
 * Each kind carries its own payload shape, because an intent, an act's purpose, a scene slug, a group's rationale and a beat's direction and dialogue are different kinds of text; there are no shared reasoning slots. `validateScriptTree` restricts which kind may refine which: an act refines the intent or a group, a scene the intent, an act or a group, a group the intent, an act or a scene, and a beat any of the four; nothing refines a beat, so beats are leaves, and the intent refines nothing. Feedback stamped on a beat node by `locateOnBeat` can be walked up with `scriptAncestors`.
 *
 * @evidence contracts/common.md#principled-implementation A discriminated union on `kind`, so each consumer narrows to the payload it prints or checks, and `validateScriptTree` judges parent-child pairs against one table of allowed parent kinds.
 * @evidence contracts/common.md#clear-and-simple-design Five node records sharing `IAutoMovieScriptNodeBase`, each adding only its `kind` and payload, instead of one node with optional per-level fields.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No inverted nesting is accepted, such as an act under a scene, and no node kind is skipped by the validator or the walkers.
 * @evidence contracts/common.md#meaningful-documentation States what the tree refines, why payloads differ per kind, the full allowed-parent table, that beats are leaves, and how feedback reaches the upper levels.
 */
export type IAutoMovieScriptNode =
  | IAutoMovieScriptIntentNode
  | IAutoMovieScriptActNode
  | IAutoMovieScriptSceneNode
  | IAutoMovieScriptGroupNode
  | IAutoMovieScriptBeatNode;
