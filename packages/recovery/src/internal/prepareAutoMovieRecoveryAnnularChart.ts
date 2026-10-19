import { AutoMovieRecoveryEventCurve as E } from "./AutoMovieRecoveryEventCurve";

/**
 * Bind two named closed paths to one explicit, shared periodic seam.
 * The paths retain their full three-dimensional boundaries, including varying Y.
 * The resulting chart declares an interpolant domain, not source-surface fidelity.
 *
 * @evidence contracts/common.md#principled-implementation One degree-elevated straight cubic joins the actual first boundary points. Both seam occurrences share its coefficient object; original endpoint aliases follow native occurrence direction.
 * @evidence contracts/common.md#clear-and-simple-design Occurrence algebra owns native identity; this function owns the annular cut and returns four named sides for a surface compiler.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No source faces, horizontal-coordinate overwrite, nearest-point attachment, weld, endpoint averaging or arbitrary bank reversal enters the chart.
 * @evidence contracts/common.md#meaningful-documentation A periodic chart identifies its two seam occurrences; C0 and topology do not imply regularity, physical correspondence, normal continuity or embedding.
 * @evidence contracts/performance.md#efficient-algorithms Phase and endpoint admission use O(A+B) time for the supplied piece counts; seam construction has fixed cost and stores one cubic.
 * @evidence contracts/performance.md#reuse-equivalent-work Both left and right reference the same seam arc; native boundary controls are not refitted or duplicated.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The result references caller-owned bottom/top arcs and owns one fresh seam. No global registry, cache or external resource survives the call.
 */
export function prepareAutoMovieRecoveryAnnularChart(
  bottom: E.Arc,
  top: E.Arc,
  id: string,
): { bottom: E.Arc; top: E.Arc; left: E.Arc; right: E.Arc; periodic: true } {
  E.knots(bottom);
  E.knots(top);
  if (
    !id.trim() ||
    !E.same(bottom.pieces[0]!.net[0], bottom.pieces.at(-1)!.net[3]) ||
    !E.same(top.pieces[0]!.net[0], top.pieces.at(-1)!.net[3])
  )
    throw new Error(
      "An annular chart requires named, exactly closed boundary paths",
    );
  const seam: E.Arc = E.line(
    bottom.pieces[0]!.net[0],
    top.pieces[0]!.net[0],
    `${id}.periodic-seam`,
  );
  for (const [index, arc] of [
    [0, bottom],
    [1, top],
  ] as const) {
    const authority: string | null = E.endpointAuthority(arc.pieces[0]!, 0);
    if (authority !== null)
      seam.pieces[0]!.source.endpointAuthorities[index] = authority;
  }
  return { bottom, top, left: seam, right: seam, periodic: true };
}
