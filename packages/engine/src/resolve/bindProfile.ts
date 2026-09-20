import { IAutoMovieChannel, IAutoMovieChannelLimit, IAutoMovieDriver } from "@automovie/interface";
import { IAutoMovieBoundProfile } from "./IAutoMovieBoundProfile";
import { IAutoMovieProfileApplication } from "./IAutoMovieProfileApplication";

/**
 * Bind a profile onto a concrete subtree: resolve every semantic node reference
 * in the profile's declared `limits` and `drivers` through the binding's
 * `boneMap` (then the placement `nodePrefix`), yielding limits and drivers
 * `resolveFrame` can consume directly. This is what makes "profiles are data,
 * not code" executable: a door profile's hinge limit or a humanoid profile's
 * eye aim becomes a live constraint/driver on the bound nodes.
 *
 * Node channels and driver node fields go through the map; **pointer channels
 * pass through untouched** (an RFC-6901 pointer addresses a global property,
 * not a subtree node). A semantic key missing from `boneMap`, or mapping to an
 * empty id, **throws**: a binding that silently dropped a declared constraint
 * would un-constrain the rig without a trace, the exact silent drop the engine
 * refuses everywhere else ({@link motionToClip}, sampled channel validation).
 *
 * @evidence requirements/actors/skeleton-rig-and-retargeting.md#actor-rig-control-drivers Resolves each semantic profile reference to its concrete rig channel.
 * @evidence specifications/performance-motion-and-staging/rig-deformation-and-retargeting.md#performance-rig-rom-control-driver-graph Materializes an executable bound profile for deterministic evaluation.
 * @evidence requirements/motion/channels-controls-and-drivers.md#motion-channel-driver-refusal Rejects a profile application when a required semantic node has no concrete binding.
 * @evidence specifications/performance-motion-and-staging/motion-sampling-and-composition.md#performance-motion-clip-keytime-interpolation Applies driver refusal at the semantic-to-concrete binding boundary.
 * @author Samchon
 */
export const bindProfile = (
  application: IAutoMovieProfileApplication,
): IAutoMovieBoundProfile => {
  const { profile, binding } = application;
  const prefix = application.nodePrefix ?? "";
  if (binding.profile !== profile.id)
    throw new Error(
      `binding targets profile "${binding.profile}" but was applied to "${profile.id}"`,
    );

  const mapNode = (key: string): string => {
    const mapped = binding.boneMap[key];
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

  const mapChannel = (channel: IAutoMovieChannel): IAutoMovieChannel =>
    channel.kind === "node"
      ? { ...channel, node: mapNode(channel.node) }
      : channel;

  const limits = profile.limits.map(
    (limit): IAutoMovieChannelLimit => ({
      ...limit,
      channel: mapChannel(limit.channel),
    }),
  );
  const drivers = profile.drivers.map((driver) =>
    mapDriver(driver, mapNode, mapChannel),
  );
  return { limits, drivers };
};

/** Remap every node reference one driver carries, exhaustively by type. */
const mapDriver = (
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
      const unknown = driver as { type?: unknown };
      throw new Error(`unknown driver type "${String(unknown.type)}"`);
    }
  }
};
