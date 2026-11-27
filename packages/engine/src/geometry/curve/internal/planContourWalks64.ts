import type {
  AutoMovieVector3Tuple,
  IAutoMoviePlanContourWalks64Plans,
  IAutoMoviePlanContourWalks64Ring,
} from "@automovie/interface";

import { AutoMovieEngineContourLoftCurves64 } from "../../AutoMovieEngineContourLoftCurves64";

/*
 * Freezes branch slit choices before emission and expands them through shared
 * contour refinements. All prepare calls must finish before the first resolve;
 * ring order and point identities remain fixed. Polygon-chord slit parameters
 * are chosen once; the insertion callback supplies the actual
 * source-authoritative endpoint. Subsequent cuts of the same sheet edge enrich
 * that walk without recomputing a nearest point or welding separate sheets by
 * their coordinates.
 */
export function planContourWalks64<
  R extends IAutoMoviePlanContourWalks64Ring,
>(
  owner: (point: AutoMovieVector3Tuple) => R | undefined,
  identity: (point: AutoMovieVector3Tuple) => string | undefined,
  inserted: (
    point: AutoMovieVector3Tuple,
    a: AutoMovieVector3Tuple,
    b: AutoMovieVector3Tuple,
    t: number,
  ) => void,
): IAutoMoviePlanContourWalks64Plans<R> {
  const walks: Map<string, AutoMovieVector3Tuple[]> = new Map();
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
    let points: AutoMovieVector3Tuple[] = [...rings[selection[0]].points];
    for (let i: number = 1; i < selection.length; i++)
      points = AutoMovieEngineContourLoftCurves64.join(
        [...points],
        [...rings[selection[i]].points],
        inserted,
      );
    walks.set(key, points);
  };
  const resolve: (
    rings: R[],
    selection: number[],
  ) => AutoMovieVector3Tuple[] = (
    rings: R[],
    selection: number[],
  ): AutoMovieVector3Tuple[] => {
    resolving = true;
    if (selection.length === 1) return rings[selection[0]].points;
    const walk: AutoMovieVector3Tuple[] | undefined = walks.get(
      name(rings, selection),
    );
    if (!walk)
      throw new Error("Branch contour walk was not prepared before emission");
    const output: AutoMovieVector3Tuple[] = [];
    for (let i: number = 0; i < walk.length; i++) {
      const p: AutoMovieVector3Tuple = walk[i];
      const q: AutoMovieVector3Tuple = walk[(i + 1) % walk.length];
      const ring: R | undefined = owner(p);
      output.push(p);
      if (!ring || owner(q) !== ring || identity(p) === identity(q)) continue;
      if (!indices.has(ring))
        indices.set(
          ring,
          new Map(
            ring.points.map(
              (
                point: AutoMovieVector3Tuple,
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
