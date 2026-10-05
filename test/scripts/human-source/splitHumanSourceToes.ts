import type { IAutoMovieHumanBodyBasisSurface } from "@automovie/human/body/structures/surface/IAutoMovieHumanBodyBasisSurface";
import type { IAutoMovieHumanBodyToeRay } from "@automovie/human/body/structures/rig/IAutoMovieHumanBodyToeRay";

import { humanSourceWeightTolerance } from "./humanSourceWeightTolerance.ts";
import { roundHalfEven } from "./roundHalfEven.ts";
import type { IHumanSourceToeSplit } from "./structures/IHumanSourceToeSplit.ts";

/** Storage decimals of a share: the skin weight storage step 1e-7. */
const DECIMALS = 7;
/**
 * How far a side's sampled phalanx weights may sum from its toes weight: one
 * storage step of the CC0 weight files (four-decimal values), plus the body's
 * weight storage. The CC0 data itself partitions only to that step: base
 * vertex 13106 carries ball_l 1 and phalanx weights summing to 0.9999.
 */
const PARTITION_TOLERANCE = 1e-4 + 4 * humanSourceWeightTolerance;

/**
 * Split each body vertex's toes weight between the toe ray bones.
 *
 * A vertex with positive weight on a humanoid toes bone is listed. Its rows
 * are the sampled default-rig phalanx weights at its sample, both sides
 * together, and each share is the row's weight over the rows' total. The
 * consumer applies one vertex's shares to every toes slot it carries, so a
 * vertex weighted to both toes bones (the CC0 data gives a few toe-tip
 * vertices a trace on the other side) gives each phalanx exactly
 * (toes weight total) x share, its own sampled weight up to the partition
 * tolerance. Per side, the phalanx weights must sum to that side's toes
 * weight within the tolerance, or the split refuses: it divides exactly the
 * weight the body already gives the toes, never moves weight between sides.
 * Shares are stored at 1e-7; a row whose share rounds to zero is left out and
 * the last row absorbs the rounding so the shares sum to one exactly.
 */
export function splitHumanSourceToes(
  rays: readonly IAutoMovieHumanBodyToeRay[],
  toes: IAutoMovieHumanBodyBasisSurface["skin"],
  sampleOf: (vertex: number) => number,
  sampleRays: readonly [string, number][][],
): IHumanSourceToeSplit {
  const bones = rays.map((r) => r.bone);
  const sourceIndex = new Map(rays.map((r, i) => [r.source, i]));
  const vertices: number[] = [];
  const offsets: number[] = [0];
  const bonesIndex: number[] = [];
  const shares: number[] = [];
  let twoSided = 0;
  let largestDeviation = 0;
  const deviating: number[] = [];
  const count = toes.boneIndices.length / 4;
  for (let v = 0; v < count; v++) {
    const sideWeight = { left: 0, right: 0 };
    for (let k = 0; k < 4; k++) {
      const joint = toes.joints[toes.boneIndices[4 * v + k]];
      const w = toes.weights[4 * v + k];
      if (w > 0 && joint === "leftToes") sideWeight.left += w;
      if (w > 0 && joint === "rightToes") sideWeight.right += w;
    }
    if (sideWeight.left === 0 && sideWeight.right === 0) continue;
    if (sideWeight.left > 0 && sideWeight.right > 0) twoSided++;
    const sample = sampleOf(v);
    const rows = (sampleRays[sample] ?? []).filter(([bone, w]) => w > 0 && sourceIndex.has(bone));
    for (const [side, suffix] of [["left", ".L"], ["right", ".R"]] as const) {
      const sum = rows.filter(([bone]) => bone.endsWith(suffix)).reduce((s, [, w]) => s + w, 0);
      const deviation = Math.abs(sum - sideWeight[side]);
      if (deviation > PARTITION_TOLERANCE)
        throw new Error(`Toe split: vertex ${v} (sample ${sample}) has ${side} toes weight ${sideWeight[side]} but ${side} phalanx weights summing to ${sum}.`);
      largestDeviation = Math.max(largestDeviation, deviation);
      if (deviation > 4 * humanSourceWeightTolerance && !deviating.includes(v)) deviating.push(v);
    }
    const total = rows.reduce((s, [, w]) => s + w, 0);
    rows.sort((a, b) => sourceIndex.get(a[0])! - sourceIndex.get(b[0])!);
    const kept = rows.map(([bone, w]): [number, number] => [sourceIndex.get(bone)!, roundHalfEven(w / total, DECIMALS)]).filter(([, share]) => share > 0);
    const spent = kept.slice(0, -1).reduce((s, [, share]) => s + share, 0);
    const last = roundHalfEven(1 - spent, DECIMALS);
    if (kept.length === 0 || !(last > 0)) throw new Error(`Toe split: vertex ${v} has no positive phalanx share.`);
    kept[kept.length - 1][1] = last;
    for (const [index, share] of kept) {
      bonesIndex.push(index);
      shares.push(share);
    }
    vertices.push(v);
    offsets.push(shares.length);
  }
  return {
    split: { bones, vertices, offsets, bonesIndex, shares },
    record: {
      vertices: vertices.length,
      twoSided,
      partitionTolerance: PARTITION_TOLERANCE,
      largestSideDeviation: largestDeviation,
      verticesBeyondWeightStorage: deviating.length,
      rule: "rows = sampled default-rig phalanx weights of both sides; share = weight / rows total; per side the phalanx sum equals the side's toes weight within one CC0 storage step",
    },
  };
}
