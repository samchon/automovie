import { IAutoMovieScriptActNode } from "./IAutoMovieScriptActNode";
import { IAutoMovieScriptBeatNode } from "./IAutoMovieScriptBeatNode";
import { IAutoMovieScriptGroupNode } from "./IAutoMovieScriptGroupNode";
import { IAutoMovieScriptIntentNode } from "./IAutoMovieScriptIntentNode";
import { IAutoMovieScriptSceneNode } from "./IAutoMovieScriptSceneNode";

/**
 * One node of the screenplay **refinement graph**: the script is a tree from
 * one abstract intent down to concrete beats (whose compiled shots and motions
 * are the graph's computed leaves) with temporal and interaction edges crossing
 * it. Each kind carries its **own** payload shape (D014, heterogeneous
 * chain-of-thought): intent decomposition is not blocking geometry is not
 * dialogue, so no uniform thinking/plan/draft slots exist.
 *
 * The refinement axis is a strict tree (single intent root, acyclic); the
 * temporal and interaction axes are cross-references validated to resolve.
 * Physical/review feedback located on a leaf propagates up the refinement
 * chain, so a correction can target the beat, the scene, or the intent; the
 * screenplay is upstream truth, not a side document.
 *
 * @evidence requirements/story/dialogue-language-and-silence.md#story-dialogue-timing-intent Exposes `IAutoMovieScriptNode` as the portable data boundary for the story dialogue timing intent requirement.
 * @evidence specifications/narrative-and-intent/dialogue-language-theme-and-meaning.md#narrative-intent-utterance-timing-action Types `IAutoMovieScriptNode` for the narrative intent utterance timing action system contract.
 * @author Samchon
 */
export type IAutoMovieScriptNode =
  | IAutoMovieScriptIntentNode
  | IAutoMovieScriptActNode
  | IAutoMovieScriptSceneNode
  | IAutoMovieScriptGroupNode
  | IAutoMovieScriptBeatNode;
