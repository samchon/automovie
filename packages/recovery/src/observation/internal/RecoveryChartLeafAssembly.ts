import { AutoMovieBernstein64 as S } from "@automovie/engine";
import type {
  AutoMovieVector3Tuple,
  IAutoMovieBicubicAtlasGeometry,
  IAutoMovieRecoveryChartLeafAssembly,
} from "@automovie/interface";

/**
 * Publish source-free canonical intervals for a fitted rectangular leaf atlas.
 * Internal master edges retain their fitted coefficient owners. Outer edges use
 * the original shared fitted boundary span and oriented restriction metadata.
 * Each chart owns a separate analytic normal fan; positional sharing never
 * averages the transverse derivatives of a crease or claims G1 continuity.
 */
export function RecoveryChartLeafAssembly(
  charts: Parameters<IAutoMovieRecoveryChartLeafAssembly.Operation>[0],
): ReturnType<IAutoMovieRecoveryChartLeafAssembly.Operation> {
  const controlsMm: Readonly<AutoMovieVector3Tuple>[] = [],
    patches: IAutoMovieBicubicAtlasGeometry["patches"] = [],
    boundaryAuthorities: NonNullable<
      IAutoMovieBicubicAtlasGeometry["boundaryAuthorities"]
    > = [],
    boundaryBindings: NonNullable<
      IAutoMovieBicubicAtlasGeometry["boundaryBindings"]
    > = [];
  const authorities: Map<
      string,
      NonNullable<IAutoMovieBicubicAtlasGeometry["boundaryAuthorities"]>[number]
    > = new Map(),
    uses: Map<string, number> = new Map();
  let maximumCanonicalRestrictionDifferenceMm: number = 0;
  for (const chart of charts) {
    const offset: number = controlsMm.length;
    controlsMm.push(...chart.controlsMm);
    for (const patch of chart.patches)
      patches.push({
        id: patch.id,
        controlIds: patch.controlIds.map((id: number): number => offset + id),
      });
    const local: Map<
      string,
      { authority: string; start: number; end: number; normalFan: string }
    > = new Map();
    for (const edge of chart.leafLayout.edges) {
      let authority: string = `${chart.name}.master.${edge.id}`,
        start: number = 0,
        end: number = 1,
        normalFan: string = chart.name;
      let ids: [number, number, number, number] = [
        offset + edge.controlIds[0],
        offset + edge.controlIds[1],
        offset + edge.controlIds[2],
        offset + edge.controlIds[3],
      ];
      if (edge.line === 0 || edge.line === 1) {
        const side: number =
          edge.axis === 0 ? (edge.line === 0 ? 0 : 2) : edge.line === 0 ? 3 : 1;
        normalFan = `${chart.name}.boundary-bank.${side}`;
        const whole: (typeof chart.boundaries)[number] & {
          pieces?: {
            start: number;
            end: number;
            knots: number[];
            boundary: (typeof chart.boundaries)[number];
          }[];
        } = chart.boundaries[side]!;
        const piece: NonNullable<typeof whole.pieces>[number] | undefined =
          whole.pieces?.find(
            (candidate: NonNullable<typeof whole.pieces>[number]): boolean =>
              edge.start >= candidate.start && edge.end <= candidate.end,
          );
        if (whole.pieces && !piece)
          throw new Error(
            "An outer leaf crosses a registered common boundary arc",
          );
        const boundary: (typeof chart.boundaries)[number] =
          piece?.boundary ?? whole;
        normalFan = `${chart.name}.arc.${boundary.id}.walk.${(side < 2 ? 1 : -1) * (boundary.reversed ? -1 : 1)}`;
        const parameter: (value: number) => number = (
          value: number,
        ): number => {
          const knot: number = (piece?.knots ?? boundary.knots).indexOf(value);
          const local: number = piece
            ? value === piece.start
              ? 0
              : value === piece.end
                ? 1
                : (value - piece.start) / (piece.end - piece.start)
            : value;
          return knot >= 0
            ? boundary.canonicalKnots[
                boundary.reversed ? boundary.knots.length - 1 - knot : knot
              ]!
            : boundary.reversed
              ? 1 - local
              : local;
        };
        const a: number = parameter(edge.start),
          b: number = parameter(edge.end),
          lower: number = Math.min(a, b),
          upper: number = Math.max(a, b);
        const span: number =
          boundary.canonicalKnots.findIndex(
            (x: number, i: number): boolean => i > 0 && lower < x,
          ) - 1;
        if (span < 0 || upper > boundary.canonicalKnots[span + 1]!)
          throw new Error(
            "An outer leaf master crosses a canonical cubic knot",
          );
        const lo: number = boundary.canonicalKnots[span]!,
          hi: number = boundary.canonicalKnots[span + 1]!;
        authority = `${boundary.id}.span.${span}`;
        start = (a - lo) / (hi - lo);
        end = (b - lo) / (hi - lo);
        const existing:
          | NonNullable<
              IAutoMovieBicubicAtlasGeometry["boundaryAuthorities"]
            >[number]
          | undefined = authorities.get(authority);
        if (existing) ids = existing.controlIds;
        else {
          const row = boundary.canonicalCurve.spans[span]!;
          const append = (point: Readonly<AutoMovieVector3Tuple>): number => {
            const id: number = controlsMm.length;
            controlsMm.push(point);
            return id;
          };
          ids = [append(row[0]), append(row[1]), append(row[2]), append(row[3])];
        }
      }
      if (!authorities.has(authority)) {
        const record: NonNullable<
          IAutoMovieBicubicAtlasGeometry["boundaryAuthorities"]
        >[number] = {
          id: authority,
          controlIds: ids,
        };
        authorities.set(authority, record);
        boundaryAuthorities.push(record);
      }
      local.set(edge.id, { authority, start, end, normalFan });
    }
    const byPatch: Map<string, (typeof chart.patches)[number]> = new Map(
      chart.patches.map(
        (
          patch: (typeof chart.patches)[number],
        ): [string, (typeof chart.patches)[number]] => [patch.id, patch],
      ),
    );
    const sideSlots: readonly (readonly number[])[] = [
      [0, 1, 2, 3],
      [3, 7, 11, 15],
      [12, 13, 14, 15],
      [0, 4, 8, 12],
    ];
    for (const binding of chart.leafLayout.bindings) {
      const master: {
        authority: string;
        start: number;
        end: number;
        normalFan: string;
      } = local.get(binding.edge)!;
      const start: number =
        binding.start === 0
          ? master.start
          : binding.start === 1
            ? master.end
            : (1 - binding.start) * master.start + binding.start * master.end;
      const end: number =
        binding.end === 0
          ? master.start
          : binding.end === 1
            ? master.end
            : (1 - binding.end) * master.start + binding.end * master.end;
      if (
        start === end ||
        [start, end].some(
          (value: number): boolean => value === Infinity || value === -Infinity,
        )
      )
        throw new Error(
          "A positive leaf binding collapses in its public canonical chart",
        );
      const record: NonNullable<
        IAutoMovieBicubicAtlasGeometry["boundaryBindings"]
      >[number] = {
        patch: binding.patch,
        side: binding.side,
        authority: master.authority,
        start,
        end,
        normalFan: master.normalFan,
      };
      boundaryBindings.push(record);
      uses.set(master.authority, (uses.get(master.authority) ?? 0) + 1);
      const net: [number, number, number][] = S.restrict(
        authorities
          .get(master.authority)!
          .controlIds.map((id: number): [number, number, number] => [
            ...controlsMm[id]!,
          ]),
        Math.min(start, end),
        Math.max(start, end),
      );
      if (start > end) net.reverse();
      const patch: (typeof chart.patches)[number] = byPatch.get(binding.patch)!;
      for (let k: number = 0; k < 4; k++) {
        const point: Readonly<AutoMovieVector3Tuple> =
          chart.controlsMm[patch.controlIds[sideSlots[binding.side]![k]!]!]!;
        maximumCanonicalRestrictionDifferenceMm = Math.max(
          maximumCanonicalRestrictionDifferenceMm,
          Math.hypot(
            point[0] - net[k]![0],
            point[1] - net[k]![1],
            point[2] - net[k]![2],
          ),
        );
      }
    }
  }
  return {
    controlsMm,
    patches,
    boundaryAuthorities,
    boundaryBindings,
    maximumCanonicalRestrictionDifferenceMm,
    sharedBoundarySpans: [...uses.values()].filter(
      (count: number): boolean => count > 1,
    ).length,
    unmatchedBoundarySpans: 0,
    diagnostics: [
      "Canonical interval requests conform coarse/fine edges independently of patch tensor partitions; source-free position owners and chart analytic normal fans remain distinct.",
      "Full-path boundary identity does not establish partial-path sharing across unrelated quarter charts; those external authorities remain unqualified.",
    ],
  };
}
