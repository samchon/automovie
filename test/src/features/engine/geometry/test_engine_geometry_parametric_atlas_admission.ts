import {
  AutoMovieEngineCanonicalBoundary64,
  AutoMovieEngineCurve,
} from "@automovie/engine";
import type { IAutoMovieTessellateParametricAtlas64 as Atlas } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { throwsError } from "../../internal/throwsError";

/**
 * Canonical atlas planning and chart emission retain independent valid work
 * after failed requests, callbacks and sample validation.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the shared seam, finite conflict, callback-local omission, budget rollback and finite zero-area telemetry.
 * @evidence contracts/development/testing.md#behavioral-verification Exercises actual adjacent affine charts with unequal seam subdivisions, exact directed maps, several nonfinite inputs, a late callback exception under a tight budget and a coincident finite chart.
 * @evidence contracts/development/testing.md#independent-expectations Adjacent charts share the three physical samples of the finer seam, with unit normals derived from different slope vectors. A single 2-by-2 affine plane has nine vertices and eight faces. The zero-area control has eight omitted faces and nine singular samples. A failed chart must consume zero of the healthy chart's available vertices.
 */
export function test_engine_geometry_parametric_atlas_admission(): void {
  const make = (
    id: string,
    startX: number,
    stepsU: number,
    stepsV: number,
    slope: number = 0,
    sharedSide?: number,
  ): Atlas.IPatch => {
    const evaluate: Atlas.IPatch["evaluate"] = (u, v) => ({
      point: [startX + u * 1000, v * 1000, u * slope],
      du: [1000, 0, slope],
      dv: [0, 1000, 0],
    });
    const coordinates: ((t: number) => [number, number])[] = [
      (t) => [t, 0],
      (t) => [1, t],
      (t) => [t, 1],
      (t) => [0, t],
    ];
    return {
      id,
      stepsU,
      stepsV,
      evaluate,
      edges: coordinates.map((apply, side) => ({
        authority: side === sharedSide ? "shared" : id + "-side-" + side,
        start: 0,
        end: 1,
        sample: (phase) => {
          const { point } = evaluate(...apply(phase.value));
          return { key: point.join(":"), point };
        },
      })),
    };
  };
  const changeEdge = (
    patch: Atlas.IPatch,
    side: number,
    change: Partial<Atlas.IEdge>,
  ): Atlas.IPatch => ({
    ...patch,
    edges: patch.edges.map((edge, index) =>
      index === side ? { ...edge, ...change } : edge,
    ),
  });
  const atlas = (
    patches: Atlas.IPatch[],
    maxVertices: number = 128,
  ): Atlas.IResult =>
    AutoMovieEngineCurve.tessellateParametricAtlas64({
      domain: "owned-patch-atlas",
      maxVertices,
      patches,
    });

  const left = make("left", 0, 1, 1, 0, 1);
  const right = make("right", 1000, 1, 2, 500, 3);
  const joined = atlas([left, right]);
  TestValidator.equals(
    "adjacent chart sizes",
    [joined.retainedPatches, joined.counts.vertices, joined.counts.triangles],
    [["left", "right"], 12, 9],
  );
  const seam = new Map<number, { id: number; normalX: number }[]>();
  for (let vertex = 0; vertex < joined.counts.vertices; vertex++) {
    const at = 3 * vertex;
    if (joined.mesh.positions[at] !== 1) continue;
    const y = joined.mesh.positions[at + 1]!;
    const samples = seam.get(y) ?? [];
    samples.push({
      id: joined.mesh.physicalVertices!.vertices[vertex]!,
      normalX: joined.mesh.normals![at]!,
    });
    seam.set(y, samples);
  }
  TestValidator.equals(
    "three common positions on the shared seam",
    [...seam.keys()].sort(),
    [0, 0.5, 1],
  );
  for (const pair of seam.values())
    TestValidator.predicate(
      "shared identities preserve separate normal fans",
      pair.length === 2 &&
        pair[0]!.id === pair[1]!.id &&
        pair[0]!.normalX === 0 &&
        Math.abs(pair[1]!.normalX + 1 / Math.sqrt(5)) < 1e-15,
    );

  const leftOwner = left.edges[1]!;
  const rightOwner = right.edges[3]!;
  const phaseOf = AutoMovieEngineCanonicalBoundary64.phase;
  const ease = (t: number): number => (t + t * t) / 2;
  const warped = changeEdge(
    {
      ...right,
      evaluate: (u, v) => ({
        ...right.evaluate(u, ease(v)),
        dv: [0, 500 * (1 + 2 * v), 0],
      }),
      edges: right.edges.map((edge, side) =>
        side === 1
          ? {
              ...edge,
              sample: (phase) => edge.sample(phaseOf(0, 1, ease(phase.value))),
            }
          : edge,
      ),
    },
    3,
    {
      parameterize: (t) => phaseOf(0, 1, ease(t)),
      localize: (phase) => (Math.sqrt(1 + 8 * phase.value) - 1) / 2,
    },
  );
  const warpedMesh = atlas([left, warped]);
  TestValidator.equals(
    "finite nonlinear map keeps both chart grids",
    [
      warpedMesh.retainedPatches,
      warpedMesh.counts.vertices,
      warpedMesh.counts.triangles,
    ],
    [["left", "right"], 12, 9],
  );
  TestValidator.predicate(
    "nonlinear finest prescribed seam is shared",
    [0, 0.375, 1].every((y) => {
      const ids: number[] = [];
      for (let vertex = 0; vertex < warpedMesh.counts.vertices; vertex++)
        if (
          warpedMesh.mesh.positions[3 * vertex] === 1 &&
          warpedMesh.mesh.positions[3 * vertex + 1] === y
        )
          ids.push(warpedMesh.mesh.physicalVertices!.vertices[vertex]!);
      return ids.length === 2 && ids[0] === ids[1];
    }),
  );
  const reversed: Atlas.IPatch = {
    ...right,
    evaluate: (u, v) => ({ ...right.evaluate(u, 1 - v), dv: [0, -1000, 0] }),
    edges: [
      right.edges[2]!,
      {
        ...right.edges[1]!,
        sample: (phase) =>
          right.edges[1]!.sample(phaseOf(0, 1, 1 - phase.value)),
      },
      right.edges[0]!,
      { ...rightOwner, start: 1, end: 0 },
    ],
  };
  const reversedMesh = atlas([left, reversed]);
  TestValidator.equals(
    "reversed restrictions retain both occurrences",
    [
      reversedMesh.retainedPatches,
      reversedMesh.counts.vertices,
      reversedMesh.counts.triangles,
    ],
    [["left", "right"], 12, 9],
  );
  const reversedNormalZ: number = -0.89;
  TestValidator.predicate(
    "reversed chart reverses its normal fan",
    reversedMesh.mesh.normals!.some(
      (value, index) => index % 3 === 2 && value < reversedNormalZ,
    ),
  );

  const finiteConflict = changeEdge(left, 1, {
    sample: (phase) => {
      const sample = leftOwner.sample(phase);
      return phase.value === 0.5
        ? { ...sample, point: [1000, 501, 0] }
        : sample;
    },
  });
  const refused = atlas([finiteConflict, right]);
  TestValidator.equals(
    "finite identity conflict omits both incident charts",
    [
      refused.retainedPatches.length,
      refused.counts.omittedPatches,
      refused.counts.vertices,
    ],
    [0, 2, 0],
  );
  TestValidator.predicate(
    "finite conflict diagnostic",
    refused.diagnostics.some((message) =>
      message.includes("Inconsistent canonical point"),
    ),
  );

  const badSample = changeEdge(left, 1, {
    sample: (phase) => {
      const sample = leftOwner.sample(phase);
      return phase.value === 0.5 ? { ...sample, point: [NaN, 500, 0] } : sample;
    },
  });
  const badInverse = changeEdge(left, 1, {
    parameterize: (t) => phaseOf(0, 1, t),
    localize: (phase) => (phase.value === 0.5 ? NaN : phase.value),
  });
  for (const [invalid, reason] of [
    [badSample, "Three finite curve coordinates"],
    [badInverse, "Boundary inverse leaves its local restriction"],
  ] as const) {
    const result = atlas([invalid, right]);
    TestValidator.equals(
      "only the invalid boundary callback loses its chart",
      [
        result.retainedPatches,
        result.counts.vertices,
        result.counts.triangles,
        result.counts.omittedPatches,
      ],
      [["right"], 6, 4, 1],
    );
    TestValidator.predicate(
      "located callback refusal",
      result.diagnostics.some(
        (message) => message.startsWith("left:") && message.includes(reason),
      ),
    );
  }
  const coarse = { ...right, stepsV: 1 };
  const fineFailure = atlas([{ ...badSample, stepsV: 2 }, coarse], 12);
  TestValidator.equals(
    "rejected phase owner consumes no neighbor budget",
    [
      fineFailure.retainedPatches,
      fineFailure.counts.vertices,
      fineFailure.counts.triangles,
    ],
    [["right"], 4, 2],
  );
  TestValidator.equals(
    "coarse mesh matches its exact independent budget",
    fineFailure.mesh,
    atlas([coarse], 12).mesh,
  );

  const brokenPhase = changeEdge(right, 3, {
    ...rightOwner,
    parameterize: (t) =>
      t === 0.5 ? { key: "broken", value: t } : phaseOf(0, 1, t),
    localize: (phase) => phase.value,
  });
  const plan = atlas([left, brokenPhase]);
  TestValidator.equals(
    "bad phase controls leave no shared sample requests",
    [
      plan.retainedPatches,
      plan.counts.vertices,
      plan.counts.triangles,
      plan.counts.omittedPatches,
    ],
    [["left"], 4, 2, 1],
  );
  TestValidator.predicate(
    "located phase request refusal",
    plan.diagnostics.some(
      (message) =>
        message.startsWith("right:") &&
        message.includes("Invalid canonical dyadic phase key"),
    ),
  );

  let evaluated = false;
  const failing = make("fails", 0, 2, 2);
  const healthy = make("healthy", 2000, 2, 2);
  TestValidator.predicate(
    "fractional lattice policy refuses before evaluation",
    throwsError(
      () =>
        atlas([
          {
            ...failing,
            stepsU: 1.5,
            evaluate: (u, v) => {
              evaluated = true;
              return failing.evaluate(u, v);
            },
          },
        ]),
      "integer lattice counts",
    ) && !evaluated,
  );
  const healthyOnly = atlas([healthy], 21);
  TestValidator.equals(
    "tight budget admits an independent plane",
    [
      healthyOnly.retainedPatches,
      healthyOnly.counts.vertices,
      healthyOnly.counts.triangles,
    ],
    [["healthy"], 9, 8],
  );
  const failedEvaluations: Atlas.IPatch["evaluate"][] = [
    (u, v) => {
      if (u === 0.5 && v === 0.5) throw new Error("late authored callback");
      return failing.evaluate(u, v);
    },
    (u, v) =>
      u === 0.5 && v === 0.5
        ? { ...failing.evaluate(u, v), point: [NaN, 500, 0] }
        : failing.evaluate(u, v),
    (u, v) =>
      u === 0.5 && v === 0.5
        ? { ...failing.evaluate(u, v), du: [Infinity, 0, 0] }
        : failing.evaluate(u, v),
  ];
  for (const evaluate of failedEvaluations) {
    const result = atlas([{ ...failing, evaluate }, healthy], 21);
    TestValidator.equals(
      "rollback retains the identical independent mesh",
      result.mesh,
      healthyOnly.mesh,
    );
    TestValidator.equals(
      "releases budget and all candidate work counters",
      [
        result.retainedPatches,
        result.counts.vertices,
        result.counts.triangles,
        result.counts.omittedPatches,
        result.counts.singularNormals,
      ],
      [["healthy"], 9, 8, 1, 0],
    );
  }
  const coincident = atlas([
    {
      ...failing,
      evaluate: () => ({ point: [0, 0, 0], du: [0, 0, 0], dv: [0, 0, 0] }),
      edges: failing.edges.map((edge) => ({
        ...edge,
        sample: () => ({ key: "coincident", point: [0, 0, 0] }),
      })),
    },
  ]);
  TestValidator.equals(
    "finite zero-area work retains telemetry",
    [
      coincident.counts.vertices,
      coincident.counts.triangles,
      coincident.counts.zeroAreaTriangles,
      coincident.counts.singularNormals,
      coincident.counts.omittedPatches,
    ],
    [9, 0, 8, 9, 1],
  );
}
