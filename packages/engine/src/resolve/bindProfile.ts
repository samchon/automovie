import {
  IAutoMovieChannel,
  IAutoMovieChannelLimit,
  IAutoMovieDriver,
} from "@automovie/interface";

import { IAutoMovieBoundProfile } from "./IAutoMovieBoundProfile";
import { IAutoMovieProfileApplication } from "./IAutoMovieProfileApplication";

/**
 * Bind every supported semantic node reference through an own boneMap entry and optional placement prefix. Pointer channels retain their global addresses. Mismatched profile ids and missing/blank node mappings throw before a bound result returns; unchanged nested bounds and curve data remain borrowed.
 *
 * @evidence contracts/common.md#principled-implementation Resolve every supported driver/node-channel reference through own semantic map entries and a literal placement prefix; enforce matching profile id and refuse missing/blank mappings, while pointer channels retain global addresses.
 * @evidence contracts/common.md#clear-and-simple-design One mapping closure and exhaustive driver switch keep concrete binding separate from frame evaluation and authored profile policy.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Inherited constructor/prototype members never count as authored mappings; actual own reserved-name entries remain supported and no constraint is silently dropped.
 * @evidence contracts/common.md#meaningful-documentation Docs state pointer pass-through, prefix semantics and profile/mapping refusal; bounds and unchanged nested data remain borrowed in fresh limit/driver wrappers.
 * @evidence contracts/performance.md#efficient-algorithms L limits and D drivers require O(L+D+R) reference visits plus output id text, with proportional mapped arrays and no scene-wide scan.
 * @evidence contracts/performance.md#reuse-equivalent-work A single mapping closure serves all fields in one binding; callers may retain completed bindings only while profile contents, own map and prefix remain unchanged.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns new limit/driver arrays, while authored nested bounds/curve data remain borrowed; no registry, graph, handle or task survives the call.
 */
export const bindProfile: (
  application: IAutoMovieProfileApplication,
) => IAutoMovieBoundProfile = (
  application: IAutoMovieProfileApplication,
): IAutoMovieBoundProfile => {
  const { profile, binding }: IAutoMovieProfileApplication = application;
  const prefix: string = application.nodePrefix ?? "";
  if (binding.profile !== profile.id)
    throw new Error(
      `binding targets profile "${binding.profile}" but was applied to "${profile.id}"`,
    );

  const mapNode: (key: string) => string = (key: string): string => {
    const mapped: string | undefined = Object.hasOwn(binding.boneMap, key)
      ? binding.boneMap[key]
      : undefined;
    if (mapped === undefined)
      throw new Error(
        `profile "${profile.id}" binding has no boneMap entry for "${key}"`,
      );
    if (mapped.trim().length === 0)
      throw new Error(
        `profile "${profile.id}" binding maps "${key}" to an empty node id`,
      );
    return `${prefix}${mapped}`;
  };

  const mapChannel: (channel: IAutoMovieChannel) => IAutoMovieChannel = (
    channel: IAutoMovieChannel,
  ): IAutoMovieChannel =>
    channel.kind === "node"
      ? { ...channel, node: mapNode(channel.node) }
      : channel;

  const limits: IAutoMovieChannelLimit[] = profile.limits.map(
    (limit: IAutoMovieChannelLimit): IAutoMovieChannelLimit => ({
      ...limit,
      channel: mapChannel(limit.channel),
    }),
  );
  const drivers: IAutoMovieDriver[] = profile.drivers.map(
    (driver: IAutoMovieDriver): IAutoMovieDriver =>
      mapDriver(driver, mapNode, mapChannel),
  );
  return { limits, drivers };
};

/** Remap every node reference one driver carries, exhaustively by type. */
const mapDriver: (
  driver: IAutoMovieDriver,
  mapNode: (key: string) => string,
  mapChannel: (channel: IAutoMovieChannel) => IAutoMovieChannel,
) => IAutoMovieDriver = (
  driver: IAutoMovieDriver,
  mapNode: (key: string) => string,
  mapChannel: (channel: IAutoMovieChannel) => IAutoMovieChannel,
): IAutoMovieDriver => {
  switch (driver.type) {
    case "copy":
      return {
        ...driver,
        owner: mapNode(driver.owner),
        source: mapNode(driver.source),
      };
    case "aim":
      return {
        ...driver,
        owner: mapNode(driver.owner),
        target: mapNode(driver.target),
      };
    case "ik":
      return {
        ...driver,
        chain: driver.chain.map(mapNode),
        goal: mapNode(driver.goal),
        pole:
          driver.pole === null
            ? null
            : {
                ...driver.pole,
                node:
                  driver.pole.node === null ? null : mapNode(driver.pole.node),
              },
      };
    case "parent":
      return {
        ...driver,
        owner: mapNode(driver.owner),
        parent: mapNode(driver.parent),
      };
    case "driven":
      return {
        ...driver,
        output: mapChannel(driver.output),
        source: mapChannel(driver.source),
      };
    case "spring":
      return {
        ...driver,
        chain: driver.chain.map(mapNode),
        center: driver.center === null ? null : mapNode(driver.center),
      };
    default: {
      const unknown: { type?: unknown } = driver as { type?: unknown };
      throw new Error(`unknown driver type "${String(unknown.type)}"`);
    }
  }
};
