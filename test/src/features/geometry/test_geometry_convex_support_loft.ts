import { evaluateAutoMovieSupportSection } from "@automovie/engine/geometry/evaluateAutoMovieSupportSection";
import { realizeAutoMovieConvexSupportLoft } from "@automovie/engine/geometry/realizeAutoMovieConvexSupportLoft";
import type { IAutoMovieConvexSupportLoft } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../internal/nclose";

/**
 * Continuous cubic support fields generate their own boundary events and normals.
 *
 * Scenarios:
 * 1. A rectangular section has outward triangle winding, unit normals and shared physical vertices with separate normal fans.
 * 2. A diagonal moving plane vanishes at an independently known Y event without a cap, crack or zero normal.
 * 3. Adjacent spans share physical boundaries while retaining their own normal fans.
 * 4. A cubic diagonal is redundant at both ends but active inside, creating two independently known boundary events.
 * 5. Sparse/nonunit/unbounded fields, weak feasible intersections including an isolated interior tie, complete collapse and exhausted budgets refuse.
 *
 * @evidence contracts/testing.md#behavioral-verification Runs the public engine producer, checks actual output positions against their independent face equations, analytical normals, triangle winding, physical alias equality and event diagnostics. Invalid inputs throw without an accepted partial mesh.
 * @evidence contracts/testing.md#independent-expectations Constant half-axes .02/.01 metres fix the box boundary. A fifth plane with offset (a+b)/sqrt(2)+.004(t-.5) meets the positive corner at t=.5, so one feasible event occurs at Y=.05 metres. For a unit-half-axis square, h(t)=2-6t(1-t) crosses sqrt(2) twice despite being redundant at both ends. Two positive-diagonal bounds h(t)=3(1-2t)^2/256 are redundant on [-1,0] squared, but their weak nonparallel intersection touches exactly at the origin only at t=.5 and must receive the same refusal as a direct section. Analytic plane gradients determine outward normals independently of emitted triangles.
 * @evidence contracts/testing.md#distinguishing-cases Covers no events, one vanishing face, interior-only face activation with two events, adjacent spans, exact physical aliases and distinct analytic normal fans, open ends, positive triangle orientation, nonunit/sparse/reversed/unbounded fields, a feasible near-parallel pair hidden by ordinary cancellation, an isolated interior weak tie versus the same strictly lifted redundant bounds, complete interior collapse and event/cell/vertex budget refusals.
 * @evidence contracts/testing.md#execution-ownership This portable test_geometry_convex_support_loft entry owns bounded engine CPU arrays only; it builds no native artifact, starts no process/browser/GPU and replaces no foreign method.
 */
