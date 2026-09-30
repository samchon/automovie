import { humanFaceDetailChannels } from "../channels/humanFaceDetailChannels";
import { IAutoMovieHumanFaceDetailChannel } from "../structures/IAutoMovieHumanFaceDetailChannel";

/**
 * The detail channel definition with this id, refusing an unknown one. Shared by
 * the detail reader `humanFaceDetailValue` and the writers `setHumanFaceDetail`
 * and `setHumanFaceHairLayerDetail`.
 *
 * @author Samchon
 */
export function humanFaceDetailDefinition(
  id: string,
): IAutoMovieHumanFaceDetailChannel {
  const definition = humanFaceDetailChannels.find(
    (channel) => channel.id === id,
  );
  if (definition === undefined)
    throw new Error(`Unknown anatomical detail: ${id}.`);
  return definition;
}
