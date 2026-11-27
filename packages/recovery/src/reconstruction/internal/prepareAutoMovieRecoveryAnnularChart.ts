import type {
  IAutoMovieRecoveryAnnularChart,
  IAutoMovieRecoveryEventCurveArc,
} from "@automovie/interface";

import { AutoMovieRecoveryEventCurve as E } from "../../observation/AutoMovieRecoveryEventCurve";

/*
 * Bind two named closed paths to one explicit, shared periodic seam. The paths
 * retain their full three-dimensional boundaries, including varying Y. The
 * resulting chart declares an interpolant domain, not source-surface fidelity.
 */
export function prepareAutoMovieRecoveryAnnularChart(
  bottom: IAutoMovieRecoveryEventCurveArc,
  top: IAutoMovieRecoveryEventCurveArc,
  id: string,
): IAutoMovieRecoveryAnnularChart {
  E.knots(bottom);
  E.knots(top);
  if (
    !id.trim() ||
    !E.same(
      E.controls(bottom.pieces[0]!)[0],
      E.controls(bottom.pieces.at(-1)!)[3],
    ) ||
    !E.same(E.controls(top.pieces[0]!)[0], E.controls(top.pieces.at(-1)!)[3])
  )
    throw new Error(
      "An annular chart requires named, exactly closed boundary paths",
    );
  const seam: IAutoMovieRecoveryEventCurveArc = E.line(
    E.controls(bottom.pieces[0]!)[0],
    E.controls(top.pieces[0]!)[0],
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
