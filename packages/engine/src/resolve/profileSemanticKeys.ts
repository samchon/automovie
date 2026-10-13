import { IAutoMovieChannel, IAutoMovieProfile } from "@automovie/interface";

/**
 * List every supported profile node reference in first-reference order, deduplicated, so forgeProp can report all missing mappings. Pointer channels are global and excluded; unknown driver kinds throw.
 *
 * @evidence contracts/common.md#principled-implementation Enumerate supported limit/driver node references, exclude global pointers and deduplicate in first-reference order, matching fields bindProfile remaps.
 * @evidence contracts/common.md#clear-and-simple-design A set-backed collector lets forgeProp report all absent mappings before concrete binding.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Unknown driver kinds throw and no key is inferred from unrelated payload names or fixture ids.
 * @evidence contracts/common.md#meaningful-documentation Docs identify demanded boneMap entries, pointer exclusion and deterministic order.
 * @evidence contracts/performance.md#efficient-algorithms L limits, D drivers and R chain references cost O(L+D+R), with O(K) distinct-key storage.
 * @evidence contracts/performance.md#reuse-equivalent-work One local set shares repeated references across the profile; changed authored data requires fresh enumeration.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns the returned key array, with no bound graph, profile cache, native handle or task retained.
 */
export const profileSemanticKeys: (profile: IAutoMovieProfile) => string[] = (profile: IAutoMovieProfile): string[] => {
  const keys: string[] = [];
  const seen: Set<string> = new Set<string>();
  const add: (key: string) => void = (key: string): void => {
    if (seen.has(key)) return;
    seen.add(key);
    keys.push(key);
  };
  const addChannel: (channel: IAutoMovieChannel) => void = (channel: IAutoMovieChannel): void => {
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
        const unknown: { type?: unknown; } = driver as { type?: unknown };
        throw new Error(`unknown driver type "${String(unknown.type)}"`);
      }
    }
  return keys;
};
