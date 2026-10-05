import type { IHumanSourceDriverInput } from "./structures/IHumanSourceDriverInput.ts";

/**
 * List, sorted, the body endpoints whose state drives head-partition data: a
 * head-shaping endpoint with a head-only skin row, an endpoint with part rows
 * or face landmark rows, and the endpoint a face corrective reads through a
 * body channel.
 */
export function collectHumanSourceDrivers(input: IHumanSourceDriverInput): string[] {
  const { generation, headOnly, headShaping, bodyKeys, parts, landmarks } = input;
  const n = generation.skin.originalVertices;
  const out = new Set<string>();
  for (const name of headShaping) {
    const rows = generation.targets[name] ?? [];
    for (let i = 0; i < rows.length; i += 4) if (rows[i] < n && headOnly[rows[i]] === 1) out.add(name);
  }
  for (const part of parts) for (const name of Object.keys(part.bodyTargets)) out.add(name);
  for (const set of landmarks) if (set.origin === "face") for (const name of Object.keys(set.targets)) if (bodyKeys.has(name)) out.add(name);
  const bodyChannel = new Map(generation.channels.filter((c) => c.origin === "body").map((c) => [c.id, c]));
  for (const corrective of generation.correctives)
    if (corrective.origin === "face")
      for (const driver of corrective.inputs)
        if ("channel" in driver && bodyChannel.has(driver.channel)) {
          const channel = bodyChannel.get(driver.channel)!;
          const endpoint = driver.side === "negative" ? channel.negative : channel.positive;
          if (endpoint !== null) out.add(endpoint);
        }
  return [...out].sort((x, y) => (x < y ? -1 : x > y ? 1 : 0));
}
