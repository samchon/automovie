import type { IAutoMovieCurve64 as C } from "../../../packages/engine/src/geometry/curve/IAutoMovieCurve64.ts";
import type { RecoveryChartBoundaryNetwork } from "./RecoveryChartBoundaryNetwork.ts";
import type { RecoveryChartBoundaryNetworkRegistry } from "./RecoveryChartBoundaryNetworkRegistry.ts";

type Input = Parameters<typeof RecoveryChartBoundaryNetwork>[0];

type Cut = {
  key: string;
  fraction: number;
  point: C.Vector;
  aliases: Set<string>;
};
/**
 * Augment copied chart banks with their registered physical cuts in original triangle order.
 *
 * @evidence contracts/common.md#principled-implementation Each boundary-edge split preserves the original incidence updates, winding checks and area reductions.
 * @evidence contracts/common.md#clear-and-simple-design This phase retains its original arithmetic and ordered state transitions while its caller owns orchestration.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Extraction introduces no input correction, geometry fallback, reordered reduction or changed admission condition.
 * @evidence contracts/common.md#meaningful-documentation States the phase responsibility, shared-state ownership and numerical limits inherited from the calling algorithm.
 * @evidence contracts/performance.md#efficient-algorithms Traverses copied triangles and requested boundary cuts with the original incidence maps.
 * @evidence contracts/performance.md#reuse-equivalent-work Uses the existing registry and mutates the same copied chart arrays without rebuilding ownership.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only the caller-owned registry is mutated; local incidence and normal arrays expire per chart.
 */
