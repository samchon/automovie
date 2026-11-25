import type {
  AutoMovieVector3Tuple,
  IAutoMovieBicubicAtlasGeometry,
  IAutoMovieRecoveryChartPatchBudgetFailure,
  IAutoMovieRecoveryEventChartInput,
  IAutoMovieRecoveryFieldComplex,
  IAutoMovieRecoveryFieldComplexInput,
  IAutoMovieRecoveryFieldComplexPiece,
  IAutoMovieRecoveryFieldComplexPolicy,
  IAutoMovieRecoveryNativeChartCompilation,
  IAutoMovieRecoveryUnsupportedDomain,
} from "@automovie/interface";

import { AutoMovieRecoveryEventCurve as E } from "../observation/AutoMovieRecoveryEventCurve";
import { compileAutoMovieRecoveryNativeNamedChart as compile } from "./compileAutoMovieRecoveryNativeNamedChart";

/**
 * Assemble named native-parent Coons charts and quarantine conflicting
 * incidents. Every boundary name owns its complete four coefficients. Endpoint
 * names own native endpoint values independently of occurrence direction. Valid
 * connected components retain their local chart partitions; no opposite-edge
 * fixed point propagates knots through the complex. Input arrays stay immutable
 * during the call. The returned diagnostic reason is mandatory; a producer may
 * retain its complete observation or compiler record in detail without losing
 * the textual cause.
 */
