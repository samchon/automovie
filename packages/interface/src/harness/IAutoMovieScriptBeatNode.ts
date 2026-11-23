import type { IAutoMovieBeatPayload } from "./IAutoMovieBeatPayload";
import type { IAutoMovieScriptNodeBase } from "./IAutoMovieScriptNodeBase";

/**
 * The authored leaf of the screenplay tree: one beat's direction, dialogue and
 * caption.
 *
 * `validateScriptTree` accepts a beat node under any other kind and lets no
 * node refine it. Its payload's `beat` joins the script's flat beats one to
 * one: an unknown beat, a beat claimed twice, and a flat beat no beat node
 * claims are refused. `beatNodeOf` finds the node for a beat id, which
 * `locateOnBeat` uses to stamp feedback for `scriptAncestors` to cascade.
 */
export interface IAutoMovieScriptBeatNode extends IAutoMovieScriptNodeBase {
  /** Selects a beat node. */
  kind: "beat";

  /** The beat's direction, dialogue and caption, and the flat beat it joins. */
  payload: IAutoMovieBeatPayload;
}
