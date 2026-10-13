import { IAutoMovieChannel, IAutoMovieNodeChannel, IAutoMoviePointerChannel } from "@automovie/interface";

import { CHANNEL_VALUE_TYPES } from "../validation/constants/CHANNEL_VALUE_TYPES";
import { NODE_CHANNEL_PATHS } from "../validation/constants/NODE_CHANNEL_PATHS";

/**
 * Whether a channel carries a rotation (a quaternion), which the sample pass
 * must interpolate with slerp rather than component-wise lerp, the glTF rule
 * for LINEAR rotation tracks.
 *
 * @evidence contracts/common.md#principled-implementation Validate the channel discriminator/path/value type and classify node rotation or pointer quaternion channels for spherical rather than component-wise interpolation.
 * @evidence contracts/common.md#clear-and-simple-design Canonical interface channel types and shared allowed-value sets keep sampling classification distinct from address construction.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Unknown kinds/paths/value types throw instead of defaulting to scalar interpolation; node identity and pointer syntax remain separate admission responsibilities.
 * @evidence contracts/common.md#meaningful-documentation Docs give the LINEAR quaternion classification rule and the failure boundary, without claiming all track data is validated here.
 * @evidence contracts/performance.md#efficient-algorithms Fixed discriminant/set lookups take O(1) work with no per-call collection allocation.
 * @evidence contracts/performance.md#reuse-equivalent-work Sampling reuses canonical supported-path/value-type sets; no classification cache is needed for this scalar check.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only a boolean or caller-owned error escapes; no channel vector, scene map, handle or task is retained.
 */
export const channelIsRotation: (channel: IAutoMovieChannel) => boolean = (channel: IAutoMovieChannel): boolean => {
  switch (channel.kind) {
    case "node":
      validateNodePath(channel.path);
      return channel.path === "rotation";
    case "pointer":
      validateChannelValueType(channel.valueType);
      return channel.valueType === "quaternion";
    default:
      return throwUnknownChannelKind(channel);
  }
};

const throwUnknownChannelKind: (channel: IAutoMovieChannel) => never = (channel: IAutoMovieChannel): never => {
  const kind: unknown = (channel as { kind: unknown }).kind;
  throw new Error(`unknown channel kind "${String(kind)}"`);
};

const validateNodePath: (path: IAutoMovieNodeChannel["path"]) => void = (path: IAutoMovieNodeChannel["path"]): void => {
  if (!NODE_CHANNEL_PATHS.has(path))
    throw new Error(`unknown channel path "${String(path)}"`);
};

const validateChannelValueType: (valueType: IAutoMoviePointerChannel["valueType"]) => void = (
  valueType: IAutoMoviePointerChannel["valueType"],
): void => {
  if (!CHANNEL_VALUE_TYPES.has(valueType))
    throw new Error(`unknown channel valueType "${String(valueType)}"`);
};
