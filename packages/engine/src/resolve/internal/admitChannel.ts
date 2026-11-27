import type { IAutoMovieChannel } from "@automovie/interface";

import { CHANNEL_VALUE_TYPES } from "../../validation/CHANNEL_VALUE_TYPES";
import { NODE_CHANNEL_PATHS } from "../../validation/NODE_CHANNEL_PATHS";

/*
 * Reject unrecognized channel tags and tag-specific values before reading a
 * channel.
 */
export function admitChannel(channel: IAutoMovieChannel): void {
  switch (channel.kind) {
    case "node":
      if (!NODE_CHANNEL_PATHS.has(channel.path))
        throw new Error(`unknown channel path "${String(channel.path)}"`);
      return;
    case "pointer":
      if (!CHANNEL_VALUE_TYPES.has(channel.valueType))
        throw new Error(
          `unknown channel valueType "${String(channel.valueType)}"`,
        );
      return;
    default:
      throw new Error(
        `unknown channel kind "${String((channel as IAutoMovieChannel).kind)}"`,
      );
  }
}