export function test_geometry_convex_support_loft(): void {
  const make: (
    event: boolean,
  ) => Parameters<typeof realizeAutoMovieConvexSupportLoft>[0] = (
    event: boolean,
  ): Parameters<typeof realizeAutoMovieConvexSupportLoft>[0] => {
    const loft: IAutoMovieConvexSupportLoft = {
      planes: [
        { id: "positive-x", normal: [1, 0] },
        { id: "positive-z", normal: [0, 1] },
        { id: "negative-x", normal: [-1, 0] },
        { id: "negative-z", normal: [0, -1] },
      ],
      spans: [
        {
          interval: [0, 0.1],
          offsets: [
            [0.02, 0.02, 0.02, 0.02],
            [0.01, 0.01, 0.01, 0.01],
            [0.02, 0.02, 0.02, 0.02],
            [0.01, 0.01, 0.01, 0.01],
          ],
        },
      ],
    };
    if (event) {
      loft.planes.push({
        id: "moving-diagonal",
        normal: [Math.SQRT1_2, Math.SQRT1_2],
      });
      loft.spans[0].offsets.push(
        [-0.002, -0.002 / 3, 0.002 / 3, 0.002].map(
          (offset: number): number => 0.03 * Math.SQRT1_2 + offset,
        ) as [number, number, number, number],
      );
    }
    return {
      loft,
      topologyDomain: "independent-support-box",
      tolerance: 0.00005,
      maxPlanes: 8,
      maxEvents: 8,
      maxCells: 1000,
      maxVertices: 2000,
      minimumDirectionSine: 0.0001,
    };
  };
  for (const mode of ["box", "event", "adjacent"] as const) {
    const event: boolean = mode === "event";
    const input: Parameters<typeof realizeAutoMovieConvexSupportLoft>[0] =
      make(event);
    if (mode === "adjacent") {
      const next: (typeof input.loft.spans)[number] = structuredClone(
        input.loft.spans[0],
      );
      input.loft.spans[0].interval[1] = 0.05;
      next.interval[0] = 0.05;
      input.loft.spans.push(next);
    }
    const generated: ReturnType<typeof realizeAutoMovieConvexSupportLoft> =
      realizeAutoMovieConvexSupportLoft(input);
    TestValidator.equals(
      "feasible event count",
      generated.events,
      event ? 1 : 0,
    );
    TestValidator.predicate(
      "realized surface is finite and open",
      generated.mesh.positions.length > 0 &&
        generated.mesh.positions.every(Number.isFinite) &&
        generated.mesh.normals!.every(Number.isFinite),
    );
    const aliases: Map<number, [number, number, number]> = new Map();
    const fans: Map<number, Set<string>> = new Map();
    const expectedNormals: number[][] = [
      [1, 0, 0],
      [0, 0, 1],
      [-1, 0, 0],
      [0, 0, -1],
    ];
    if (event)
      expectedNormals.push(
        [Math.SQRT1_2, -0.04, Math.SQRT1_2].map(
          (value: number): number => value / Math.hypot(1, 0.04),
        ),
      );
    for (let v: number = 0; v < generated.mesh.positions.length / 3; v++) {
      const x: number = generated.mesh.positions[3 * v],
        y: number = generated.mesh.positions[3 * v + 1],
        z: number = generated.mesh.positions[3 * v + 2];
      const nx: number = generated.mesh.normals![3 * v],
        ny: number = generated.mesh.normals![3 * v + 1],
        nz: number = generated.mesh.normals![3 * v + 2];
      TestValidator.predicate(
        "unit own-face normal and uncapped interval",
        nclose(Math.hypot(nx, ny, nz), 1, 1e-12) && y >= 0 && y <= 0.1,
      );
      TestValidator.predicate(
        "normal equals an independent analytic face gradient",
        expectedNormals.some(
          (normal: number[]): boolean =>
            nclose(nx, normal[0], 1e-12) &&
            nclose(ny, normal[1], 1e-12) &&
            nclose(nz, normal[2], 1e-12),
        ),
      );
      TestValidator.predicate(
        "every vertex lies on its own independently specified face",
        nclose(
          nx * x + ny * y + nz * z,
          Math.abs(ny) > 1e-12
            ? (0.03 * Math.SQRT1_2 - 0.002) / Math.hypot(1, 0.04)
            : Math.abs(nx) > 0.5
              ? 0.02
              : 0.01,
          1e-12,
        ),
      );
      TestValidator.predicate(
        "independent support inequalities",
        Math.abs(x) <= 0.02 + 1e-12 &&
          Math.abs(z) <= 0.01 + 1e-12 &&
          (!event ||
            Math.SQRT1_2 * (x + z) <=
              0.03 * Math.SQRT1_2 + 0.004 * (y / 0.1 - 0.5) + 1e-12),
      );
      const id: number = generated.mesh.physicalVertices!.vertices[v]!;
      const fan: Set<string> = fans.get(id) ?? new Set();
      fan.add([nx, ny, nz].join(":"));
      fans.set(id, fan);
      const previous: [number, number, number] | undefined = aliases.get(id);
      if (previous)
        TestValidator.predicate(
          "declared boundary aliases reuse exact positions",
          previous[0] === x && previous[1] === y && previous[2] === z,
        );
      else aliases.set(id, [x, y, z]);
    }
    TestValidator.predicate(
      "one physical boundary retains distinct normal fans",
      [...fans.values()].some((fan: Set<string>): boolean => fan.size > 1),
    );
    for (let f: number = 0; f < generated.mesh.indices!.length; f += 3) {
      const indices: number[] = generated.mesh.indices!.slice(f, f + 3);
      const p: number[][] = indices.map((v: number): number[] =>
        generated.mesh.positions.slice(3 * v, 3 * v + 3),
      );
      const u: number[] = p[1].map(
        (value: number, i: number): number => value - p[0][i],
      );
      const v: number[] = p[2].map(
        (value: number, i: number): number => value - p[0][i],
      );
      const normal: number[] = generated.mesh.normals!.slice(
        3 * indices[0],
        3 * indices[0] + 3,
      );
      TestValidator.predicate(
        "every triangle faces its own outward normal",
        (u[1] * v[2] - u[2] * v[1]) * normal[0] +
          (u[2] * v[0] - u[0] * v[2]) * normal[1] +
          (u[0] * v[1] - u[1] * v[0]) * normal[2] >
          0,
      );
    }
    const edges: Map<string, { count: number; ends: [number, number] }> =
      new Map();
    for (let f: number = 0; f < generated.mesh.indices!.length; f += 3) {
      const ids: number[] = generated.mesh
        .indices!.slice(f, f + 3)
        .map(
          (v: number): number => generated.mesh.physicalVertices!.vertices[v]!,
        );
      for (let side: number = 0; side < 3; side++) {
        const a: number = ids[side],
          b: number = ids[(side + 1) % 3];
        const key: string = `${Math.min(a, b)}:${Math.max(a, b)}`;
        const previous: { count: number; ends: [number, number] } | undefined =
          edges.get(key);
        if (previous) previous.count++;
        else edges.set(key, { count: 1, ends: [a, b] });
      }
    }
    for (const edge of edges.values())
      TestValidator.predicate(
        "physical edges close internally and remain open only at supplied ends",
        edge.count === 2 ||
          (edge.count === 1 &&
            edge.ends.every((id: number): boolean =>
              nclose(aliases.get(id)![1], 0, 1e-12),
            )) ||
          (edge.count === 1 &&
            edge.ends.every((id: number): boolean =>
              nclose(aliases.get(id)![1], 0.1, 1e-12),
            )),
      );
    TestValidator.equals(
      "event isolation is independently qualified",
      generated.eventQualification,
      "binary64-numerical-not-certified",
    );
    if (event)
      TestValidator.predicate(
        "vanishing event has shared physical corner and omitted collapsed triangle",
        generated.omittedCollapsedTriangles > 0 &&
          [...aliases.values()].some(
            (p: [number, number, number]): boolean =>
              nclose(p[0], 0.02, 1e-12) &&
              nclose(p[1], 0.05, 1e-12) &&
              nclose(p[2], 0.01, 1e-12),
          ),
      );
  }
  const interior: Parameters<typeof realizeAutoMovieConvexSupportLoft>[0] =
    make(false);
  interior.loft.spans[0].offsets = interior.loft.planes.map(
    (): [number, number, number, number] => [1, 1, 1, 1],
  );
  interior.loft.planes.push({
    id: "interior-diagonal",
    normal: [Math.SQRT1_2, Math.SQRT1_2],
  });
  interior.loft.spans[0].offsets.push([2, 0, 0, 2]);
  interior.tolerance = 0.01;
  interior.maxCells = 5000;
  interior.maxVertices = 20000;
  const crossed: ReturnType<typeof realizeAutoMovieConvexSupportLoft> =
    realizeAutoMovieConvexSupportLoft(interior);
  TestValidator.equals(
    "interior-only active face retains both events",
    crossed.events,
    2,
  );
  for (const sign of [-1, 1]) {
    const phase: number =
      (1 + sign * Math.sqrt(1 - (2 * (2 - Math.SQRT2)) / 3)) / 2;
    TestValidator.predicate(
      "independent quadratic event height is emitted",
      crossed.mesh.positions.some(
        (value: number, index: number): boolean =>
          index % 3 === 1 && nclose(value, phase * 0.1, 1e-10),
      ),
    );
  }
  const delta: number = 2 ** -48,
    diagonal: number = Math.SQRT1_2;
  let weakRefusal: boolean = false;
  try {
    evaluateAutoMovieSupportSection({
      normals: [
        [diagonal, diagonal * (1 + delta)],
        [diagonal * (1 - delta), diagonal],
        [-1, 0],
        [0, -1],
      ],
      offsets: [0, 0, 1, 1],
      minimumDirectionSine: 0.0001,
    });
  } catch (error: unknown) {
    weakRefusal =
      error instanceof Error && error.message.includes("weak-support-boundary");
  }
  TestValidator.predicate(
    "exact nonparallel feasible pair cannot be skipped as parallel",
    weakRefusal,
  );
  const interiorWeak: Parameters<typeof realizeAutoMovieConvexSupportLoft>[0] =
    make(false);
  interiorWeak.loft.planes.push(
    { id: "interior-weak-a", normal: [diagonal, diagonal * (1 + delta)] },
    { id: "interior-weak-b", normal: [diagonal * (1 - delta), diagonal] },
  );
  interiorWeak.loft.spans[0].offsets = [
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [1, 1, 1, 1],
    [1, 1, 1, 1],
    [3 / 256, -1 / 256, -1 / 256, 3 / 256],
    [3 / 256, -1 / 256, -1 / 256, 3 / 256],
  ];
  const separatedWeak: typeof interiorWeak = structuredClone(interiorWeak);
  for (const coefficients of separatedWeak.loft.spans[0].offsets.slice(4))
    for (let i: number = 0; i < coefficients.length; i++)
      coefficients[i] += 1 / 256;
  const separated: ReturnType<typeof realizeAutoMovieConvexSupportLoft> =
    realizeAutoMovieConvexSupportLoft(separatedWeak);
  TestValidator.predicate(
    "strictly redundant weak bounds preserve the independent square",
    separated.events === 0 &&
      separated.mesh.positions.length > 0 &&
      separated.mesh.positions.every(
        (coordinate: number, index: number): boolean =>
          index % 3 === 1 ||
          nclose(coordinate, -1, 1e-12) ||
          nclose(coordinate, 0, 1e-12),
      ),
  );
  let interiorWeakRefusal: boolean = false;
  try {
    realizeAutoMovieConvexSupportLoft(interiorWeak);
  } catch (error: unknown) {
    interiorWeakRefusal =
      error instanceof Error && error.message.includes("weak-support-boundary");
  }
  TestValidator.predicate(
    "isolated interior weak incidence obeys the same section admission",
    interiorWeakRefusal,
  );
  const collapse: Parameters<typeof realizeAutoMovieConvexSupportLoft>[0] =
    make(false);
  // 3(1-2t)^2/256 is positive at both ends and exactly zero at t=.5.
  collapse.loft.spans[0].offsets = collapse.loft.planes.map(
    (): [number, number, number, number] => [
      3 / 256,
      -1 / 256,
      -1 / 256,
      3 / 256,
    ],
  );
  let collapseRefusal: boolean = false;
  try {
    realizeAutoMovieConvexSupportLoft(collapse);
  } catch (error: unknown) {
    collapseRefusal =
      error instanceof Error && error.message.includes("support-collapse");
  }
  TestValidator.predicate(
    "whole-section interior collapse cannot become a complete lateral surface",
    collapseRefusal,
  );
  for (const change of [
    "normal",
    "sparse",
    "interval",
    "unbounded",
    "events",
    "cells",
    "vertices",
  ]) {
    const input: Parameters<typeof realizeAutoMovieConvexSupportLoft>[0] =
      make(true);
    if (change === "normal") input.loft.planes[0].normal[0] = 2;
    if (change === "sparse")
      Reflect.deleteProperty(input.loft.spans[0].offsets[0], "1");
    if (change === "interval") input.loft.spans[0].interval.reverse();
    if (change === "unbounded") {
      input.loft.planes = input.loft.planes.slice(0, 3);
      input.loft.spans[0].offsets = input.loft.spans[0].offsets.slice(0, 3);
    }
    if (change === "events") input.maxEvents = 0;
    if (change === "cells") input.maxCells = 1;
    if (change === "vertices") input.maxVertices = 3;
    let refused: boolean = false;
    try {
      realizeAutoMovieConvexSupportLoft(input);
    } catch {
      refused = true;
    }
    TestValidator.predicate(
      "unsupported support field or exhausted budget refuses",
      refused,
    );
  }
}
