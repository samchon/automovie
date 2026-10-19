import {
  applyAutoMovieRecoveryAnalyticPublication,
  realizeAutoMovieRecoveryAnalyticDomains,
} from "@automovie/recovery";
import { reconstructAutoMovieRecoveryLocal } from "@automovie/recovery/node";
import { TestValidator } from "@nestia/e2e";
import fs from "node:fs";
import path from "node:path";

import type { IAutoMovieCurve64 as C } from "../../../../packages/engine/src/geometry/curve/IAutoMovieCurve64";
import { nclose } from "../internal/nclose";

/**
 * Named analytic ownership delegates exactly its saved occurrences and preserves local failures.
 * Scenarios:
 * 1. Two disjoint affine squares each own one declared open pair and retain both finite meshes.
 * 2. A wrong raw handle, missing port or duplicate occurrence refuses incident ownership only.
 * 3. A native corner conflict keeps explicit partial ownership and the unrelated finite chart.
 * 4. The full local consumer skips delegated Hermite pairs and publishes their same analytic meshes once.
 * 5. Exact input hashes and unique finite C0 overrides bind one registry without mutating original reports.
 * 6. A base publication exposes generated analytic parts before retained open work and remains explicitly unfinished.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls analytic admission, the native realizer, pure publication admission and complete local reconstruction. Actual retained area, ownership maps, partial reports and published pair counts expose duplicate execution, global loss or falsely completed processing.
 * @evidence contracts/testing.md#independent-expectations Each degree-elevated 3 by 3 millimetre square has area 9e-6 square metres. Disjoint saved pair addresses require two independent owners; a changed handle cannot equal its original raw coefficients. One explicitly shared corner with two different coordinates must omit its incident patch while an independent square remains finite. Delegated pairs require no legacy open generation.
 * @evidence contracts/testing.md#distinguishing-cases Covers absent extension, valid disjoint pairs, missing port, raw coefficient mismatch, duplicate claim, finite partial atlas, exact input-hash refusal, immutable overrides and final-only publication. Companion atlas tests own general tessellation bounds, periodic sampling and geometry conditioning.
 * @evidence contracts/testing.md#execution-ownership This named portable CPU test imports the maintained recovery and engine seams, starts no host or process and performs no source observation or fit. Its owned working-directory scratch tree is removed in finally; no fixture or Human asset is read.
 */
