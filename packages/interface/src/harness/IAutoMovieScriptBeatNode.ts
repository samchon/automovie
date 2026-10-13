import { IAutoMovieBeatPayload } from "./IAutoMovieBeatPayload";
import { IAutoMovieScriptNodeBase } from "./IAutoMovieScriptNodeBase";

/**
 * The authored leaf of the screenplay tree: one beat's direction, dialogue
 * and caption.
 *
 * `validateScriptTree` accepts a beat node under any other kind and lets no
 * node refine it. Its payload's `beat` joins the script's flat beats one to
 * one: an unknown beat, a beat claimed twice, and a flat beat no beat node
 * claims are refused. `beatNodeOf` finds the node for a beat id, which
 * `locateOnBeat` uses to stamp feedback for `scriptAncestors` to cascade.
 *
 * @evidence contracts/common.md#principled-implementation The leaf that joins the tree to the flat beats the pipeline runs on, through a one-to-one id join the validator enforces in both directions.
 * @evidence contracts/common.md#clear-and-simple-design The shared node fields plus the `beat` discriminator and the beat payload; timing and motion stay on the flat beat and its shot.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A beat missing from the tree is refused rather than rendered without its direction, and a doubly claimed beat is refused rather than resolved to the first node.
 * @evidence contracts/common.md#meaningful-documentation States the allowed parents, that it is a leaf, the one-to-one join and its refusals, and how feedback finds it; members give the discriminator and payload roles.
 * @author Samchon
 */
export interface IAutoMovieScriptBeatNode extends IAutoMovieScriptNodeBase {
  /** Selects a beat node. */
  kind: "beat";

  /** The beat's direction, dialogue and caption, and the flat beat it joins. */
  payload: IAutoMovieBeatPayload;
}
