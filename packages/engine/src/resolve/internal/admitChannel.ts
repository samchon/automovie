import type { IAutoMovieChannel } from "@automovie/interface";

import { AutoMovieEngineChannelValueTypes } from "../../validation/AutoMovieEngineChannelValueTypes";
import { AutoMovieEngineNodeChannelPaths } from "../../validation/AutoMovieEngineNodeChannelPaths";

/*
 * Reject unrecognized channel tags and tag-specific values before reading a
 * channel.
 */
export function admitChannel(channel: IAutoMovieChannel): void {
  switch (channel.kind) {
    case "node":
      if (!AutoMovieEngineNodeChannelPaths.has(channel.path))
        throw new Error(`unknown channel path "${String(channel.path)}"`);
      return;
    case "pointer":
      if (!AutoMovieEngineChannelValueTypes.has(channel.valueType))
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
