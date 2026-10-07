import type { IHumanSourceMirror } from "./structures/IHumanSourceMirror.ts";
import type { IHumanSourceReadRegion } from "./structures/IHumanSourceReadRegion.ts";

/**
 * The left region's reading: the right reading's loop, seed and outside
 * vertex through the base mesh's mirror table.
 */
export function mirrorHumanSourceReadRegion(
  mirror: IHumanSourceMirror,
  read: IHumanSourceReadRegion,
): IHumanSourceReadRegion {
  return {
    loop: read.loop.map((v) => mirror.twin[v]),
    seed: mirror.twin[read.seed],
    outside: mirror.twin[read.outside],
    frames: read.frames + " (left: mirror twins of the right reading)",
  };
}
