import type { IAutoMovieCurve64 as C } from "@automovie/engine/geometry/curve";
import type { IAutoMovieBicubicAtlasGeometry as Geometry } from "@automovie/interface";
import { AutoMovieRecoveryEventCurve as E } from "./AutoMovieRecoveryEventCurve";
import { compileAutoMovieRecoveryEventDomain as compile } from "./compileAutoMovieRecoveryEventDomain";

/**
 * Retain complete native cubic owners and oriented partial intervals on chart edges.
 * Tensor cuts stay local to the supplied chart; internal complete edges retain
 * their shared coefficient IDs without propagating opposite cuts to another domain.
 *
 * @evidence contracts/common.md#principled-implementation The Coons compiler supplies the field and its actual native interval provenance. Explicit original parent nets supply external boundary authorities; only declared native endpoint identities join controls, with strict raw and metre coefficient checks.
 * @evidence contracts/common.md#clear-and-simple-design This representation pass owns native binding and coefficient-ID compaction; Coons algebra and engine canonical boundary construction remain separate owners.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No positional search, weld, average, epsilon or first-owner suppression resolves conflicting coefficients. All declared endpoint aliases are checked even when their native curve owner was already admitted.
 * @evidence contracts/common.md#meaningful-documentation Native controls remain source-free millimetre data and recipe positions use metres. Exact-real representation does not assert binary64 equality to an earlier field, material correspondence, source fit, regularity or embedding.
 * @evidence contracts/performance.md#efficient-algorithms In addition to Coons compilation, input native parents are indexed once and external side declarations are visited once. Union by rank and path compression give near-linear coefficient remapping in controls and endpoint declarations; no cross-chart partition closure or coordinate search is used.
 * @evidence contracts/performance.md#reuse-equivalent-work Native intervals come from the compiled field's provenance rather than a second restriction calculation. Each complete native parent and each endpoint name is stored once per invocation; compaction preserves shared IDs.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Maps and disjoint-set arrays retain O(N+P) parent and patch data under the compiler's finite patch budget and caller-supplied native population. They expire on return or local refusal; the caller owns the returned recipe and identity rows.
 */
