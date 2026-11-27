import type { IAutoMovieChannel } from "@automovie/interface";

import { admitChannel } from "./admitChannel";

/*
 * Whether a channel carries a rotation (a quaternion), which the sample pass
 * must interpolate with slerp rather than component-wise lerp, the glTF rule
 * for LINEAR rotation tracks.
 */
export function channelIsRotation(channel: IAutoMovieChannel): boolean {
  admitChannel(channel);
  return channel.kind === "node"
    ? channel.path === "rotation"
    : channel.valueType === "quaternion";
}
