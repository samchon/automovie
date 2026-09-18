import { IAutoMovieChannel } from "@automovie/interface";
import { CHANNEL_VALUE_TYPES } from "../validation/CHANNEL_VALUE_TYPES";
import { NODE_CHANNEL_PATHS } from "../validation/NODE_CHANNEL_PATHS";

type IAutoMovieNodeChannel = Extract<IAutoMovieChannel, { kind: "node" }>;

type IAutoMoviePointerChannel = Extract<IAutoMovieChannel, { kind: "pointer" }>;

/**
 * Whether a channel carries a rotation (a quaternion), which the sample pass
 * must interpolate with slerp rather than component-wise lerp, the glTF rule
 * for LINEAR rotation tracks.
 *
 * @evidence requirements/actors/skeleton-rig-and-retargeting.md#actor-rig-control-drivers Preserves quaternion semantics when evaluating a rotation channel.
 * @evidence specifications/performance-motion-and-staging/rig-deformation-and-retargeting.md#performance-rig-rom-control-driver-graph Classifies graph channels so rotation values retain their declared evaluation rule.
 */
export const channelIsRotation = (channel: IAutoMovieChannel): boolean => {
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

const throwUnknownChannelKind = (channel: IAutoMovieChannel): never => {
  const kind = (channel as { kind: unknown }).kind;
  throw new Error(`unknown channel kind "${String(kind)}"`);
};

const validateNodePath = (path: IAutoMovieNodeChannel["path"]): void => {
  if (!NODE_CHANNEL_PATHS.has(path))
    throw new Error(`unknown channel path "${String(path)}"`);
};

const validateChannelValueType = (
  valueType: IAutoMoviePointerChannel["valueType"],
): void => {
  if (!CHANNEL_VALUE_TYPES.has(valueType))
    throw new Error(`unknown channel valueType "${String(valueType)}"`);
};
