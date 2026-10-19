import { AutoMovieContourLoftCurves64 } from "./AutoMovieContourLoftCurves64";
import { AutoMovieCurveMath64 } from "./AutoMovieCurveMath64";

interface Ring {
  id: string;
  points: AutoMovieCurveMath64.V[];
}

interface Plans<R extends Ring> {
  prepare: (rings: R[], selection: number[]) => void;
  resolve: (rings: R[], selection: number[]) => AutoMovieCurveMath64.V[];
}

/**
 * Freezes branch slit choices before emission and expands them through shared contour refinements.
 * All prepare calls must finish before the first resolve; ring order and point identities remain fixed.
 * Polygon-chord slit parameters are chosen once; the insertion callback supplies
 * the actual source-authoritative endpoint. Subsequent cuts of the same sheet edge enrich that walk without
 * recomputing a nearest point or welding separate sheets by their coordinates.
 *
 * @evidence contracts/common.md#principled-implementation A fixed slit walk retains declared point identity while later shared boundary insertions are expanded in the original oriented sheet order.
 * @evidence contracts/common.md#clear-and-simple-design Preparation chooses slit geometry; resolution consumes the finished common boundary without mutating it.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No proximity weld, source topology, normal field or emission-time seam recomputation substitutes for sheet identity.
 * @evidence contracts/common.md#meaningful-documentation States ordering, the preparation barrier and the distinction between slit decisions and shared refinement.
 * @evidence contracts/performance.md#efficient-algorithms Each planned join uses the curve helper's O(nm) closest-segment search; resolution indexes each shared ring once and emits only the retained walk points.
 * @evidence contracts/performance.md#reuse-equivalent-work Cached slit walks are reused during emission; each resolved boundary index is shared by all adjacent walks in this invocation.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Plan and index maps belong to the returned per-generation closures and expire with their caller; there is no global cache.
 */
export function planAutoMovieContourWalks64<R extends Ring>(
  owner: (point: AutoMovieCurveMath64.V) => R | undefined,
  identity: (point: AutoMovieCurveMath64.V) => string | undefined,
  inserted: (
    point: AutoMovieCurveMath64.V,
    a: AutoMovieCurveMath64.V,
    b: AutoMovieCurveMath64.V,
    t: number,
  ) => void,
): Plans<R> {
  const walks: Map<string, AutoMovieCurveMath64.V[]> = new Map();
  const indices: Map<R, Map<string, number>> = new Map();
  let resolving: boolean = false;
  const name: (rings: R[], selection: number[]) => string = (
    rings: R[],
    selection: number[],
  ): string =>
    JSON.stringify(selection.map((index: number): string => rings[index].id));
  const prepare: (rings: R[], selection: number[]) => void = (
    rings: R[],
    selection: number[],
  ): void => {
    if (resolving)
      throw new Error("Contour walk preparation followed surface resolution");
    if (selection.length < 2) return;
    const key: string = name(rings, selection);
    if (walks.has(key)) return;
    let points: AutoMovieCurveMath64.V[] = [...rings[selection[0]].points];
    for (let i: number = 1; i < selection.length; i++)
      points = AutoMovieContourLoftCurves64.join(
        [...points],
        [...rings[selection[i]].points],
        inserted,
      );
    walks.set(key, points);
  };
  const resolve: (
    rings: R[],
    selection: number[],
  ) => AutoMovieCurveMath64.V[] = (
    rings: R[],
    selection: number[],
  ): AutoMovieCurveMath64.V[] => {
    resolving = true;
    if (selection.length === 1) return rings[selection[0]].points;
    const walk: AutoMovieCurveMath64.V[] | undefined = walks.get(
      name(rings, selection),
    );
    if (!walk)
      throw new Error("Branch contour walk was not prepared before emission");
    const output: AutoMovieCurveMath64.V[] = [];
    for (let i: number = 0; i < walk.length; i++) {
      const p: AutoMovieCurveMath64.V = walk[i];
      const q: AutoMovieCurveMath64.V = walk[(i + 1) % walk.length];
      const ring: R | undefined = owner(p);
      output.push(p);
      if (!ring || owner(q) !== ring || identity(p) === identity(q)) continue;
      if (!indices.has(ring))
        indices.set(
          ring,
          new Map(
            ring.points.map(
              (
                point: AutoMovieCurveMath64.V,
                index: number,
              ): [string, number] => {
                const key: string | undefined = identity(point);
                if (key === undefined)
                  throw new Error(
                    "Refined contour point has no sheet identity",
                  );
                return [key, index];
              },
            ),
          ),
        );
      const lookup: Map<string, number> = indices.get(ring)!;
      const start: number | undefined = lookup.get(identity(p)!);
      const end: number | undefined = lookup.get(identity(q)!);
      if (start === undefined || end === undefined)
        throw new Error(
          "Prepared slit endpoint left its shared generating contour",
        );
      for (
        let j: number = (start + 1) % ring.points.length;
        j !== end;
        j = (j + 1) % ring.points.length
      )
        output.push(ring.points[j]);
    }
    return output;
  };
  return { prepare, resolve };
}
