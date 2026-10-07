import type { IHumanSourceLandmarkPick } from "./structures/IHumanSourceLandmarkPick.ts";
import type { IHumanSourceReadLandmark } from "./structures/IHumanSourceReadLandmark.ts";

/**
 * Take a frame-read head landmark as its pick: the chosen vertex first, then
 * the neighbours the reading compared, each with its neutral position and
 * height. The vertex must belong to the head partition, or the name is
 * refused.
 */
export function selectHumanSourceReadLandmark(
  name: string,
  positions: readonly number[],
  head: Uint8Array,
  read: IHumanSourceReadLandmark,
): IHumanSourceLandmarkPick {
  if (head[read.vertex] !== 1)
    throw new Error(
      `Head landmark ${name}: read vertex ${read.vertex} is not on the head partition.`,
    );
  return {
    vertex: read.vertex,
    candidates: [read.vertex, ...read.neighbours].map((vertex) => ({
      vertex,
      position: [0, 1, 2].map((c) => positions[3 * vertex + c]),
      value: positions[3 * vertex + 1],
    })),
  };
}
