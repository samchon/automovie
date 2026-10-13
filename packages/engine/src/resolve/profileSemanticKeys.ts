import { IAutoMovieChannel, IAutoMovieProfile } from "@automovie/interface";

/**
 * Every semantic node key a profile references: the exact set of `boneMap`
 * entries {@link bindProfile} will demand. Walks the same references
 * `mapDriver`/`mapChannel` remap (limit node channels; each driver's node
 * fields; pointer channels excluded), deduplicated in first-reference order, so
 * a gate (forgeProp) can report **every** missing mapping in one correction
 * round instead of surfacing bindProfile's first throw at a time.
 */
export const profileSemanticKeys = (profile: IAutoMovieProfile): string[] => {
  const keys: string[] = [];
  const seen = new Set<string>();
  const add = (key: string): void => {
    if (seen.has(key)) return;
    seen.add(key);
    keys.push(key);
  };
  const addChannel = (channel: IAutoMovieChannel): void => {
    if (channel.kind === "node") add(channel.node);
  };

  for (const limit of profile.limits) addChannel(limit.channel);
  for (const driver of profile.drivers)
    switch (driver.type) {
      case "copy":
        add(driver.owner);
        add(driver.source);
        break;
      case "aim":
        add(driver.owner);
        add(driver.target);
        break;
      case "ik":
        driver.chain.forEach(add);
        add(driver.goal);
        if (driver.pole !== null && driver.pole.node !== null)
          add(driver.pole.node);
        break;
      case "parent":
        add(driver.owner);
        add(driver.parent);
        break;
      case "driven":
        addChannel(driver.output);
        addChannel(driver.source);
        break;
      case "spring":
        driver.chain.forEach(add);
        if (driver.center !== null) add(driver.center);
        break;
      default: {
        const unknown = driver as { type?: unknown };
        throw new Error(`unknown driver type "${String(unknown.type)}"`);
      }
    }
  return keys;
};
