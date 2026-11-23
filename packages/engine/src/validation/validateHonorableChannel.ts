import type {
  IAutoMovieClipChannelGate,
  IAutoMovieConstraintViolation,
  IAutoMovieNodeChannel,
} from "@automovie/interface";

import { NODE_CHANNEL_PATHS } from "./constants/NODE_CHANNEL_PATHS";
import { pushViolation } from "./pushViolation";

/**
 * Require node channels with translation/rotation/scale/weights paths, matching transform-clip appliers.
 */
export const validateHonorableChannel: IAutoMovieClipChannelGate = (
  channel: Record<string, unknown>,
  path: string,
  violations: IAutoMovieConstraintViolation[],
): void => {
  if (channel.kind !== "node") {
    pushViolation(
      violations,
      "type",
      `${path}.kind`,
      `clip track channel kind must be "node"; the pipeline resolves node channels (translation/rotation/scale/weights) onto scene nodes and honors no other target on a transform clip (a light change belongs in the shot's lightMotions), but was ${JSON.stringify(channel.kind)}`,
      channel.kind,
    );
    return;
  }
  // The node arm's own address. `channelKey` builds `node:<id>:<path>` from the
  // same set and throws for anything outside it, so a track naming a property
  // like `opacity` used to validate clean here and take the sampler's throw
  // instead of a violation (#1353): the pointer arm was closed and the node
  // arm's unknown paths were left open, which is the same false green one
  // discriminator over.
  if (!NODE_CHANNEL_PATHS.has(channel.path as IAutoMovieNodeChannel["path"]))
    pushViolation(
      violations,
      "type",
      `${path}.path`,
      `clip track channel path must be one of ${[...NODE_CHANNEL_PATHS].join(", ")}; the pipeline writes no other property of a node, but was ${JSON.stringify(channel.path)}`,
      channel.path,
    );
};
