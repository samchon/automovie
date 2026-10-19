import { AutoMovieBernsteinSubdivision64 as S } from "./AutoMovieBernsteinSubdivision64";
import { AutoMovieContourLoftCurves64 as C } from "./AutoMovieContourLoftCurves64";
import { AutoMovieCurveMath64 as M } from "./AutoMovieCurveMath64";

/**
 * Split a retained source restriction at its declared interior phase and repartition
 * both children under the same finite-segment chord bound. A parent's bound need
 * not hold against a child's different chord, even for a straight geometric trace.
 * The shared point is the Bernstein split endpoint, never its proxy chord point.
 * Ancestry depth and phase limits are inherited without resetting subdivision.
 * Already qualified explicit children need no additional adaptive work, even if
 * their exact restriction increases ancestry beyond the adaptive depth limit.
 *
 * @evidence contracts/common.md#principled-implementation De Casteljau produces two restrictions at the declared source phase; the existing adaptive partition re-establishes each child's original physical chord condition.
 * @evidence contracts/common.md#clear-and-simple-design One source-leaf operation supplies a common evaluated endpoint and both positive-orientation child partitions to the loft owner.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No inverse nearest fit, chord interpolation, coordinate weld, depth reset or tolerance change replaces the saved coefficient authority.
 * @evidence contracts/common.md#meaningful-documentation States phase orientation, shared endpoint meaning, inherited numeric limits and why child chord bounds require fresh evaluation.
 * @evidence contracts/performance.md#efficient-algorithms A constant-degree split precedes the existing adaptive work for the two child restrictions, retaining the original thirty-level limit.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Each call splits one newly selected source phase; invocation-owned leaf control materialization is reused by the curve owner.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Returned child nets and the shared endpoint belong to the caller; source coefficients remain immutable and no global cache or external resource is retained.
 */
export function splitAutoMovieContourLeaf64(
  source: C.Leaf,
  phase: number,
  toleranceMm: number,
): { point: M.V; before: C.Leaf[]; after: C.Leaf[] } {
  if (!(phase > source.start && phase < source.end))
    throw new Error("A source slit needs a strict interior generating phase");
  const parameter: number =
    (phase - source.start) / (source.end - source.start);
  if (!(parameter > 0 && parameter < 1))
    throw new Error("Interior source slit parameter is not representable");
  const halves: [M.V[], M.V[]] = S.split(C.controls(source), parameter);
  const depth: number = source.depth + 1;
  const before: C.Leaf[] = C.partition(
    { net: halves[0], start: source.start, end: phase, depth },
    toleranceMm,
  );
  const after: C.Leaf[] = C.partition(
    { net: halves[1], start: phase, end: source.end, depth },
    toleranceMm,
  );
  return { point: M.clone(halves[0][3]), before, after };
}
