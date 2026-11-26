import {
  type IAutoMovieBoundProfile,
  IAutoMovieChannel,
  IAutoMovieChannelLimit,
  IAutoMovieDriver,
  type IAutoMovieProfileApplication,
} from "@automovie/interface";

/**
 * Bind every supported semantic node reference through an own boneMap entry and
 * optional placement prefix. Pointer channels retain their global addresses.
 * Mismatched profile ids and missing node mappings throw before a bound result
 * returns; unchanged nested bounds and curve data remain borrowed.
 */
export function bindProfile(
  application: IAutoMovieProfileApplication,
): IAutoMovieBoundProfile {
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
}

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
