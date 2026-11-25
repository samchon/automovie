import type {
  AutoMovieVector3Tuple,
  IAutoMovieContourLoftCurves64,
  IAutoMovieSplitContourLeaf64,
} from "@automovie/interface";

import { AutoMovieBernsteinSubdivision64 as S } from "./AutoMovieBernsteinSubdivision64";
import { AutoMovieContourLoftCurves64 as C } from "./AutoMovieContourLoftCurves64";
import { AutoMovieCurveMath64 as M } from "./AutoMovieCurveMath64";

/**
 * Split a retained source restriction at its declared interior phase and
 * repartition both children under the same finite-segment chord bound. A
 * parent's bound need not hold against a child's different chord, even for a
 * straight geometric trace. The shared point is the Bernstein split endpoint,
 * never its proxy chord point. Ancestry depth and phase limits are inherited
 * without resetting subdivision. Already qualified explicit children need no
 * additional adaptive work, even if their exact restriction increases ancestry
 * beyond the adaptive depth limit.
 */
export function splitAutoMovieContourLeaf64(
  source: IAutoMovieContourLoftCurves64.Leaf,
  phase: number,
  toleranceMm: number,
): IAutoMovieSplitContourLeaf64.IResult {
  if (!(phase > source.start && phase < source.end))
    throw new Error("A source slit needs a strict interior generating phase");
  const parameter: number =
    (phase - source.start) / (source.end - source.start);
  if (!(parameter > 0 && parameter < 1))
    throw new Error("Interior source slit parameter is not representable");
  const halves: [AutoMovieVector3Tuple[], AutoMovieVector3Tuple[]] = S.split(
    C.controls(source),
    parameter,
  );
  const depth: number = source.depth + 1;
  const before: IAutoMovieContourLoftCurves64.Leaf[] = C.partition(
    { net: halves[0], start: source.start, end: phase, depth },
    toleranceMm,
  );
  const after: IAutoMovieContourLoftCurves64.Leaf[] = C.partition(
    { net: halves[1], start: phase, end: source.end, depth },
    toleranceMm,
  );
  return { point: M.clone(halves[0][3]), before, after };
}
