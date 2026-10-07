import type { IAutoMovieHumanBodyBasis } from "@automovie/human/body/structures/IAutoMovieHumanBodyBasis";

import { readHumanSourceLandmarkRow } from "./readHumanSourceLandmarkRow.ts";
import type { IHumanSourceBoundPart } from "./structures/IHumanSourceBoundPart.ts";

/**
 * Read a bound part vertex's row under a body endpoint, in the head frame.
 * A surface vertex takes its nearest skin point's row. A rigid vertex takes
 * its frame's translation: a frame that is a body landmark moves with that
 * landmark relative to the anchor carry; any other frame moves with the mean
 * row of the skin points nearest its vertices, so the group never stretches.
 */
export function createHumanSourcePartRow(
  bound: IHumanSourceBoundPart,
  body: IAutoMovieHumanBodyBasis,
  anchorOf: (name: string) => number[],
  pointRow: (
    name: string,
    triangle: number,
    weights: readonly number[],
  ) => number[],
): (name: string, v: number) => number[] {
  const skinRow = (name: string, v: number): number[] =>
    pointRow(name, bound.triangles[v], bound.weights.slice(3 * v, 3 * v + 3));
  const cache = new Map<string, number[]>();
  const translation = (name: string, frame: string): number[] => {
    const key = `${name}|${frame}`;
    let row = cache.get(key);
    if (row === undefined) {
      const index = body.landmarks.ids.indexOf(frame);
      if (index >= 0) {
        const anchor = anchorOf(name);
        row = readHumanSourceLandmarkRow(body, name, index).map(
          (x, c) => x - anchor[c],
        );
      } else {
        const sum = [0, 0, 0];
        const list = bound.members.get(frame)!;
        for (const v of list)
          skinRow(name, v).forEach((x, c) => (sum[c] += x / list.length));
        row = sum;
      }
      cache.set(key, row);
    }
    return row;
  };
  return (name, v) =>
    bound.rigid ? translation(name, bound.binding.frames[v]) : skinRow(name, v);
}
