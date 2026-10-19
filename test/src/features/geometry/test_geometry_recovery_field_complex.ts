import { TestValidator } from "@nestia/e2e";

import type { IAutoMovieCurve64 as C } from "../../../../packages/engine/src/geometry/curve/IAutoMovieCurve64";
import { realizeAutoMovieBicubicAtlas64 as realize } from "../../../../packages/engine/src/geometry/realizeAutoMovieBicubicAtlas64";
import { type IAutoMovieRecoveryEventChartInput as Chart, AutoMovieRecoveryEventCurve as E, assembleAutoMovieRecoveryFieldComplex as assemble } from "@automovie/recovery";


import { nclose } from "../internal/nclose";

/**
 * Named global assembly preserves finite independent domains and actual shared edges.
 *
 * Scenarios:
 * 1. Two adjacent squares share one complete native edge and realize their combined area.
 * 2. A conflicting incident edge omits both owners while an unrelated square still realizes.
 * 3. A failed corner, repeated domain name or patch budget preserves unrelated geometry.
 * 4. An explicit observation refusal remains textual and prevents complete coverage.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls maintained global assembly and consumes its recipe through the public CPU atlas realizer. It measures triangle area, exact shared index owners and local refusals rather than matching generated snapshots.
 * @evidence contracts/testing.md#independent-expectations Each declared affine three-by-three millimetre square has area9e-6 square metres. Equal edge names require all four equal coefficients; a conflict cannot erase a disconnected finite square or become an average. Insufficient capacity cannot produce complete supplied-domain coverage.
 * @evidence contracts/testing.md#distinguishing-cases Covers shared adjacent domains, unrelated finite output, a genuine raw internal-control conflict, mismatched corner, repeated ID, empty input, aggregate patch exhaustion and observation refusal. Partial intervals and reversal arithmetic have their dedicated native-compiler test; no source fidelity or embedding assertion follows.
 * @evidence contracts/testing.md#execution-ownership Portable mathematical curves exercise maintained assembly and the actual engine in process. No anatomical fixture, original mesh, fitter, filesystem, host process, viewer or GPU is involved.
 */
