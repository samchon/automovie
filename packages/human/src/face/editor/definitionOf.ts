import { humanFaceDetailChannels } from "../channels/humanFaceDetailChannels";
import { IAutoMovieHumanFaceDetailChannel } from "../structures/IAutoMovieHumanFaceDetailChannel";

/**
 * Shared by humanFaceDetailValue, setHumanFaceDetail, setHumanFaceHairLayerDetail, which were one file until each public identity took its own.
 *
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-controls-replacement Connects numerical sliders to actual detailed shape settings.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-controls Provides field meaning, applied-value inspection and anatomical attachment context.
 * @author Samchon
 */
export function definitionOf(id: string): IAutoMovieHumanFaceDetailChannel {
  const definition = humanFaceDetailChannels.find(
    (channel) => channel.id === id,
  );
  if (definition === undefined)
    throw new Error(`Unknown anatomical detail: ${id}.`);
  return definition;
}
