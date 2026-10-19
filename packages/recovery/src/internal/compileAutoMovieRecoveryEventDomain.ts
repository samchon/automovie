import {
  AutoMovieBernstein64 as B,
  type IAutoMovieCurve64 as C,
} from "@automovie/engine/geometry/curve";
import type { IAutoMovieBicubicAtlasGeometry as Geometry } from "@automovie/interface";

import { AutoMovieRecoveryEventCurve as E } from "./AutoMovieRecoveryEventCurve";
import type { IAutoMovieRecoveryEventChartInput } from "./IAutoMovieRecoveryEventChartInput";

/**
 * Compile declared cubic sides into a piecewise bicubic Coons coefficient atlas.
 * Opposite-side knot unions partition this domain only. Exact corner agreement
 * and shared coefficient IDs give C0 authority, independently of surface fit,
 * derivative continuity, regularity, embedding or physical material phase.
 * Input arcs and native parents must remain immutable during this synchronous call.
 *
 * @evidence contracts/common.md#principled-implementation On each native-knot cell, the Coons sum blends opposite cubic boundaries and subtracts their bilinear corner interpolant. Degree elevation by coefficient-index affine coordinates yields sixteen Bernstein controls. Actual outer-side controls override cancellation-prone sum values.
 * @evidence contracts/common.md#clear-and-simple-design This compiler owns tensor coefficients and complete restricted-edge identity; a separate native-parent compiler may retain partial-interval bindings, and the engine owns realization.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No source topology, sampled boundary fit, epsilon weld, coordinate averaging, pole collapse or hidden station projection enters compilation. Unequal named endpoint or edge coefficients throw locally to the assembly caller.
 * @evidence contracts/common.md#meaningful-documentation Input coefficients are millimetres; the output recipe is metres. Budget failure is explicit. Native-parent endpoint evaluation is an optional declared construction policy, not a claim of binary64 equivalence to a previous field.
 * @evidence contracts/performance.md#efficient-algorithms Sorting U and V side knots costs O(U log U+V log V). Each distinct side interval scans its side's N knots once, giving O((U+V)N+P) work for P tensor cells. Fixed-degree cell algebra and registry insertion add O(P). No partition propagates into another chart.
 * @evidence contracts/performance.md#reuse-equivalent-work An invocation-local arc/interval cache reuses immutable side restriction and native endpoint evaluation across opposite tensor rows. Each named complete edge and endpoint is emitted once; incident patch indices use that owner instead of a second independently rounded construction.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The declared patch budget bounds O(P) returned controls, bindings and provenance; temporary maps expire on return or throw. No external handles or cross-request cache are owned.
 */
