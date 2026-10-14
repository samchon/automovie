import { humanFaceDetailChannels } from "../channels/humanFaceDetailChannels";
import { IAutoMovieHumanFaceDetailChannel } from "../structures/IAutoMovieHumanFaceDetailChannel";

/**
 * The detail channel definition with this id, refusing an unknown one. Shared by
 * the detail reader `humanFaceDetailValue` and the writers `setHumanFaceDetail`
 * and `setHumanFaceHairLayerDetail`.
 *
 * @author Samchon
 *
 * @evidence contracts/common.md#principled-implementation Exact id lookup returns the current catalogue's declared scalar path/range/ownership; all detail readers and both writers share that definition instead of accepting inactive spellings.
 * @evidence contracts/common.md#clear-and-simple-design One catalogue lookup owns identity resolution while scalar admission, path access and geometry resolution stay separate.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Unknown ids refuse, with no nearest-name match or synthesized control; returned metadata is a shared catalogue record and must not be mutated by consumers.
 * @evidence contracts/common.md#meaningful-documentation Prose identifies reader/writer consumers and refusal; return ownership is the borrowed static catalogue, not a copied editable document.
 * @evidence contracts/performance.md#efficient-algorithms A single C-entry linear search stops at the first matching id; no profile/mesh resolution occurs in this lookup.
 * @evidence contracts/performance.md#reuse-equivalent-work Every scalar consumer shares the same canonical catalogue record; the static catalogue already owns reuse and no separate mutable-result cache is needed.
 * @evidence contracts/performance.md#bound-retention-and-release-resources A borrowed record or error transfers; no per-call population, handle or task is retained.
 */
export function humanFaceDetailDefinition(
  id: string,
): IAutoMovieHumanFaceDetailChannel {
  const definition: IAutoMovieHumanFaceDetailChannel | undefined = humanFaceDetailChannels.find(
    (channel: IAutoMovieHumanFaceDetailChannel): boolean  => channel.id === id,
  );
  if (definition === undefined)
    throw new Error(`Unknown anatomical detail: ${id}.`);
  return definition;
}