export function assembleAutoMovieRecoveryFieldComplex(
  input: IAutoMovieRecoveryFieldComplexInput,
  policy: IAutoMovieRecoveryFieldComplexPolicy,
): IAutoMovieRecoveryFieldComplex {
  for (const size of [
    policy.maxCharts,
    policy.maxNativeOwners,
    policy.maxTotalPatches,
    policy.maxPatches,
    policy.maxCells,
    policy.maxVertices,
  ])
    if (size < 1) throw new Error("Finite chart assembly budgets are required");
  if (!input.id.trim() || !(policy.toleranceMm > 0))
    throw new Error(
      "A named complex and positive physical tolerance are required",
    );
  type Point = IAutoMovieBicubicAtlasGeometry["controls"][number];
  type Diagnostic = IAutoMovieRecoveryUnsupportedDomain;
  type Compiled = IAutoMovieRecoveryNativeChartCompilation;
  type Candidate = {
    chart: IAutoMovieRecoveryEventChartInput;
    result: Compiled;
  };
  type Owner = {
    net: readonly Readonly<AutoMovieVector3Tuple>[];
    incidents: Set<number>;
    occurrences: {
      chart: string;
      side: string;
      coefficients: readonly Readonly<AutoMovieVector3Tuple>[];
    }[];
    conflict: boolean;
  };
  const unsupported: Diagnostic[] = [...(input.unsupported ?? [])];
  for (const row of unsupported)
    if (!row.id.trim() || !row.reason.trim())
      throw new Error(
        "An unsupported domain requires its original textual cause",
      );
  const reject: (
    charts: readonly IAutoMovieRecoveryEventChartInput[],
    reason: string,
    detail?: unknown,
  ) => void = (
    charts: readonly IAutoMovieRecoveryEventChartInput[],
    reason: string,
    detail?: unknown,
  ): void => {
    for (const chart of charts)
      unsupported.push({ id: chart.id, reason, detail });
  };
  const native: Map<string, Owner> = new Map(),
    endpoints: Map<string, Owner> = new Map();
  const invalid: Set<number> = new Set(),
    indices: Map<string, number[]> = new Map();
  const charts: readonly IAutoMovieRecoveryEventChartInput[] = input.charts;
  for (const [i, chart] of charts.entries()) {
    if (i >= policy.maxCharts) {
      invalid.add(i);
      reject([chart], "Declared chart admission budget");
      continue;
    }
    const repeated: number[] = indices.get(chart.id) ?? [];
    repeated.push(i);
    indices.set(chart.id, repeated);
    try {
      for (const side of ["bottom", "top", "left", "right"] as const)
        for (const piece of chart.chart[side].pieces) {
          const source: typeof piece.source = piece.source;
          const declarations: [
            Map<string, Owner>,
            string,
            readonly Readonly<AutoMovieVector3Tuple>[],
          ][] = [
            [native, source.authority, E.fullparentControls(source)],
            [
              endpoints,
              source.endpointAuthorities[0],
              [E.fullparentControls(source)[0]],
            ],
            [
              endpoints,
              source.endpointAuthorities[1],
              [E.fullparentControls(source)[3]],
            ],
          ];
          for (const [map, id, net] of declarations) {
            if (
              !id.trim() ||
              net.some(
                (point: Readonly<AutoMovieVector3Tuple>): boolean =>
                  point.length !== 3,
              )
            )
              throw new Error(
                "An explicit finite coefficient owner is required",
              );
            const prior: Owner | undefined = map.get(id);
            const occurrence: Owner["occurrences"][number] = {
              chart: chart.id,
              side,
              coefficients: net,
            };
            if (prior) {
              prior.incidents.add(i);
              prior.occurrences.push(occurrence);
              if (
                net.length !== prior.net.length ||
                !net.every(
                  (
                    point: Readonly<AutoMovieVector3Tuple>,
                    j: number,
                  ): boolean =>
                    point.every(
                      (value: number, k: number): boolean =>
                        value === prior.net[j]![k],
                    ),
                )
              )
                prior.conflict = true;
            } else {
              if (map === native && map.size >= policy.maxNativeOwners)
                throw new Error("Declared native coefficient owner budget");
              map.set(id, {
                net,
                incidents: new Set([i]),
                occurrences: [occurrence],
                conflict: false,
              });
            }
          }
        }
    } catch (error: unknown) {
      invalid.add(i);
      reject([chart], "Invalid named boundary chart", { error: String(error) });
    }
  }
  for (const [id, list] of indices)
    if (list.length > 1) {
      for (const i of list) invalid.add(i);
      reject(
        list.map((i: number): IAutoMovieRecoveryEventChartInput => charts[i]!),
        "Chart identity is not unique",
        { authority: id },
      );
    }
  for (const map of [native, endpoints])
    for (const [authority, owner] of map)
      if (owner.conflict) {
        const incident: IAutoMovieRecoveryEventChartInput[] = [
          ...owner.incidents,
        ].map((i: number): IAutoMovieRecoveryEventChartInput => {
          invalid.add(i);
          return charts[i]!;
        });
        reject(
          incident,
          "Distinct coefficients claim one named boundary owner",
          {
            authority,
            coefficientOccurrences: owner.occurrences,
            incidentDomainOmitted: true,
            unrelatedFiniteChartsRetained: true,
          },
        );
      }
  const candidates: Candidate[] = [];
  for (const [i, chart] of charts.entries()) {
    if (invalid.has(i)) continue;
    try {
      const result:
        | IAutoMovieRecoveryChartPatchBudgetFailure
        | IAutoMovieRecoveryNativeChartCompilation = compile(chart, policy);
      if (result.complete) candidates.push({ chart, result });
      else
        reject([chart], result.reason, {
          requiredPatches: result.requiredPatches,
        });
    } catch (error: unknown) {
      reject([chart], "Named chart coefficient construction failed", {
        error: String(error),
      });
    }
  }
  const equal: (a: Point, b: Point) => boolean = (
    a: Point,
    b: Point,
  ): boolean => a.x === b.x && a.y === b.y && a.z === b.z;
  const constructed: Map<
    string,
    {
      net: Point[];
      incidents: { candidate: Candidate; net: Point[] }[];
      conflict: boolean;
    }
  > = new Map();
  for (const candidate of candidates)
    for (const boundary of candidate.result.recipe.boundaryAuthorities!) {
      const net: Point[] = boundary.controlIds.map(
        (id: number): Point => candidate.result.recipe.controls[id]!,
      );
      const prior:
        | {
            net: Point[];
            incidents: { candidate: Candidate; net: Point[] }[];
            conflict: boolean;
          }
        | undefined = constructed.get(boundary.id);
      if (prior) {
        prior.incidents.push({ candidate, net });
        if (
          !net.every((point: Point, i: number): boolean =>
            equal(point, prior.net[i]!),
          )
        )
          prior.conflict = true;
      } else
        constructed.set(boundary.id, {
          net,
          incidents: [{ candidate, net }],
          conflict: false,
        });
    }
  const conflicted: Set<Candidate> = new Set();
  for (const [authority, owner] of constructed)
    if (owner.conflict) {
      for (const { candidate } of owner.incidents) conflicted.add(candidate);
      reject(
        owner.incidents.map(
          (row: {
            candidate: Candidate;
            net: Point[];
          }): IAutoMovieRecoveryEventChartInput => row.candidate.chart,
        ),
        "Constructed incident coefficient authority conflict",
        {
          authority,
          incidentCoefficients: owner.incidents.map(
            (row: { candidate: Candidate; net: Point[] }): object => ({
              chart: row.candidate.chart.id,
              coefficients: row.net,
            }),
          ),
        },
      );
    }
  const controls: Point[] = [],
    parent: number[] = [],
    rank: number[] = [];
  const boundaryOwners: Map<string, number[]> = new Map(),
    sharedEndpoints: Map<string, number> = new Map();
  const compiled: { candidate: Candidate; ids: number[] }[] = [];
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
    if (!equal(controls[a]!, controls[b]!))
      throw new Error(
        "Distinct constructed coefficients cannot share one index",
      );
    if (rank[a]! < rank[b]!) [a, b] = [b, a];
    parent[b] = a;
    if (rank[a] === rank[b]) rank[a] = rank[a]! + 1;
  };
  let patchCount: number = 0;
  for (const candidate of candidates) {
    if (conflicted.has(candidate)) continue;
    const recipe: IAutoMovieBicubicAtlasGeometry = candidate.result.recipe;
    if (patchCount + recipe.patches.length > policy.maxTotalPatches) {
      reject([candidate.chart], "Declared aggregate patch budget");
      continue;
    }
    patchCount += recipe.patches.length;
    const ids: number[] = recipe.controls.map((point: Point): number => {
      const id: number = controls.length;
      controls.push(point);
      parent.push(id);
      rank.push(0);
      return id;
    });
    for (const boundary of recipe.boundaryAuthorities!) {
      const incident: number[] = boundary.controlIds.map(
        (id: number): number => ids[id]!,
      );
      const prior: number[] | undefined = boundaryOwners.get(boundary.id);
      if (prior)
        for (let k: number = 0; k < 4; k++) join(prior[k]!, incident[k]!);
      else boundaryOwners.set(boundary.id, incident);
    }
    for (const endpoint of candidate.result.endpointControlOwners) {
      const incident: number = ids[endpoint.controlId]!,
        prior: number | undefined = sharedEndpoints.get(endpoint.id);
      if (prior !== undefined) join(prior, incident);
      else sharedEndpoints.set(endpoint.id, incident);
    }
    compiled.push({ candidate, ids });
  }
  const finalControls: Point[] = [],
    rootIds: Map<number, number> = new Map();
  const finalId: (id: number) => number = (id: number): number => {
    const root: number = find(id);
    let result: number | undefined = rootIds.get(root);
    if (result === undefined) {
      result = finalControls.length;
      rootIds.set(root, result);
      finalControls.push({ ...controls[root]! });
    }
    return result;
  };
  const patches: IAutoMovieBicubicAtlasGeometry["patches"] = [],
    boundaryBindings: IAutoMovieBicubicAtlasGeometry["boundaryBindings"] = [];
  const sourcePieces: IAutoMovieRecoveryFieldComplexPiece[] = [];
  for (const { candidate, ids } of compiled) {
    for (const patch of candidate.result.recipe.patches) {
      const remapped: number[] = patch.controlIds.map((id: number): number =>
        finalId(ids[id]!),
      );
      patches.push({
        ...patch,
        controlIds: remapped,
      });
    }
    boundaryBindings.push(...candidate.result.recipe.boundaryBindings!);
    sourcePieces.push(
      ...candidate.result.sourcePieces.map(
        (
          piece: Compiled["sourcePieces"][number],
        ): IAutoMovieRecoveryFieldComplexPiece => ({
          ...piece,
          owningChart: candidate.chart.id,
        }),
      ),
    );
  }
  if (
    new Set(
      patches.map(
        (patch: IAutoMovieBicubicAtlasGeometry["patches"][number]): string =>
          patch.id,
      ),
    ).size !== patches.length
  )
    throw new Error("Patch identities collide across named domains");
  const boundaryAuthorities: NonNullable<
    IAutoMovieBicubicAtlasGeometry["boundaryAuthorities"]
  > = [...boundaryOwners].map(
    ([id, ids]: [string, number[]]): NonNullable<
      IAutoMovieBicubicAtlasGeometry["boundaryAuthorities"]
    >[number] => {
      const mapped: number[] = ids.map(finalId);
      return {
        id,
        controlIds: [mapped[0]!, mapped[1]!, mapped[2]!, mapped[3]!],
      };
    },
  );
  const recipe: IAutoMovieBicubicAtlasGeometry = {
    type: "bicubic-atlas",
    topologyDomain: input.id,
    controls: finalControls,
    patches,
    boundaryAuthorities,
    boundaryBindings,
    tolerance: policy.toleranceMm * 0.001,
    maxCells: policy.maxCells,
    cellBudgetPolicy: "retain-coarse",
    maxVertices: policy.maxVertices,
    sourceFit: {
      qualified: false,
      maximumResidual: null,
      unqualifiedPatches: patches.map(
        (patch: IAutoMovieBicubicAtlasGeometry["patches"][number]): string =>
          patch.id,
      ),
      diagnostics: [
        "Named chart ownership and finite interpolation do not certify source-interior fidelity, material phase, regularity or embedding.",
      ],
    },
  };
  return {
    recipe,
    sourcePieces,
    unsupported,
    counts: {
      requestedCharts: charts.length,
      compiledCharts: compiled.length,
      patches: patches.length,
      sharedCubicAuthorities: boundaryAuthorities.length,
      controls: finalControls.length,
    },
    coverageComplete: unsupported.length === 0 && input.observationComplete,
    observationComplete: input.observationComplete,
    sourceFitQualified: false,
    embeddingQualified: false,
    sourceTopologyPublic: false,
  };
}
