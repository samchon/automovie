import type {
  AutoMovieCubicBezierControls3,
  AutoMovieVector3Tuple,
  IAutoMovieBicubicAtlasGeometry,
  IAutoMovieRecoveryChartPatchBudgetFailure,
  IAutoMovieRecoveryEndpointControlOwner,
  IAutoMovieRecoveryEventChartInput,
  IAutoMovieRecoveryEventCompilationPolicy,
  IAutoMovieRecoveryEventCurveSource,
  IAutoMovieRecoveryEventDomainCompilation,
  IAutoMovieRecoveryNativeChartCompilation,
  IAutoMovieRecoveryNativeCurveOwner,
  IAutoMovieRecoveryNativeEndpoint,
} from "@automovie/interface";

import { AutoMovieRecoveryEventCurve as E } from "../../observation/AutoMovieRecoveryEventCurve";
import { compileRecoveryEventDomain as compile } from "./compileRecoveryEventDomain";

/*
 * Retain complete native cubic owners and oriented partial intervals on chart
 * edges. Tensor cuts stay local to the supplied chart; internal complete edges
 * retain their shared coefficient IDs without propagating opposite cuts to
 * another domain.
 */
export function compileRecoveryNativeNamedChart(
  input: IAutoMovieRecoveryEventChartInput,
  policy: IAutoMovieRecoveryEventCompilationPolicy,
):
  | IAutoMovieRecoveryChartPatchBudgetFailure
  | IAutoMovieRecoveryNativeChartCompilation {
  const result:
    | IAutoMovieRecoveryChartPatchBudgetFailure
    | IAutoMovieRecoveryEventDomainCompilation = compile(input, {
    ...policy,
    nativeParentBindings: true,
  });
  if (!result.complete) return result;
  const recipe: IAutoMovieBicubicAtlasGeometry = result.recipe;
  const parent: number[] = recipe.controls.map(
    (
      _: IAutoMovieBicubicAtlasGeometry["controls"][number],
      i: number,
    ): number => i,
  );
  const rank: number[] = recipe.controls.map((): number => 0);
  const parents: Map<string, AutoMovieCubicBezierControls3> = new Map();
  for (const arc of [
    input.chart.bottom,
    input.chart.top,
    input.chart.left,
    input.chart.right,
  ])
    for (const p of arc.pieces) {
      const prior: AutoMovieCubicBezierControls3 | undefined = parents.get(
        p.source.authority,
      );
      if (
        prior &&
        !E.fullparentControls(p.source).every(
          (point: Readonly<AutoMovieVector3Tuple>, i: number): boolean =>
            E.same(point, prior[i]!),
        )
      )
        throw new Error(
          "One native cubic authority has distinct raw coefficients",
        );
      parents.set(p.source.authority, E.fullparentControls(p.source));
    }
  const owners: Map<string, IAutoMovieRecoveryNativeCurveOwner> = new Map();
  const endpoints: Map<string, IAutoMovieRecoveryNativeEndpoint> = new Map();
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
    const x: IAutoMovieBicubicAtlasGeometry["controls"][number] =
        recipe.controls[a]!,
      y: IAutoMovieBicubicAtlasGeometry["controls"][number] =
        recipe.controls[b]!;
    if (x.x !== y.x || x.y !== y.y || x.z !== y.z)
      throw new Error(
        "Native endpoint values differ from their declared chart corner",
      );
    if (rank[a]! < rank[b]!) [a, b] = [b, a];
    parent[b] = a;
    if (rank[a] === rank[b]) rank[a] = rank[a]! + 1;
  };
  const add: (point: Readonly<AutoMovieVector3Tuple>) => number = (
    point: Readonly<AutoMovieVector3Tuple>,
  ): number => {
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
  const native: (
    source: IAutoMovieRecoveryEventCurveSource,
  ) => IAutoMovieRecoveryNativeCurveOwner = (
    source: IAutoMovieRecoveryEventCurveSource,
  ): IAutoMovieRecoveryNativeCurveOwner => {
    const nativeNet: AutoMovieCubicBezierControls3 =
      E.fullparentControls(source);
    if (
      !source.authority.trim() ||
      nativeNet.length !== 4 ||
      nativeNet.some(
        (point: Readonly<AutoMovieVector3Tuple>): boolean => point.length !== 3,
      ) ||
      source.endpointAuthorities.length !== 2
    )
      throw new Error(
        "A native cubic needs a name, four finite controls and two endpoint names",
      );
    if (
      source.start < 0 ||
      source.start > 1 ||
      source.end < 0 ||
      source.end > 1 ||
      source.start === source.end
    )
      throw new Error(
        "A native occurrence needs a nonempty oriented interval within zero and one",
      );
    let owner: IAutoMovieRecoveryNativeCurveOwner | undefined = owners.get(
      source.authority,
    );
    if (!owner) {
      const ids: number[] = nativeNet.map(add);
      owner = {
        id: source.authority,
        controlIds: [ids[0]!, ids[1]!, ids[2]!, ids[3]!],
        net: nativeNet,
      };
      owners.set(owner.id, owner);
    } else if (
      !nativeNet.every(
        (point: Readonly<AutoMovieVector3Tuple>, i: number): boolean =>
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
      const prior: IAutoMovieRecoveryNativeEndpoint | undefined =
        endpoints.get(name);
      if (prior) {
        if (!E.same(prior.position, nativeNet[k]))
          throw new Error(
            "One native endpoint authority has distinct raw coefficients",
          );
        join(prior.controlId, owner.controlIds[k]);
      } else
        endpoints.set(name, {
          position: nativeNet[k],
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
  const bindings: NonNullable<
    IAutoMovieBicubicAtlasGeometry["boundaryBindings"]
  > = [];
  for (let i: number = 0; i < recipe.patches.length; i++) {
    const patch: IAutoMovieBicubicAtlasGeometry["patches"][number] =
        recipe.patches[i]!,
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
      const occurrence: IAutoMovieRecoveryEventCurveSource =
        row.boundaryCoefficientSources[originalSide]!;
      const net: AutoMovieCubicBezierControls3 | undefined = parents.get(
        occurrence.authority,
      );
      if (!net)
        throw new Error(
          "A compiled boundary interval has no original native parent",
        );
      const source: IAutoMovieRecoveryEventCurveSource = occurrence;
      const owner: IAutoMovieRecoveryNativeCurveOwner = native(source);
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
    ): NonNullable<
      IAutoMovieBicubicAtlasGeometry["boundaryAuthorities"]
    >[number] => ({
      id: owner.id,
      controlIds: owner.controlIds,
    }),
  );
  recipe.boundaryBindings = bindings;
  const compact: Map<number, number> = new Map(),
    controls: IAutoMovieBicubicAtlasGeometry["controls"] = [];
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
  const endpointControlOwners: IAutoMovieRecoveryEndpointControlOwner[] = [
    ...endpoints,
  ].map(
    ([name, endpoint]: [
      string,
      IAutoMovieRecoveryNativeEndpoint,
    ]): IAutoMovieRecoveryEndpointControlOwner => ({
      id: name,
      controlId: id(endpoint.controlId),
    }),
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