export function compileAutoMovieRecoveryNativeNamedChart(
  input: Parameters<typeof compile>[0],
  policy: Parameters<typeof compile>[1],
):
  | Extract<ReturnType<typeof compile>, { complete: false }>
  | (Extract<ReturnType<typeof compile>, { complete: true }> & {
      endpointControlOwners: { id: string; controlId: number }[];
      representation: "native-parent-local-partial-bindings-v1";
      chartDirectionU: 1 | -1;
    }) {
  const result: ReturnType<typeof compile> = compile(input, {
    ...policy,
    nativeParentBindings: true,
  });
  if (!result.complete) return result;
  const recipe: Geometry = result.recipe;
  const parent: number[] = recipe.controls.map(
    (_: Geometry["controls"][number], i: number): number => i,
  );
  const rank: number[] = recipe.controls.map((): number => 0);
  const parents: Map<string, C.Span> = new Map();
  for (const arc of [
    input.chart.bottom,
    input.chart.top,
    input.chart.left,
    input.chart.right,
  ])
    for (const p of arc.pieces) {
      const prior: C.Span | undefined = parents.get(p.source.authority);
      if (
        prior &&
        !p.source.parent.every((point: C.Vector, i: number): boolean =>
          E.same(point, prior[i]!),
        )
      )
        throw new Error(
          "One native cubic authority has distinct raw coefficients",
        );
      parents.set(p.source.authority, p.source.parent);
    }
  const owners: Map<
    string,
    { id: string; controlIds: [number, number, number, number]; net: C.Span }
  > = new Map();
  const endpoints: Map<string, { position: C.Vector; controlId: number }> =
    new Map();
  const find: (id: number) => number = (id: number): number => {
    let root: number = id;
    while (parent[root] !== root) root = parent[root]!;
    while (parent[id] !== id) {
      const next: number = parent[id]!;
      parent[id] = root;
      id = next;
    }
    return root;
  };
  const join: (a: number, b: number) => void = (a: number, b: number): void => {
    a = find(a);
    b = find(b);
    if (a === b) return;
    const x: Geometry["controls"][number] = recipe.controls[a]!,
      y: Geometry["controls"][number] = recipe.controls[b]!;
    if (x.x !== y.x || x.y !== y.y || x.z !== y.z)
      throw new Error(
        "Native endpoint values differ from their declared chart corner",
      );
    if (rank[a]! < rank[b]!) [a, b] = [b, a];
    parent[b] = a;
    if (rank[a] === rank[b]) rank[a] = rank[a]! + 1;
  };
  const add: (point: C.Vector) => number = (point: C.Vector): number => {
    const id: number = recipe.controls.length;
    recipe.controls.push({
      x: point[0] * 0.001,
      y: point[1] * 0.001,
      z: point[2] * 0.001,
    });
    parent.push(id);
    rank.push(0);
    return id;
  };
  const native: (source: E.Source) => {
    id: string;
    controlIds: [number, number, number, number];
    net: C.Span;
  } = (
    source: E.Source,
  ): {
    id: string;
    controlIds: [number, number, number, number];
    net: C.Span;
  } => {
    if (
      !source.authority.trim() ||
      source.parent.length !== 4 ||
      source.parent.some(
        (point: C.Vector): boolean =>
          point.length !== 3 || !point.every(Number.isFinite),
      ) ||
      source.endpointAuthorities.length !== 2
    )
      throw new Error(
        "A native cubic needs a name, four finite controls and two endpoint names",
      );
    if (
      !Number.isFinite(source.start) ||
      !Number.isFinite(source.end) ||
      source.start < 0 ||
      source.start > 1 ||
      source.end < 0 ||
      source.end > 1 ||
      source.start === source.end
    )
      throw new Error(
        "A native occurrence needs a nonempty oriented interval within zero and one",
      );
    let owner:
      | {
          id: string;
          controlIds: [number, number, number, number];
          net: C.Span;
        }
      | undefined = owners.get(source.authority);
    if (!owner) {
      const ids: number[] = source.parent.map(add);
      owner = {
        id: source.authority,
        controlIds: [ids[0]!, ids[1]!, ids[2]!, ids[3]!],
        net: source.parent,
      };
      owners.set(owner.id, owner);
    } else if (
      !source.parent.every((point: C.Vector, i: number): boolean =>
        E.same(point, owner!.net[i]!),
      )
    )
      throw new Error("One native cubic authority has distinct coefficients");
    for (const [k, name] of [
      [0, source.endpointAuthorities[0]],
      [3, source.endpointAuthorities[1]],
    ] as const) {
      if (!name.trim())
        throw new Error("A native endpoint requires an explicit name");
      const prior: { position: C.Vector; controlId: number } | undefined =
        endpoints.get(name);
      if (prior) {
        if (!E.same(prior.position, source.parent[k]))
          throw new Error(
            "One native endpoint authority has distinct raw coefficients",
          );
        join(prior.controlId, owner.controlIds[k]);
      } else
        endpoints.set(name, {
          position: source.parent[k],
          controlId: owner.controlIds[k],
        });
    }
    return owner;
  };
  const slots: number[][] = [
    [0, 1, 2, 3],
    [3, 7, 11, 15],
    [12, 13, 14, 15],
    [0, 4, 8, 12],
  ];
  const bindings: NonNullable<Geometry["boundaryBindings"]> = [];
  for (let i: number = 0; i < recipe.patches.length; i++) {
    const patch: Geometry["patches"][number] = recipe.patches[i]!,
      row: (typeof result.sourcePieces)[number] = result.sourcePieces[i]!;
    const [a, b, c, d]: [number, number, number, number] = row.chart;
    const sides: [0 | 1 | 2 | 3, boolean][] = [
      [0, c === 0],
      [2, d === 1],
      [3, a === 0],
      [1, b === 1],
    ];
    for (const [originalSide, external] of sides) {
      if (!external) continue;
      const occurrence: Omit<E.Source, "parent"> =
        row.boundaryCoefficientSources[originalSide]!;
      const net: C.Span | undefined = parents.get(occurrence.authority);
      if (!net)
        throw new Error(
          "A compiled boundary interval has no original native parent",
        );
      const source: E.Source = { ...occurrence, parent: net };
      const owner: ReturnType<typeof native> = native(source);
      let side: 0 | 1 | 2 | 3 = originalSide,
        start: number = source.start,
        end: number = source.end;
      if (input.winding === -1) {
        if (side === 0 || side === 2) [start, end] = [end, start];
        else side = side === 1 ? 3 : 1;
      }
      bindings.push({
        patch: patch.id,
        side,
        authority: owner.id,
        start,
        end,
        normalFan: patch.id,
      });
      for (const [k, phase] of [
        [0, start],
        [3, end],
      ] as const)
        if (phase === 0 || phase === 1)
          join(
            patch.controlIds[slots[side]![k]!]!,
            owner.controlIds[phase === 0 ? 0 : 3],
          );
    }
  }
  recipe.boundaryAuthorities = [...owners.values()].map(
    (
      owner: ReturnType<typeof native>,
    ): NonNullable<Geometry["boundaryAuthorities"]>[number] => ({
      id: owner.id,
      controlIds: owner.controlIds,
    }),
  );
  recipe.boundaryBindings = bindings;
  const compact: Map<number, number> = new Map(),
    controls: Geometry["controls"] = [];
  const id: (value: number) => number = (value: number): number => {
    const root: number = find(value);
    if (!compact.has(root)) {
      compact.set(root, controls.length);
      controls.push(recipe.controls[root]!);
    }
    return compact.get(root)!;
  };
  for (const patch of recipe.patches)
    patch.controlIds = patch.controlIds.map(id);
  for (const owner of recipe.boundaryAuthorities)
    owner.controlIds = [
      id(owner.controlIds[0]),
      id(owner.controlIds[1]),
      id(owner.controlIds[2]),
      id(owner.controlIds[3]),
    ];
  const endpointControlOwners: { id: string; controlId: number }[] = [
    ...endpoints,
  ].map(
    ([name, endpoint]: [string, { position: C.Vector; controlId: number }]): {
      id: string;
      controlId: number;
    } => ({ id: name, controlId: id(endpoint.controlId) }),
  );
  recipe.controls = controls;
  return {
    ...result,
    recipe,
    endpointControlOwners,
    representation: "native-parent-local-partial-bindings-v1",
    chartDirectionU: input.winding === -1 ? -1 : 1,
  };
}
