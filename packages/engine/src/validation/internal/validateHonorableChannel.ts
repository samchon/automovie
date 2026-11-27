import type {
  IAutoMovieChannel,
  IAutoMovieClipChannelGate,
  IAutoMovieConstraintViolation,
} from "@automovie/interface";

import { pushViolation } from "./pushViolation";

/*
 * Require node channels, matching transform-clip appliers: the pipeline
 * resolves node channels onto scene nodes and honors no other target on a
 * transform clip.
 */
export const validateHonorableChannel: IAutoMovieClipChannelGate = (
  channel: IAutoMovieChannel,
  path: string,
  violations: IAutoMovieConstraintViolation[],
): void => {
  if (channel.kind !== "node")
    pushViolation(
      violations,
      "type",
      `${path}.kind`,
      `clip track channel kind must be "node"; the pipeline resolves node channels (translation/rotation/scale/weights) onto scene nodes and honors no other target on a transform clip (a light change belongs in the shot's lightMotions), but was ${JSON.stringify(channel.kind)}`,
      channel.kind,
    );
};