export function RecoveryChartBoundaryNetworkAugment(
  input: Input,
  context: ReturnType<typeof RecoveryChartBoundaryNetworkRegistry>,
): number {
  const {
    cuts,
    insertionKeys,
    declaredPoints,
    charts,
    orderedCuts,
    diagnostics,
    normal,
    indexed,
    blend,
  }: ReturnType<typeof RecoveryChartBoundaryNetworkRegistry> = context;
  let {
    maximumPointChange,
  }: ReturnType<typeof RecoveryChartBoundaryNetworkRegistry> = context;
  const coherent: (n: C.Vector, before: C.Vector) => boolean = (
    n: C.Vector,
    before: C.Vector,
  ): boolean => {
    const a: number = Math.hypot(...n),
      b: number = Math.hypot(...before);
    return (
      a > 0 &&
      b > 0 &&
      Number.isFinite(a) &&
      Number.isFinite(b) &&
      n.reduce(
        (sum: number, value: number, k: number): number =>
          sum + (value / a) * (before[k]! / b),
        0,
      ) > 0
    );
  };
  for (let c: number = 0; c < charts.length; c++) {
    const chart: (typeof charts)[number] = charts[c]!,
      source: (typeof input.charts)[number] = input.charts[c]!;
    const incidence: Map<string, Set<number>> = new Map();
    const update: (
      triangle: readonly [number, number, number],
      face: number,
      add: boolean,
    ) => void = (
      triangle: readonly [number, number, number],
      face: number,
      add: boolean,
    ): void => {
      for (let k: number = 0; k < 3; k++) {
        const key: string = indexed(triangle[k]!, triangle[(k + 1) % 3]!);
        if (!incidence.has(key)) incidence.set(key, new Set());
        if (add) incidence.get(key)!.add(face);
        else incidence.get(key)!.delete(face);
      }
    };
    let originalArea: number = 0,
      missingBanks: number = 0;
    const originalNormals: C.Vector[] = [];
    for (let face: number = 0; face < chart.triangles.length; face++) {
      const t: [number, number, number] = chart.triangles[face]!;
      if (
        !Array.isArray(t) ||
        t.length !== 3 ||
        new Set(t).size !== 3 ||
        t.some(
          (id: number): boolean =>
            !Number.isSafeInteger(id) ||
            id < 0 ||
            id >= chart.verticesMm.length,
        )
      )
        throw new Error("Private triangle identities are invalid");
      const n: C.Vector = normal(
        source.verticesMm[t[0]]!,
        source.verticesMm[t[1]]!,
        source.verticesMm[t[2]]!,
      );
      originalNormals.push(n);
      const area: number = Math.hypot(...n) / 2;
      if (!(area > 0 && Number.isFinite(area)))
        throw new Error(
          "Private source triangle area is collapsed or unrepresentable",
        );
      originalArea += area;
      update(t, face, true);
    }
    for (let i: number = 0; i < chart.physicalKeys.length; i++) {
      const key: string = chart.physicalKeys[i]!,
        ancestry: { base: string; fraction: number } | undefined =
          insertionKeys.get(key);
      if (ancestry) {
        const cut: Cut = cuts
            .get(ancestry.base)!
            .values.get(ancestry.fraction)!,
          point: C.Vector = chart.verticesMm[i]!;
        if (
          ![cut.point, ...declaredPoints.get(key)!].some(
            (allowed: C.Vector): boolean =>
              allowed.every((v: number, k: number): boolean => v === point[k]),
          )
        )
          throw new Error(
            "An existing inserted vertex contradicts its declared physical observation",
          );
        maximumPointChange = Math.max(
          maximumPointChange,
          Math.hypot(
            ...point.map((v: number, k: number): number => v - cut.point[k]!),
          ),
        );
        chart.verticesMm[i] = [...cut.point];
        chart.physicalKeys[i] = cut.key;
      }
    }
    for (let face: number = 0; face < chart.triangles.length; face++) {
      const t: [number, number, number] = chart.triangles[face]!;
      if (
        !coherent(
          normal(
            chart.verticesMm[t[0]]!,
            chart.verticesMm[t[1]]!,
            chart.verticesMm[t[2]]!,
          ),
          originalNormals[face]!,
        )
      )
        throw new Error(
          "Canonical point ownership collapsed or reversed an original private triangle",
        );
    }
    for (const [base, authority] of cuts) {
      let found: boolean = false;
      const phase: (key: string) => number | undefined = (
        key: string,
      ): number | undefined =>
        key === authority.endpoints[0]
          ? 0
          : key === authority.endpoints[1]
            ? 1
            : insertionKeys.get(key)?.base === base
              ? insertionKeys.get(key)!.fraction
              : undefined;
      for (const cut of orderedCuts.get(base)!) {
        for (const side of chart.sides)
          for (let at: number = 0; at + 1 < side.length; at++) {
            const a: number = side[at]!,
              b: number = side[at + 1]!,
              qa: number | undefined = phase(chart.physicalKeys[a]!),
              qb: number | undefined = phase(chart.physicalKeys[b]!);
            if (qa === undefined || qb === undefined) continue;
            if (qa === qb)
              throw new Error(
                "A declared base-edge bank collapses its physical phase",
              );
            found = true;
            if (
              !(
                cut.fraction > Math.min(qa, qb) &&
                cut.fraction < Math.max(qa, qb)
              )
            )
              continue;
            const rows: Set<number> | undefined = incidence.get(indexed(a, b));
            if (!rows || rows.size !== 1)
              throw new Error(
                "A quarter-cut bank lacks one unique boundary triangle",
              );
            const face: number = [...rows][0]!,
              old: [number, number, number] = chart.triangles[face]!,
              position: number = old.findIndex(
                (id: number, i: number): boolean =>
                  (id === a && old[(i + 1) % 3] === b) ||
                  (id === b && old[(i + 1) % 3] === a),
              );
            if (position < 0)
              throw new Error(
                "A private subdivision lost its incident triangle edge",
              );
            const first: number = old[position]!,
              last: number = old[(position + 1) % 3]!,
              opposite: number = old[(position + 2) % 3]!,
              id: number = chart.verticesMm.length;
            const local: number = (cut.fraction - qa) / (qb - qa);
            if (!(local > 0 && local < 1 && Number.isFinite(local)))
              throw new Error("A bank-local cut has no representable phase");
            const prior: C.Vector = blend(
              chart.verticesMm[a]!,
              chart.verticesMm[b]!,
              local,
            );
            maximumPointChange = Math.max(
              maximumPointChange,
              Math.hypot(
                ...prior.map(
                  (v: number, k: number): number => v - cut.point[k]!,
                ),
              ),
            );
            chart.verticesMm.push([...cut.point]);
            chart.physicalKeys.push(cut.key);
            const children: [number, number, number][] = [
                [first, id, opposite],
                [id, last, opposite],
              ],
              oldNormal: C.Vector = normal(
                chart.verticesMm[old[0]]!,
                chart.verticesMm[old[1]]!,
                chart.verticesMm[old[2]]!,
              );
            for (const child of children)
              if (
                !coherent(
                  normal(
                    chart.verticesMm[child[0]]!,
                    chart.verticesMm[child[1]]!,
                    chart.verticesMm[child[2]]!,
                  ),
                  oldNormal,
                )
              )
                throw new Error(
                  "A conforming boundary split collapsed or reversed a private triangle",
                );
            update(old, face, false);
            chart.triangles[face] = children[0]!;
            update(children[0]!, face, true);
            update(children[1]!, chart.triangles.length, true);
            chart.triangles.push(children[1]!);
            side.splice(at + 1, 0, id);
            at++;
          }
      }
      if (!found) missingBanks++;
    }
    let finalArea: number = 0;
    const sideEdges: Set<string> = new Set();
    for (const side of chart.sides)
      for (let i: number = 0; i + 1 < side.length; i++) {
        const key: string = indexed(side[i]!, side[i + 1]!);
        if (sideEdges.has(key) || incidence.get(key)?.size !== 1)
          throw new Error(
            "Augmented side incidence is duplicated or is not a private boundary",
          );
        sideEdges.add(key);
      }
    for (const [key, faces] of incidence)
      if ((faces.size === 1 && !sideEdges.has(key)) || faces.size > 2)
        throw new Error(
          "Private triangle boundary is missing from the four sides or nonmanifold",
        );
    for (const t of chart.triangles) {
      const area: number =
        Math.hypot(
          ...normal(
            chart.verticesMm[t[0]]!,
            chart.verticesMm[t[1]]!,
            chart.verticesMm[t[2]]!,
          ),
        ) / 2;
      if (!(area > 0 && Number.isFinite(area)))
        throw new Error("Augmented private triangle area is unrepresentable");
      finalArea += area;
    }
    if (!Number.isFinite(originalArea) || !Number.isFinite(finalArea))
      throw new Error("Private source-area accounting became nonfinite");
    if (missingBanks)
      diagnostics.push(
        `${chart.name}: no registered subdivision-chain bank for ${missingBanks} base authorities; no connections fabricated`,
      );
    diagnostics.push(
      `${chart.name}: sourceAreaBeforeMm2=${originalArea}; sourceAreaAfterMm2=${finalArea}; differenceMm2=${finalArea - originalArea}`,
    );
  }

  return maximumPointChange;
}