export function test_geometry_recovery_analytic_domains(): void {
  type Input = Parameters<typeof reconstructAutoMovieRecoveryLocal>[0];
  type Graph = NonNullable<
    Parameters<typeof realizeAutoMovieRecoveryAnalyticDomains>[1]
  >;
  type Domain = NonNullable<Input["analyticDomains"]>[number];
  const curve: (name: string, y: number, offset: number) => C.Cubic = (
    name: string,
    y: number,
    offset: number,
  ): C.Cubic => ({
    type: "cubicBezier",
    name,
    closed: false,
    unit: "mm",
    phaseUnit: "normalized",
    phaseIntervals: [1],
    spans: [
      [
        [offset, y, 0],
        [offset + 1, y, 0],
        [offset + 2, y, 0],
        [offset + 3, y, 0],
      ],
    ],
  });
  const bundle: Input = {
    schema: "automovie-recovery-curves-v1",
    loft: {
      sections: [0, 3].map(
        (coordinateMm: number): Input["loft"]["sections"][number] => ({
          coordinateMm,
          loops: [],
        }),
      ),
      intervals: [{ beforeMm: 0, afterMm: 3, groups: [] }],
      events: [],
      chordToleranceMm: 0.05,
    },
    reports: [0, 3].map(
      (coordinateMm: number, row: number): Input["reports"][number] => ({
        coordinateMm,
        fits: [],
        open: [0, 10].map(
          (
            offset: number,
            i: number,
          ): Input["reports"][number]["open"][number] => ({
            curve: curve(`${row ? "hi" : "lo"}${i}`, coordinateMm, offset),
            sampleMaximumMm: 0,
            polylineUpperEstimateMm: 0,
            toleranceMet: true,
            observationsPerSpan: 2,
            handleFallbacks: 0,
          }),
        ),
        isolatedContactsMm: [],
        diagnostics: [],
      }),
    ),
    diagnostics: [],
    topologyGaps: [],
    unconsumedEvents: [],
    policy: {
      axis: [0, 1, 0],
      reference: [0, 0, -1],
      stepMm: 3,
      toleranceMm: 0.5,
      chordToleranceMm: 0.05,
      maxSections: 2,
      maxSpans: 8,
      exactCoordinateAliases: false,
      sourceOrientationSign: 1,
      cornerDegrees: 55,
    },
    summary: { observations: 8, spans: 4, sections: 2, events: 0, aliases: 0 },
  };
  const graph: Graph = {
    schema: "automovie-recovery-open-continuation-v1",
    criticalPolicy: "boundary-regular-path-v1",
    intervals: [
      {
        beforeSection: 0,
        afterSection: 1,
        pairs: [
          { before: 0, after: 0, reverseAfter: false },
          { before: 1, after: 1, reverseAfter: false },
        ],
        unresolved: [],
      },
    ],
    orientations: [
      [1, 1],
      [1, 1],
    ],
    diagnostics: [],
    resolutionMm: 1,
    maxVerticesPerRun: 64,
  };
  const domain: (i: number) => Domain = (i: number): Domain => ({
    id: `square${i}`,
    geometry: {
      type: "bicubic-atlas",
      topologyDomain: `square${i}`,
      controls: Array.from(
        { length: 16 },
        (_: unknown, k: number): { x: number; y: number; z: number } => ({
          x: (10 * i + (k % 4)) * 0.001,
          y: Math.floor(k / 4) * 0.001,
          z: 0,
        }),
      ),
      patches: [
        {
          id: `patch${i}`,
          controlIds: Array.from(
            { length: 16 },
            (_: unknown, k: number): number => k,
          ),
        },
      ],
      boundaryAuthorities: [
        { id: `lo${i}.span0`, controlIds: [0, 1, 2, 3] },
        { id: `hi${i}.span0`, controlIds: [12, 13, 14, 15] },
      ],
      boundaryBindings: [
        {
          patch: `patch${i}`,
          side: 0,
          authority: `lo${i}.span0`,
          start: 0,
          end: 1,
          normalFan: `square${i}`,
        },
        {
          patch: `patch${i}`,
          side: 2,
          authority: `hi${i}.span0`,
          start: 0,
          end: 1,
          normalFan: `square${i}`,
        },
      ],
      tolerance: 0.00005,
      maxCells: 16,
      maxVertices: 128,
    },
    closedGroups: [],
    openPairs: [{ interval: 0, pair: i }],
    openUnresolved: [],
    ports: [
      { curveName: `lo${i}`, side: "lower" },
      { curveName: `hi${i}`, side: "upper" },
    ],
    curveBindings: [
      { curveName: `lo${i}`, span: 0, authority: `lo${i}.span0` },
      { curveName: `hi${i}`, span: 0, authority: `hi${i}.span0` },
    ],
    observationComplete: true,
    unrepresentedDomains: [],
  });
  const original: string = JSON.stringify(bundle);
  TestValidator.equals(
    "absent analytic extension",
    realizeAutoMovieRecoveryAnalyticDomains(bundle, graph).reports.length,
    0,
  );
  const values: Domain[] = [domain(0), domain(1)];
  const valid: ReturnType<typeof realizeAutoMovieRecoveryAnalyticDomains> =
    realizeAutoMovieRecoveryAnalyticDomains(
      { ...bundle, analyticDomains: values },
      graph,
    );
  TestValidator.predicate(
    "two admitted independent pair owners",
    valid.parts.length === 2 &&
      valid.openPairs.size === 2 &&
      valid.reports.every(
        (r: (typeof valid.reports)[number]): boolean =>
          r.admitted && r.complete,
      ),
  );
  let area: number = 0;
  for (const part of valid.parts)
    if (part.geometry.type === "mesh") {
      const mesh: typeof part.geometry.mesh = part.geometry.mesh;
      for (let i: number = 0; i < mesh.indices!.length; i += 3) {
        const points: number[][] = mesh
          .indices!.slice(i, i + 3)
          .map((id: number): number[] =>
            mesh.positions.slice(3 * id, 3 * id + 3),
          );
        area +=
          ((points[1]![0]! - points[0]![0]!) *
            (points[2]![1]! - points[0]![1]!) -
            (points[1]![1]! - points[0]![1]!) *
              (points[2]![0]! - points[0]![0]!)) /
          2;
      }
    }
  TestValidator.predicate(
    "independent physical square areas",
    nclose(area, 18e-6, 1e-18),
  );
  for (const mode of ["handle", "port", "duplicate"] as const) {
    const bad: Domain[] = structuredClone(values);
    if (mode === "handle") bad[0]!.geometry.controls[1]!.z = 0.0001;
    if (mode === "port")
      bad[0] = { ...bad[0]!, ports: bad[0]!.ports.slice(0, 1) };
    if (mode === "duplicate")
      bad[1] = {
        ...bad[1]!,
        openPairs: [{ interval: 0, pair: 0 }],
        ports: bad[0]!.ports,
        curveBindings: [],
      };
    const result: ReturnType<typeof realizeAutoMovieRecoveryAnalyticDomains> =
      realizeAutoMovieRecoveryAnalyticDomains(
        { ...bundle, analyticDomains: bad },
        graph,
      );
    TestValidator.predicate(
      `local ${mode} refusal`,
      mode === "duplicate"
        ? result.openPairs.size === 0
        : result.openPairs.size === 1 &&
            result.parts.length === 1 &&
            result.reports[1]!.complete,
    );
  }
  const conflict: Domain[] = structuredClone(values),
    broken: Domain["geometry"] = conflict[0]!.geometry;
  broken.controls.push({ x: 0, y: 0, z: 0.0001 });
  broken.boundaryAuthorities = [
    ...broken.boundaryAuthorities!,
    { id: "wrong-side", controlIds: [16, 4, 8, 12] },
  ];
  broken.boundaryBindings = [
    ...broken.boundaryBindings!,
    {
      patch: "patch0",
      side: 3,
      authority: "wrong-side",
      start: 0,
      end: 1,
      normalFan: "wrong-side",
    },
  ];
  const partial: ReturnType<typeof realizeAutoMovieRecoveryAnalyticDomains> =
    realizeAutoMovieRecoveryAnalyticDomains(
      { ...bundle, analyticDomains: conflict },
      graph,
    );
  TestValidator.predicate(
    "native conflict is local explicit partial",
    partial.parts.length === 1 &&
      partial.openPairs.size === 2 &&
      partial.reports[0]!.admitted &&
      !partial.reports[0]!.complete &&
      partial.reports[1]!.complete,
  );
  const publication: Parameters<
    typeof applyAutoMovieRecoveryAnalyticPublication
  >[1] = {
    schema: "automovie-recovery-analytic-publication-v1",
    sourceCommit: "a".repeat(40),
    curveBundleSha256: "b".repeat(64),
    continuationSha256: "c".repeat(64),
    curveOverrides: [
      { curve: bundle.reports[0]!.open[0]!.curve, dataUpperEstimateMm: 0 },
    ],
    analyticDomains: values,
  };
  const hashes: Parameters<
    typeof applyAutoMovieRecoveryAnalyticPublication
  >[2] = {
    curveBundleSha256: publication.curveBundleSha256,
    continuationSha256: publication.continuationSha256,
  };
  TestValidator.predicate(
    "publication preserves original report scope",
    applyAutoMovieRecoveryAnalyticPublication(bundle, publication, hashes)
      .coefficientPublication!.originalReportsRetained,
  );
  let refused: boolean = false;
  try {
    applyAutoMovieRecoveryAnalyticPublication(bundle, publication, {
      ...hashes,
      curveBundleSha256: "d".repeat(64),
    });
  } catch {
    refused = true;
  }
  TestValidator.predicate("wrong original bytes refuse", refused);
  const directory: string = fs.mkdtempSync(
    path.join(process.cwd(), ".analytic-test-"),
  );
  try {
    const output: string = path.join(directory, "model.json");
    const reconstruction: ReturnType<typeof reconstructAutoMovieRecoveryLocal> =
      reconstructAutoMovieRecoveryLocal(
        { ...bundle, analyticDomains: values },
        graph,
        output,
        {
          sourceEpoch: "a".repeat(40),
          ...hashes,
          operator: "ruled",
          publishCheckpoints: false,
        },
      );
    const artifact: {
      analyticReports: { complete: boolean }[];
      openReports: { pairs: number; visitedPairs: number };
      coverage: { retainedDomainComplete: boolean };
      counts: { triangles: number };
    } = JSON.parse(fs.readFileSync(output, "utf8")) as {
      analyticReports: { complete: boolean }[];
      openReports: { pairs: number; visitedPairs: number };
      coverage: { retainedDomainComplete: boolean };
      counts: { triangles: number };
    };
    TestValidator.predicate(
      "delegated pairs execute once through the analytic owner",
      artifact.analyticReports.length === 2 &&
        artifact.openReports.pairs === 0 &&
        artifact.openReports.visitedPairs === 0 &&
        artifact.counts.triangles > 0 &&
        artifact.coverage.retainedDomainComplete,
    );
    const base: {
      publicationRole: string;
      coverage: { attemptComplete: boolean };
      counts: { triangles: number };
      openReports: { visitedPairs: number };
    } = JSON.parse(
      fs.readFileSync(reconstruction.baseCheckpoint.path, "utf8"),
    ) as {
      publicationRole: string;
      coverage: { attemptComplete: boolean };
      counts: { triangles: number };
      openReports: { visitedPairs: number };
    };
    TestValidator.equals(
      "generated base role",
      base.publicationRole,
      "analytic-and-retained-closed-base",
    );
    TestValidator.equals(
      "base does not claim processing completion",
      base.coverage.attemptComplete,
      false,
    );
    TestValidator.predicate(
      "base contains actual delegated finite geometry",
      base.counts.triangles > 0 && base.openReports.visitedPairs === 0,
    );
    const retainedOutput: string = path.join(directory, "retained.json");
    reconstructAutoMovieRecoveryLocal(
      { ...bundle, analyticDomains: [values[0]!] },
      graph,
      retainedOutput,
      {
        sourceEpoch: "a".repeat(40),
        ...hashes,
        operator: "ruled",
        publishCheckpoints: false,
      },
    );
    const retained: {
      openReports: {
        pairs: number;
        visitedPairs: number;
        failedRunPairs: number;
      };
      analyticReports: { complete: boolean }[];
      model: { parts: { id: string }[] };
    } = JSON.parse(fs.readFileSync(retainedOutput, "utf8")) as {
      openReports: {
        pairs: number;
        visitedPairs: number;
        failedRunPairs: number;
      };
      analyticReports: { complete: boolean }[];
      model: { parts: { id: string }[] };
    };
    TestValidator.predicate(
      "remaining pair uses its original LocalHermite dispatch",
      retained.openReports.pairs === 1 &&
        retained.openReports.visitedPairs === 1 &&
        retained.openReports.failedRunPairs === 0 &&
        retained.analyticReports.length === 1 &&
        retained.model.parts.some(
          (part: { id: string }): boolean => part.id === "recovery.local-open",
        ),
    );
    TestValidator.predicate(
      "final-only avoids prefix artifacts",
      fs
        .readdirSync(directory)
        .every((name: string): boolean => !name.includes("checkpoint")),
    );
  } finally {
    fs.rmSync(directory, { recursive: true });
  }
  TestValidator.equals(
    "original coefficients and reports remain immutable",
    JSON.stringify(bundle),
    original,
  );
}
