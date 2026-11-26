import type { IAutoMovieChannel } from "@automovie/interface";

import { admitChannel } from "./internal/admitChannel";

/**
 * Canonical key for a channel. Node channels and pointer channels live in
 * disjoint namespaces (`node:…` vs `ptr:…`) so they can never alias even if a
 * pointer string happened to look like a node path.
 */
export function channelKey(channel: IAutoMovieChannel): string {
  admitChannel(channel);
  return channel.kind === "node"
    ? `node:${channel.node}:${channel.path}`
    : `ptr:${channel.pointer}`;
}
