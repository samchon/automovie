import { AutoMovieBernstein64 as B } from "@automovie/engine";
import type {
  AutoMovieCubicBezierControls3,
  AutoMovieVector3Tuple,
  IAutoMovieBicubicAtlasGeometry,
  IAutoMovieRecoveryChartEndpoint,
  IAutoMovieRecoveryChartPatchBudgetFailure,
  IAutoMovieRecoveryChartSourcePiece,
  IAutoMovieRecoveryEventChartInput,
  IAutoMovieRecoveryEventCompilationPolicy,
  IAutoMovieRecoveryEventCurveArc,
  IAutoMovieRecoveryEventCurvePiece,
  IAutoMovieRecoveryEventDomainCompilation,
} from "@automovie/interface";

import { AutoMovieRecoveryEventCurve as E } from "../observation/AutoMovieRecoveryEventCurve";

/**
 * Compile declared cubic sides into a piecewise bicubic Coons coefficient
 * atlas. Opposite-side knot unions partition this domain only. Exact corner
 * agreement and shared coefficient IDs give C0 authority, independently of
 * surface fit, derivative continuity, regularity, embedding or physical
 * material phase. Input arcs and native parents must remain immutable during
 * this synchronous call.
 */
export function compileAutoMovieRecoveryEventDomain(
  input: IAutoMovieRecoveryEventChartInput,
  policy: IAutoMovieRecoveryEventCompilationPolicy,
):
  | IAutoMovieRecoveryChartPatchBudgetFailure
  | IAutoMovieRecoveryEventDomainCompilation {
  for (const size of [policy.maxPatches, policy.maxCells, policy.maxVertices])
    if (size < 1)
      throw new Error("Finite positive chart compilation budgets are required");
  if (
    !input.id.trim() ||
    (input.winding !== 1 && input.winding !== -1) ||
    !(policy.toleranceMm > 0) ||
    !(policy.toleranceMm * 0.001 > 0)
  )
    throw new Error(
      "A named oriented chart and positive physical tolerance are required",
    );
  const {
    bottom,
    top,
    left,
    right,
  }: IAutoMovieRecoveryEventChartInput["chart"] = input.chart;
  const u: number[] = [...new Set([...E.knots(bottom), ...E.knots(top)])].sort(
    (a: number, b: number): number => a - b,
  );
  const v: number[] = [...new Set([...E.knots(left), ...E.knots(right)])].sort(
    (a: number, b: number): number => a - b,
  );
  const corners: [
    Readonly<AutoMovieVector3Tuple>,
    Readonly<AutoMovieVector3Tuple>,
  ][] = [
    [E.controls(bottom.pieces[0]!)[0], E.controls(left.pieces[0]!)[0]],
    [E.controls(bottom.pieces.at(-1)!)[3], E.controls(right.pieces[0]!)[0]],
    [E.controls(top.pieces[0]!)[0], E.controls(left.pieces.at(-1)!)[3]],
    [E.controls(top.pieces.at(-1)!)[3], E.controls(right.pieces.at(-1)!)[3]],
  ];
  for (const [a, b] of corners)
    if (!E.same(a, b))
      throw new Error("Chart corners require one exact endpoint authority");
  const requiredPatches: number = (u.length - 1) * (v.length - 1);
  if (requiredPatches > policy.maxPatches)
    return { complete: false, reason: "chart-patch-budget", requiredPatches };
  const recipe: IAutoMovieBicubicAtlasGeometry = {
    type: "bicubic-atlas",
    topologyDomain: input.id,
    controls: [],
    patches: [],
    boundaryAuthorities: [],
    boundaryBindings: [],
    tolerance: policy.toleranceMm * 0.001,
    maxCells: policy.maxCells,
    cellBudgetPolicy: "retain-coarse",
    maxVertices: policy.maxVertices,
    sourceFit: {
      qualified: false,
      maximumResidual: null,
      unqualifiedPatches: [],
      diagnostics: [
        "Boundary curves retain separate observation provenance. Coons interiors and abstract annular correspondence have no original-surface fidelity or embedding certificate.",
      ],
    },
  };
  const authorities: Map<string, [number, number, number, number]> = new Map();
  const curves: Map<string, readonly Readonly<AutoMovieVector3Tuple>[]> =
    new Map();
  const endpoints: Map<string, IAutoMovieRecoveryChartEndpoint> = new Map();
  const sourcePieces: IAutoMovieRecoveryChartSourcePiece[] = [];
  let maximumConstructedSharedEndpointDifferenceMm: number = 0;
  const add: (p: Readonly<AutoMovieVector3Tuple>) => number = (
    p: Readonly<AutoMovieVector3Tuple>,
  ): number => {
    const id: number = recipe.controls.length;
    recipe.controls.push({ x: p[0] * 0.001, y: p[1] * 0.001, z: p[2] * 0.001 });
    return id;
  };
  const mix: (
    a: Readonly<AutoMovieVector3Tuple>,
    b: Readonly<AutoMovieVector3Tuple>,
    t: number,
  ) => Readonly<AutoMovieVector3Tuple> = (
    a: Readonly<AutoMovieVector3Tuple>,
    b: Readonly<AutoMovieVector3Tuple>,
    t: number,
  ): Readonly<AutoMovieVector3Tuple> => B.value([[...a], [...b]], t);
  const sidePieces: Map<
    IAutoMovieRecoveryEventCurveArc,
    Map<string, IAutoMovieRecoveryEventCurvePiece>
  > = new Map();
  const cellPiece: (
    arc: IAutoMovieRecoveryEventCurveArc,
    a: number,
    b: number,
  ) => IAutoMovieRecoveryEventCurvePiece = (
    arc: IAutoMovieRecoveryEventCurveArc,
    a: number,
    b: number,
  ): IAutoMovieRecoveryEventCurvePiece => {
    let cache: Map<string, IAutoMovieRecoveryEventCurvePiece> | undefined =
      sidePieces.get(arc);
    if (!cache) {
      cache = new Map();
      sidePieces.set(arc, cache);
    }
    const key: string = `${a}:${b}`;
    const previous: IAutoMovieRecoveryEventCurvePiece | undefined =
      cache.get(key);
    if (previous) return previous;
    const p: IAutoMovieRecoveryEventCurvePiece = E.piece(arc, a, b);
    cache.set(key, p);
    return p;
  };
  const derivedControls: Map<
    IAutoMovieRecoveryEventCurvePiece,
    AutoMovieCubicBezierControls3
  > = new Map();
  const coefficients: (
    p: IAutoMovieRecoveryEventCurvePiece,
  ) => AutoMovieCubicBezierControls3 = (
    p: IAutoMovieRecoveryEventCurvePiece,
  ): AutoMovieCubicBezierControls3 => {
    const previous: AutoMovieCubicBezierControls3 | undefined =
      derivedControls.get(p);
    if (previous) return previous;
    const net: AutoMovieCubicBezierControls3 = E.controls(
      p,
      policy.nativeParentBindings,
    );
    derivedControls.set(p, net);
    return net;
  };
  const bind: (
    patch: string,
    side: 0 | 1 | 2 | 3,
    key: string,
    net: readonly Readonly<AutoMovieVector3Tuple>[],
    names: [string, string],
    reverse?: boolean,
  ) => number[] = (
    patch: string,
    side: 0 | 1 | 2 | 3,
    key: string,
    net: readonly Readonly<AutoMovieVector3Tuple>[],
    names: [string, string],
    reverse: boolean = false,
  ): number[] => {
    if (!authorities.has(key)) {
      const ids: number[] = net.map(
        (point: Readonly<AutoMovieVector3Tuple>, i: number): number => {
          if (i !== 0 && i !== 3) return add(point);
          const name: string = names[i === 0 ? 0 : 1];
          if (!endpoints.has(name))
            endpoints.set(name, { position: point, id: add(point) });
          const owner: IAutoMovieRecoveryChartEndpoint = endpoints.get(name)!;
          maximumConstructedSharedEndpointDifferenceMm = Math.max(
            maximumConstructedSharedEndpointDifferenceMm,
            Math.hypot(
              owner.position[0] - point[0],
              owner.position[1] - point[1],
              owner.position[2] - point[2],
            ),
          );
          if (!E.same(owner.position, point))
            throw new Error(
              `Distinct endpoint values claim one chart endpoint authority: ${name}`,
            );
          return owner.id;
        },
      );
      const tuple: [number, number, number, number] = [
        ids[0]!,
        ids[1]!,
        ids[2]!,
        ids[3]!,
      ];
      authorities.set(key, tuple);
      curves.set(key, net);
      recipe.boundaryAuthorities!.push({ id: key, controlIds: tuple });
    }
    if (
      !net.every((point: Readonly<AutoMovieVector3Tuple>, i: number): boolean =>
        E.same(point, curves.get(key)![i]!),
      )
    )
      throw new Error(
        `Distinct cubic coefficients claim one chart boundary authority: ${key}`,
      );
    recipe.boundaryBindings!.push({
      patch,
      side,
      authority: key,
      start: reverse ? 1 : 0,
      end: reverse ? 0 : 1,
      normalFan: patch,
    });
    return reverse
      ? [...authorities.get(key)!].reverse()
      : authorities.get(key)!;
  };
  const bindSource: (
    patch: string,
    side: 0 | 1 | 2 | 3,
    p: IAutoMovieRecoveryEventCurvePiece,
    names: [string, string],
  ) => number[] = (
    patch: string,
    side: 0 | 1 | 2 | 3,
    p: IAutoMovieRecoveryEventCurvePiece,
    names: [string, string],
  ): number[] => {
    const backwards: boolean = p.source.start > p.source.end;
    const key: string = `${p.source.authority}.restricted.${Math.min(p.source.start, p.source.end)}:${Math.max(p.source.start, p.source.end)}`;
    return bind(
      patch,
      side,
      key,
      backwards ? [...coefficients(p)].reverse() : coefficients(p),
      backwards ? [names[1], names[0]] : names,
      backwards,
    );
  };
  const pointName: (i: number, j: number) => string = (
    i: number,
    j: number,
  ): string =>
    `${input.id}.point.${input.chart.periodic && i === u.length - 1 ? 0 : i}.${j}`;
  const c00: Readonly<AutoMovieVector3Tuple> = E.controls(bottom.pieces[0]!)[0],
    c10: Readonly<AutoMovieVector3Tuple> = E.controls(bottom.pieces.at(-1)!)[3],
    c01: Readonly<AutoMovieVector3Tuple> = E.controls(top.pieces[0]!)[0],
    c11: Readonly<AutoMovieVector3Tuple> = E.controls(top.pieces.at(-1)!)[3];
  const slots: number[][] = [
    [0, 1, 2, 3],
    [3, 7, 11, 15],
    [12, 13, 14, 15],
    [0, 4, 8, 12],
  ];
  for (let j: number = 0; j < v.length - 1; j++)
    for (let i: number = 0; i < u.length - 1; i++) {
      const b: IAutoMovieRecoveryEventCurvePiece = cellPiece(
          bottom,
          u[i]!,
          u[i + 1]!,
        ),
        t: IAutoMovieRecoveryEventCurvePiece = cellPiece(top, u[i]!, u[i + 1]!);
      const l: IAutoMovieRecoveryEventCurvePiece = cellPiece(
          left,
          v[j]!,
          v[j + 1]!,
        ),
        r: IAutoMovieRecoveryEventCurvePiece = cellPiece(
          right,
          v[j]!,
          v[j + 1]!,
        );
      const net: Readonly<AutoMovieVector3Tuple>[] = [];
      for (let y: number = 0; y < 4; y++)
        for (let x: number = 0; x < 4; x++) {
          const U: number =
            policy.nativeParentBindings && x === 0
              ? u[i]!
              : policy.nativeParentBindings && x === 3
                ? u[i + 1]!
                : u[i]! + ((u[i + 1]! - u[i]!) * x) / 3;
          const V: number =
            policy.nativeParentBindings && y === 0
              ? v[j]!
              : policy.nativeParentBindings && y === 3
                ? v[j + 1]!
                : v[j]! + ((v[j + 1]! - v[j]!) * y) / 3;
          const bu: Readonly<AutoMovieVector3Tuple> = mix(
              coefficients(b)[x]!,
              coefficients(t)[x]!,
              V,
            ),
            lr: Readonly<AutoMovieVector3Tuple> = mix(
              coefficients(l)[y]!,
              coefficients(r)[y]!,
              U,
            ),
            corner: Readonly<AutoMovieVector3Tuple> = mix(
              mix(c00, c10, U),
              mix(c01, c11, U),
              V,
            );
          let point: Readonly<AutoMovieVector3Tuple> = [
            bu[0] + lr[0] - corner[0],
            bu[1] + lr[1] - corner[1],
            bu[2] + lr[2] - corner[2],
          ];
          // Actual outer coefficients bypass cancellation in the transfinite sum.
          if (j === 0 && y === 0) point = coefficients(b)[x]!;
          if (j === v.length - 2 && y === 3) point = coefficients(t)[x]!;
          if (i === 0 && x === 0) point = coefficients(l)[y]!;
          if (i === u.length - 2 && x === 3) point = coefficients(r)[y]!;
          net.push(point);
        }
      const id: string = `${input.id}.u${i}.v${j}`,
        patch: IAutoMovieBicubicAtlasGeometry["patches"][number] = {
          id,
          controlIds: net.map(add),
        };
      recipe.patches.push(patch);
      const edge: (side: 0 | 1 | 2 | 3) => Readonly<AutoMovieVector3Tuple>[] = (
        side: 0 | 1 | 2 | 3,
      ): Readonly<AutoMovieVector3Tuple>[] =>
        slots[side]!.map(
          (slot: number): Readonly<AutoMovieVector3Tuple> => net[slot]!,
        );
      const names: [string, string][] = [
        [pointName(i, j), pointName(i + 1, j)],
        [pointName(i + 1, j), pointName(i + 1, j + 1)],
        [pointName(i, j + 1), pointName(i + 1, j + 1)],
        [pointName(i, j), pointName(i, j + 1)],
      ];
      const ids: number[][] = [];
      ids[0] =
        j === 0
          ? bindSource(id, 0, b, names[0]!)
          : bind(id, 0, `${input.id}.horizontal.${i}.${j}`, edge(0), names[0]!);
      ids[2] =
        j === v.length - 2
          ? bindSource(id, 2, t, names[2]!)
          : bind(
              id,
              2,
              `${input.id}.horizontal.${i}.${j + 1}`,
              edge(2),
              names[2]!,
            );
      ids[3] =
        i === 0
          ? bindSource(id, 3, l, names[3]!)
          : bind(id, 3, `${input.id}.vertical.${i}.${j}`, edge(3), names[3]!);
      ids[1] =
        i === u.length - 2
          ? bindSource(id, 1, r, names[1]!)
          : bind(
              id,
              1,
              `${input.id}.vertical.${i + 1}.${j}`,
              edge(1),
              names[1]!,
            );
      for (let side: number = 0; side < 4; side++)
        for (let k: number = 0; k < 4; k++)
          patch.controlIds[slots[side]![k]!] = ids[side]![k]!;
      sourcePieces.push({
        patch: id,
        chart: [u[i]!, u[i + 1]!, v[j]!, v[j + 1]!],
        boundaryCoefficientSources: [b.source, r.source, t.source, l.source],
      });
    }
  recipe.sourceFit!.unqualifiedPatches = recipe.patches.map(
    (patch: IAutoMovieBicubicAtlasGeometry["patches"][number]): string =>
      patch.id,
  );
  if (input.winding === -1) {
    for (const patch of recipe.patches)
      patch.controlIds = Array.from(
        { length: 4 },
        (_: unknown, j: number): number[] =>
          patch.controlIds.slice(4 * j, 4 * j + 4).reverse(),
      ).flat();
    for (const binding of recipe.boundaryBindings!) {
      if (binding.side === 0 || binding.side === 2)
        [binding.start, binding.end] = [binding.end, binding.start];
      else binding.side = binding.side === 1 ? 3 : 1;
    }
  }
  return {
    complete: true,
    recipe,
    sourcePieces,
    u,
    v,
    maximumConstructedSharedEndpointDifferenceMm,
  };
}