export function compileAutoMovieRecoveryEventDomain(
  input: IAutoMovieRecoveryEventChartInput,
  policy: {
    maxPatches: number;
    maxCells: number;
    maxVertices: number;
    toleranceMm: number;
    nativeParentBindings?: boolean;
  },
):
  | { complete: false; reason: "chart-patch-budget"; requiredPatches: number }
  | {
      complete: true;
      recipe: Geometry;
      u: number[];
      v: number[];
      sourcePieces: {
        patch: string;
        chart: [number, number, number, number];
        boundaryCoefficientSources: Omit<E.Source, "parent">[];
      }[];
      maximumConstructedSharedEndpointDifferenceMm: number;
    } {
  for (const size of [policy.maxPatches, policy.maxCells, policy.maxVertices])
    if (!Number.isSafeInteger(size) || size < 1)
      throw new Error("Finite positive chart compilation budgets are required");
  if (
    !input.id.trim() ||
    (input.winding !== 1 && input.winding !== -1) ||
    !(policy.toleranceMm > 0 && Number.isFinite(policy.toleranceMm)) ||
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
  const corners: [C.Vector, C.Vector][] = [
    [bottom.pieces[0]!.net[0], left.pieces[0]!.net[0]],
    [bottom.pieces.at(-1)!.net[3], right.pieces[0]!.net[0]],
    [top.pieces[0]!.net[0], left.pieces.at(-1)!.net[3]],
    [top.pieces.at(-1)!.net[3], right.pieces.at(-1)!.net[3]],
  ];
  for (const [a, b] of corners)
    if (!E.same(a, b))
      throw new Error("Chart corners require one exact endpoint authority");
  const requiredPatches: number = (u.length - 1) * (v.length - 1);
  if (requiredPatches > policy.maxPatches)
    return { complete: false, reason: "chart-patch-budget", requiredPatches };
  const recipe: Geometry = {
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
  const curves: Map<string, readonly C.Vector[]> = new Map();
  const endpoints: Map<string, { position: C.Vector; id: number }> = new Map();
  const sourcePieces: {
    patch: string;
    chart: [number, number, number, number];
    boundaryCoefficientSources: Omit<E.Source, "parent">[];
  }[] = [];
  let maximumConstructedSharedEndpointDifferenceMm: number = 0;
  const add: (p: C.Vector) => number = (p: C.Vector): number => {
    if (!p.every(Number.isFinite))
      throw new Error("A Coons coefficient must remain finite");
    const id: number = recipe.controls.length;
    recipe.controls.push({ x: p[0] * 0.001, y: p[1] * 0.001, z: p[2] * 0.001 });
    return id;
  };
  const mix: (a: C.Vector, b: C.Vector, t: number) => C.Vector = (
    a: C.Vector,
    b: C.Vector,
    t: number,
  ): C.Vector => B.value([[...a], [...b]], t);
  const sidePieces: Map<E.Arc, Map<string, E.Piece>> = new Map();
  const cellPiece: (arc: E.Arc, a: number, b: number) => E.Piece = (
    arc: E.Arc,
    a: number,
    b: number,
  ): E.Piece => {
    let cache: Map<string, E.Piece> | undefined = sidePieces.get(arc);
    if (!cache) {
      cache = new Map();
      sidePieces.set(arc, cache);
    }
    const key: string = `${a}:${b}`;
    const previous: E.Piece | undefined = cache.get(key);
    if (previous) return previous;
    const p: E.Piece = E.piece(arc, a, b);
    if (!policy.nativeParentBindings) {
      cache.set(key, p);
      return p;
    }
    const parent: B.Poly = p.source.parent.map(
      (point: C.Vector): B.Vec => [...point],
    );
    const result: E.Piece = {
      ...p,
      net: [
        B.value(parent, p.source.start),
        p.net[1],
        p.net[2],
        B.value(parent, p.source.end),
      ],
    };
    cache.set(key, result);
    return result;
  };
  const bind: (
    patch: string,
    side: 0 | 1 | 2 | 3,
    key: string,
    net: readonly C.Vector[],
    names: [string, string],
    reverse?: boolean,
  ) => number[] = (
    patch: string,
    side: 0 | 1 | 2 | 3,
    key: string,
    net: readonly C.Vector[],
    names: [string, string],
    reverse: boolean = false,
  ): number[] => {
    if (!authorities.has(key)) {
      const ids: number[] = net.map((point: C.Vector, i: number): number => {
        if (i !== 0 && i !== 3) return add(point);
        const name: string = names[i === 0 ? 0 : 1];
        if (!endpoints.has(name))
          endpoints.set(name, { position: point, id: add(point) });
        const owner: { position: C.Vector; id: number } = endpoints.get(name)!;
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
      });
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
      !net.every((point: C.Vector, i: number): boolean =>
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
    p: E.Piece,
    names: [string, string],
  ) => number[] = (
    patch: string,
    side: 0 | 1 | 2 | 3,
    p: E.Piece,
    names: [string, string],
  ): number[] => {
    const backwards: boolean = p.source.start > p.source.end;
    const key: string = `${p.source.authority}.restricted.${Math.min(p.source.start, p.source.end)}:${Math.max(p.source.start, p.source.end)}`;
    return bind(
      patch,
      side,
      key,
      backwards ? [...p.net].reverse() : p.net,
      backwards ? [names[1], names[0]] : names,
      backwards,
    );
  };
  const pointName: (i: number, j: number) => string = (
    i: number,
    j: number,
  ): string =>
    `${input.id}.point.${input.chart.periodic && i === u.length - 1 ? 0 : i}.${j}`;
  const c00: C.Vector = bottom.pieces[0]!.net[0],
    c10: C.Vector = bottom.pieces.at(-1)!.net[3],
    c01: C.Vector = top.pieces[0]!.net[0],
    c11: C.Vector = top.pieces.at(-1)!.net[3];
  const slots: number[][] = [
    [0, 1, 2, 3],
    [3, 7, 11, 15],
    [12, 13, 14, 15],
    [0, 4, 8, 12],
  ];
  for (let j: number = 0; j < v.length - 1; j++)
    for (let i: number = 0; i < u.length - 1; i++) {
      const b: E.Piece = cellPiece(bottom, u[i]!, u[i + 1]!),
        t: E.Piece = cellPiece(top, u[i]!, u[i + 1]!);
      const l: E.Piece = cellPiece(left, v[j]!, v[j + 1]!),
        r: E.Piece = cellPiece(right, v[j]!, v[j + 1]!);
      const net: C.Vector[] = [];
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
          const bu: C.Vector = mix(b.net[x]!, t.net[x]!, V),
            lr: C.Vector = mix(l.net[y]!, r.net[y]!, U),
            corner: C.Vector = mix(mix(c00, c10, U), mix(c01, c11, U), V);
          let point: C.Vector = [
            bu[0] + lr[0] - corner[0],
            bu[1] + lr[1] - corner[1],
            bu[2] + lr[2] - corner[2],
          ];
          // Actual outer coefficients bypass cancellation in the transfinite sum.
          if (j === 0 && y === 0) point = b.net[x]!;
          if (j === v.length - 2 && y === 3) point = t.net[x]!;
          if (i === 0 && x === 0) point = l.net[y]!;
          if (i === u.length - 2 && x === 3) point = r.net[y]!;
          net.push(point);
        }
      const id: string = `${input.id}.u${i}.v${j}`,
        patch: Geometry["patches"][number] = { id, controlIds: net.map(add) };
      recipe.patches.push(patch);
      const edge: (side: 0 | 1 | 2 | 3) => C.Vector[] = (
        side: 0 | 1 | 2 | 3,
      ): C.Vector[] => slots[side]!.map((slot: number): C.Vector => net[slot]!);
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
        boundaryCoefficientSources: [
          b.source,
          r.source,
          t.source,
          l.source,
        ].map(
          ({
            parent: _parent,
            ...source
          }: E.Source): Omit<E.Source, "parent"> => source,
        ),
      });
    }
  recipe.sourceFit!.unqualifiedPatches = recipe.patches.map(
    (patch: Geometry["patches"][number]): string => patch.id,
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
