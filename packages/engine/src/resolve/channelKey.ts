import { IAutoMovieChannel } from "@automovie/interface";
import { CHANNEL_VALUE_TYPES } from "../validation/CHANNEL_VALUE_TYPES";
import { NODE_CHANNEL_PATHS } from "../validation/NODE_CHANNEL_PATHS";

type IAutoMovieNodeChannel = Extract<IAutoMovieChannel, { kind: "node" }>;

type IAutoMoviePointerChannel = Extract<IAutoMovieChannel, { kind: "pointer" }>;

/**
 * Canonical key for a channel. Node channels and pointer channels live in
 * disjoint namespaces (`node:…` vs `ptr:…`) so they can never alias even if a
 * pointer string happened to look like a node path.
 *
 * @evidence requirements/actors/skeleton-rig-and-retargeting.md#actor-rig-control-drivers Assigns each addressed channel one canonical identity for dependency evaluation.
 * @evidence specifications/performance-motion-and-staging/rig-deformation-and-retargeting.md#performance-rig-rom-control-driver-graph Implements stable channel addressing for driver-graph edges.
 */
export const channelKey = (channel: IAutoMovieChannel): string => {
  switch (channel.kind) {
    case "node":
      validateNodePath(channel.path);
      return `node:${channel.node}:${channel.path}`;
    case "pointer":
      validateChannelValueType(channel.valueType);
      return `ptr:${channel.pointer}`;
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
