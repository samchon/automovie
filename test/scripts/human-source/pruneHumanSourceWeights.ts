import { humanSourceBodyBones } from "./humanSourceBodyBones.ts";
import { roundHalfEven } from "./roundHalfEven.ts";

const slotOf = new Map(
  Object.entries(humanSourceBodyBones).map(([slot, bone]) => [bone, slot]),
);

/**
 * The deleted body extractor's skin-weight storage: keep MPFB bones that map
 * to a humanoid slot, take the four largest (stable for ties), renormalize
 * them to sum one and round each to seven decimals, half to even. Refuses a
 * vertex with no mapped weight instead of inventing one.
 */
export function pruneHumanSourceWeights(
  rows: readonly (readonly [string, number])[],
): [string, number][] {
  const named = rows
    .filter(([bone]) => slotOf.has(bone))
    .map(([bone, weight]): [string, number] => [slotOf.get(bone)!, weight])
    .map((row, order) => ({ row, order }))
    .sort((x, y) => y.row[1] - x.row[1] || x.order - y.order)
    .map(({ row }) => row)
    .slice(0, 4);
  const total = named.reduce((sum, [, weight]) => sum + weight, 0);
  if (!(total > 0)) throw new Error("A skin vertex has no mapped bone weight.");
  return named.map(([slot, weight]): [string, number] => [
    slot,
    roundHalfEven(weight / total, 7),
  ]);
}