export function test_geometry_recovery_field_complex(): void {
  const policy: Parameters<typeof assemble>[1] = {
    maxCharts: 16,
    maxNativeOwners: 64,
    maxTotalPatches: 16,
    maxPatches: 16,
    maxCells: 1024,
    maxVertices: 4096,
    toleranceMm: 0.01,
  };
  const square: (id: string, x: number) => Chart = (
    id: string,
    x: number,
  ): Chart => {
    const a: C.Vector = [x, 0, 0],
      b: C.Vector = [x + 3, 0, 0],
      c: C.Vector = [x, 3, 0],
      d: C.Vector = [x + 3, 3, 0];
    return {
      id,
      winding: 1,
      chart: {
        bottom: E.line(a, b, id + ".bottom"),
        top: E.line(c, d, id + ".top"),
        left: E.line(a, c, id + ".left"),
        right: E.line(b, d, id + ".right"),
      },
    };
  };
  const first: Chart = square("first", 0),
    other: Chart = square("other", 3),
    far: Chart = square("far", 20);
  const second: Chart = {
    ...other,
    chart: { ...other.chart, left: first.chart.right },
  };
  const area: (
    recipe: ReturnType<typeof assemble>["recipe"],
    sharedX?: number,
  ) => number = (
    recipe: ReturnType<typeof assemble>["recipe"],
    sharedX?: number,
  ): number => {
    const actual: ReturnType<typeof realize> = realize(recipe);
    TestValidator.equals(
      "finite supplied recipe realizes completely",
      actual.complete,
      true,
    );
    const p: number[] = actual.mesh.positions,
      triangles: number[] = actual.mesh.indices!;
    const sharedEdges: Map<string, { uses: number; direction: number }> =
      new Map();
    let total: number = 0;
    for (let i: number = 0; i < triangles.length; i += 3) {
      const a: number = triangles[i]! * 3,
        b: number = triangles[i + 1]! * 3,
        c: number = triangles[i + 2]! * 3;
      const x: number = p[b]! - p[a]!,
        y: number = p[b + 1]! - p[a + 1]!,
        z: number = p[b + 2]! - p[a + 2]!;
      const u: number = p[c]! - p[a]!,
        v: number = p[c + 1]! - p[a + 1]!,
        w: number = p[c + 2]! - p[a + 2]!;
      total += Math.hypot(y * w - z * v, z * u - x * w, x * v - y * u) / 2;
      if (sharedX !== undefined)
        for (let k: number = 0; k < 3; k++) {
          const a: number = triangles[i + k]!,
            b: number = triangles[i + ((k + 1) % 3)]!;
          if (
            !nclose(p[a * 3]!, sharedX, 1e-14) ||
            !nclose(p[b * 3]!, sharedX, 1e-14)
          )
            continue;
          const pa: number = actual.mesh.physicalVertices!.vertices[a]!,
            pb: number = actual.mesh.physicalVertices!.vertices[b]!;
          const key: string = pa < pb ? `${pa}:${pb}` : `${pb}:${pa}`;
          const edge: { uses: number; direction: number } = sharedEdges.get(
            key,
          ) ?? { uses: 0, direction: 0 };
          edge.uses++;
          edge.direction += pa < pb ? 1 : -1;
          sharedEdges.set(key, edge);
        }
    }
    if (sharedX !== undefined) {
      TestValidator.predicate(
        "declared shared physical edge is present",
        sharedEdges.size > 0,
      );
      TestValidator.predicate(
        "actual shared edge has exactly two opposed uses",
        [...sharedEdges.values()].every(
          (edge: { uses: number; direction: number }): boolean =>
            edge.uses === 2 && edge.direction === 0,
        ),
      );
    }
    return total;
  };
  const adjacent: ReturnType<typeof assemble> = assemble(
    { id: "adjacent", charts: [first, second], observationComplete: true },
    policy,
  );
  TestValidator.equals(
    "two accepted authored domains",
    adjacent.counts.compiledCharts,
    2,
  );
  TestValidator.equals(
    "declared coverage complete",
    adjacent.coverageComplete,
    true,
  );
  TestValidator.predicate(
    "combined physical square area",
    nclose(area(adjacent.recipe, 0.003), 18e-6, 1e-14),
  );
  const shared:
    | NonNullable<typeof adjacent.recipe.boundaryAuthorities>[number]
    | undefined = adjacent.recipe.boundaryAuthorities!.find(
    (
      row: NonNullable<typeof adjacent.recipe.boundaryAuthorities>[number],
    ): boolean => row.id === first.chart.right.pieces[0]!.source.authority,
  );
  TestValidator.predicate(
    "one shared cubic authority survives",
    shared !== undefined,
  );
  TestValidator.equals(
    "shared coefficient IDs are distinct within the cubic",
    new Set(shared!.controlIds).size,
    4,
  );
  const bad: Chart = {
    ...second,
    chart: {
      ...second.chart,
      left: {
        ...second.chart.left,
        pieces: second.chart.left.pieces.map((piece: E.Piece): E.Piece => {
          const net: C.Span = [
            piece.source.parent[0],
            [
              piece.source.parent[1][0] + 1,
              piece.source.parent[1][1],
              piece.source.parent[1][2],
            ],
            piece.source.parent[2],
            piece.source.parent[3],
          ];
          return { ...piece, source: { ...piece.source, parent: net } };
        }),
      },
    },
  };
  const quarantined: ReturnType<typeof assemble> = assemble(
    { id: "quarantined", charts: [first, bad, far], observationComplete: true },
    policy,
  );
  TestValidator.equals(
    "only unrelated finite chart remains",
    quarantined.counts.compiledCharts,
    1,
  );
  TestValidator.equals(
    "conflicts retain partial supplied-domain status",
    quarantined.coverageComplete,
    false,
  );
  const conflicting: typeof quarantined.unsupported =
    quarantined.unsupported.filter(
      (row: (typeof quarantined.unsupported)[number]): boolean =>
        row.reason === "Distinct coefficients claim one named boundary owner",
    );
  TestValidator.equals(
    "both conflicting incidents are diagnosed",
    conflicting.length,
    2,
  );
  TestValidator.predicate(
    "actual conflicting occurrences remain diagnostic",
    conflicting.every(
      (row: (typeof quarantined.unsupported)[number]): boolean =>
        row.detail !== undefined,
    ),
  );
  TestValidator.predicate(
    "unrelated physical area retained",
    nclose(area(quarantined.recipe), 9e-6, 1e-14),
  );
  const wrongCorner: Chart = {
    ...second,
    chart: {
      ...second.chart,
      left: E.line([3.01, 0, 0], [3, 3, 0], "wrong-corner"),
    },
  };
  const localFailure: ReturnType<typeof assemble> = assemble(
    {
      id: "local-refusal",
      charts: [first, wrongCorner, far],
      observationComplete: true,
    },
    policy,
  );
  TestValidator.equals(
    "local compiler failure keeps both unrelated charts",
    localFailure.counts.compiledCharts,
    2,
  );
  TestValidator.predicate(
    "local compiler failure area remains",
    nclose(area(localFailure.recipe), 18e-6, 1e-14),
  );
  const duplicate: ReturnType<typeof assemble> = assemble(
    {
      id: "duplicates",
      charts: [first, { ...second, id: first.id }, far],
      observationComplete: true,
    },
    policy,
  );
  TestValidator.equals(
    "repeated chart identity omits both incidents",
    duplicate.counts.compiledCharts,
    1,
  );
  TestValidator.predicate(
    "unrelated duplicate-isolated geometry realizes",
    nclose(area(duplicate.recipe), 9e-6, 1e-14),
  );
  const limited: ReturnType<typeof assemble> = assemble(
    { id: "limited", charts: [first, far], observationComplete: true },
    { ...policy, maxTotalPatches: 1 },
  );
  TestValidator.equals(
    "aggregate admission is explicit",
    limited.counts.compiledCharts,
    1,
  );
  TestValidator.equals(
    "budget cannot qualify whole supplied domain",
    limited.coverageComplete,
    false,
  );
  TestValidator.predicate(
    "finite budget prefix remains",
    nclose(area(limited.recipe), 9e-6, 1e-14),
  );
  const empty: ReturnType<typeof assemble> = assemble(
    { id: "empty", charts: [], observationComplete: false },
    policy,
  );
  TestValidator.equals(
    "empty recipe remains empty",
    empty.recipe.patches.length,
    0,
  );
  TestValidator.equals(
    "unfinished observation remains unfinished",
    empty.coverageComplete,
    false,
  );
  const refused: ReturnType<typeof assemble> = assemble(
    {
      id: "observed-refusal",
      charts: [far],
      observationComplete: true,
      unsupported: [
        {
          id: "unrepresented-domain",
          reason: "Unqualified observation ports",
          detail: { kind: "observation-refusal" },
        },
      ],
    },
    policy,
  );
  TestValidator.equals(
    "observation reason is never undefined",
    refused.unsupported[0]!.reason,
    "Unqualified observation ports",
  );
  TestValidator.equals(
    "unrepresented observation prevents complete coverage",
    refused.coverageComplete,
    false,
  );
  TestValidator.predicate(
    "qualified finite chart remains beside observation refusal",
    nclose(area(refused.recipe), 9e-6, 1e-14),
  );
}
