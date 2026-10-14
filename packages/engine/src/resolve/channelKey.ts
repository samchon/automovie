import {
  IAutoMovieChannel,
  IAutoMovieNodeChannel,
  IAutoMoviePointerChannel,
} from "@automovie/interface";

import { CHANNEL_VALUE_TYPES } from "../validation/constants/CHANNEL_VALUE_TYPES";
import { NODE_CHANNEL_PATHS } from "../validation/constants/NODE_CHANNEL_PATHS";

/**
 * Canonical key for a channel. Node channels and pointer channels live in
 * disjoint namespaces (`node:…` vs `ptr:…`) so they can never alias even if a
 * pointer string happened to look like a node path.
 *
 * @evidence contracts/common.md#principled-implementation Validate supported channel kinds/paths/value types and encode node:id:path or ptr:pointer namespaces; the closed path set makes final node-path separation unambiguous even when ids contain colons.
 * @evidence contracts/common.md#clear-and-simple-design One address owner joins sample authority, constraints and driver dependency maps without repeating channel-specific encoders.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Pointer value type is deliberately absent from identity because the addressed property is the same target; this helper does not validate pointer syntax or repair conflicting declarations.
 * @evidence contracts/common.md#meaningful-documentation Docs state disjoint node/pointer namespaces and shared canonical spelling, plus unknown kind/path/value-type refusal.
 * @evidence contracts/performance.md#efficient-algorithms A fixed dispatch/set check and O(S) string construction depend on address text S, with one result string.
 * @evidence contracts/performance.md#reuse-equivalent-work Samplers, clamps and driver ordering reuse this exact key law; changed mutable channel fields require a new key and no global cache is kept.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns the key string; validation sets are borrowed constants and no channel history, host handle or task is retained.
 */
export const channelKey: (channel: IAutoMovieChannel) => string = (
  channel: IAutoMovieChannel,
): string => {
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

const throwUnknownChannelKind: (channel: IAutoMovieChannel) => never = (
  channel: IAutoMovieChannel,
): never => {
  const kind: unknown = (channel as { kind: unknown }).kind;
  throw new Error(`unknown channel kind "${String(kind)}"`);
};

const validateNodePath: (path: IAutoMovieNodeChannel["path"]) => void = (
  path: IAutoMovieNodeChannel["path"],
): void => {
  if (!NODE_CHANNEL_PATHS.has(path))
    throw new Error(`unknown channel path "${String(path)}"`);
};

const validateChannelValueType: (
  valueType: IAutoMoviePointerChannel["valueType"],
) => void = (valueType: IAutoMoviePointerChannel["valueType"]): void => {
  if (!CHANNEL_VALUE_TYPES.has(valueType))
    throw new Error(`unknown channel valueType "${String(valueType)}"`);
};
