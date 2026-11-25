import type {
  IAutoMoviePhysicalHullFaces,
  IAutoMovieVector3,
} from "@automovie/interface";

/**
 * Every distinct edge of a hull, once, as the pair of its two corner points in
 * the order the faces' loops first walk it.
 *
 * @param hull The hull whose faces are walked.
 * @returns One segment per unordered pair of adjacent corners.
 */
export function physicalHullEdges(
  hull: Pick<IAutoMoviePhysicalHullFaces.IHull, "faces">,
): [IAutoMovieVector3, IAutoMovieVector3][] {
  const index: Map<IAutoMovieVector3, number> = new Map();
  const seen: Set<string> = new Set();
  const segments: [IAutoMovieVector3, IAutoMovieVector3][] = [];
  for (const face of hull.faces)
    face.loop.forEach((from: IAutoMovieVector3, at: number): void => {
      const to: IAutoMovieVector3 = face.loop[(at + 1) % face.loop.length]!;
      for (const p of [from, to]) if (!index.has(p)) index.set(p, index.size);
      const i: number = index.get(from)!;
      const j: number = index.get(to)!;
      const key: string = i < j ? `${i}:${j}` : `${j}:${i}`;
      if (seen.has(key)) return;
      seen.add(key);
      segments.push([from, to]);
    });
  return segments;
}
