import type { IAutoMovieScriptActNode } from "./IAutoMovieScriptActNode";
import type { IAutoMovieScriptBeatNode } from "./IAutoMovieScriptBeatNode";
import type { IAutoMovieScriptGroupNode } from "./IAutoMovieScriptGroupNode";
import type { IAutoMovieScriptIntentNode } from "./IAutoMovieScriptIntentNode";
import type { IAutoMovieScriptSceneNode } from "./IAutoMovieScriptSceneNode";

/**
 * One node of the screenplay refinement tree, which refines one intent down to
 * the beats the pipeline builds shots from.
 *
 * Each kind carries its own payload shape, because an intent, an act's purpose,
 * a scene slug, a group's rationale and a beat's direction and dialogue are
 * different kinds of text; there are no shared reasoning slots.
 * `validateScriptTree` restricts which kind may refine which: an act refines
 * the intent or a group, a scene the intent, an act or a group, a group the
 * intent, an act or a scene, and a beat any of the four; nothing refines a
 * beat, so beats are leaves, and the intent refines nothing. Feedback stamped
 * on a beat node by `locateOnBeat` can be walked up with `scriptAncestors`.
 */
export type IAutoMovieScriptNode =
  | IAutoMovieScriptIntentNode
  | IAutoMovieScriptActNode
  | IAutoMovieScriptSceneNode
  | IAutoMovieScriptGroupNode
  | IAutoMovieScriptBeatNode;
