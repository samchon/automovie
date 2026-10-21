import {
  type IAutoMovieCurve64 as C,
  type IAutoMovieContourLoft64 as L,
  tessellateAutoMovieContourLoft64,
} from "@automovie/engine/geometry/curve";
import {
  createAutoMovieRecoveryContourFileMesh,
  writeAutoMovieRecoveryArtifact,
} from "@automovie/recovery/node";
import { TestValidator } from "@nestia/e2e";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { nclose } from "../internal/nclose";

/**
 * A long source-free prism crosses the private three-page storage window.
 * Scenarios:
 * 1. 2050 four-corner stations generate 8200 vertices and 16392 triangles.
 * 2. Every published coordinate, index, normal and construction sample matches memory.
 * 3. Final backing lengths exclude page padding; known lateral area is retained.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls the public file and memory contour consumers on the same authored millimetre cubic banks, publishes actual fragment-backed output, then reads every resulting channel. More than 8190 vertices force table eviction and the final seven-station region includes a partial page. Canonical validation stays explicitly deferred.
 * @evidence contracts/testing.md#independent-expectations Four corners at each of 2050 stations give 8200 vertices; 2049 square strips each contribute eight triangles and lateral area 8 metres times 2.049 metres. Complete scalar/index/construction equality against the memory kernel additionally distinguishes backing changes, including normals, but does not independently prove canonical topology or visual fidelity.
 * @evidence contracts/testing.md#distinguishing-cases This entry owns public end-to-end generation across page eviction and the partial tail. The vector-page entry owns short/failing I/O, signed-zero and logical-row state; the smaller contour-file entry owns cavity, empty, exact/one-below ceiling and callback/publication failures. No source mesh, Human fixture, fit or resource-limit increase enters this case.
 * @evidence contracts/testing.md#execution-ownership The discoverable unit runs synchronous portable CPU geometry/file APIs in its own temporary directory and removes that directory after retaining the primary failure. It starts no process, native build, browser or GPU and replaces no foreign method.
 */
export function test_geometry_contour_paged_output(): void {
  const directory: string = fs.mkdtempSync(
    path.join(os.tmpdir(), "automovie-contour-paged-"),
  );
  const stations: number = 2050;
  const loft: L = {
    sections: Array.from(
      { length: stations },
      (_value: unknown, index: number): L.ISection => {
        const points: C.Vector[] = [
          [-1000, index, -1000],
          [1000, index, -1000],
          [1000, index, 1000],
          [-1000, index, 1000],
        ];
        return {
          coordinateMm: index,
          loops: [
            {
              winding: 1,
              curve: {
                type: "cubicBezier",
                name: `square.${index}`,
                unit: "mm",
                phaseUnit: "mm",
                closed: true,
                phaseIntervals: [2000, 2000, 2000, 2000],
                spans: points.map((a: C.Vector, ordinal: number): C.Span => {
                  const b: C.Vector = points[(ordinal + 1) % 4]!;
                  return [
                    a,
                    [a[0] + (b[0] - a[0]) / 3, index, a[2] + (b[2] - a[2]) / 3],
                    [
                      a[0] + (2 * (b[0] - a[0])) / 3,
                      index,
                      a[2] + (2 * (b[2] - a[2])) / 3,
                    ],
                    b,
                  ];
                }),
              },
            },
          ],
        };
      },
    ),
    intervals: Array.from(
      { length: stations - 1 },
      (_value: unknown, index: number): L.IInterval => ({
        beforeMm: index,
        afterMm: index + 1,
        groups: [{ before: [0], after: [0], supported: true, reason: null }],
      }),
    ),
    events: [],
    chordToleranceMm: 0.2,
  };
  let failed: boolean = false,
    primary: unknown;
  try {
    const original: string = JSON.stringify(loft);
    const memory: L.IResult = tessellateAutoMovieContourLoft64(loft);
    const generated: ReturnType<typeof createAutoMovieRecoveryContourFileMesh> =
      createAutoMovieRecoveryContourFileMesh(
        loft,
        path.join(directory, "channels"),
        {
          maxVertices: 8200,
          maxTriangles: 16392,
        },
      );
    const file: string = path.join(directory, "output.json");
    writeAutoMovieRecoveryArtifact(
      file,
      { mesh: generated.mesh, construction: generated.construction },
      generated.arraySources,
    );
    const actual: Pick<L.IResult, "mesh" | "construction"> = JSON.parse(
      fs.readFileSync(file, "utf8"),
    );
    TestValidator.equals(
      "independent vertex population",
      generated.emission.vertices,
      8200,
    );
    TestValidator.equals(
      "independent face population",
      generated.emission.triangles,
      16392,
    );
    for (const field of ["positions", "normals"] as const)
      TestValidator.predicate(
        "complete scalar equality across eviction",
        actual.mesh[field]!.length === memory.mesh[field]!.length &&
          actual.mesh[field]!.every((value: number, i: number): boolean =>
            nclose(value, memory.mesh[field]![i]!, 0),
          ),
      );
    TestValidator.equals(
      "original face and corner ordering",
      actual.mesh.indices,
      memory.mesh.indices,
    );
    TestValidator.predicate(
      "all construction curves retain points and phases",
      actual.construction.length === stations &&
        actual.construction.every(
          (
            curve: L.IResult["construction"][number],
            index: number,
          ): boolean => {
            const expected: typeof curve = memory.construction[index]!;
            return (
              curve.id === expected.id &&
              curve.closed === expected.closed &&
              curve.points.length === expected.points.length &&
              curve.phases!.length === expected.phases!.length &&
              curve.points.every((point: C.Vector, i: number): boolean =>
                point.every((value: number, axis: number): boolean =>
                  nclose(value, expected.points[i]![axis]!, 0),
                ),
              ) &&
              curve.phases!.every((value: number, i: number): boolean =>
                nclose(value, expected.phases![i]!, 0),
              )
            );
          },
        ),
    );
    let area: number = 0;
    for (
      let offset: number = 0;
      offset < actual.mesh.indices!.length;
      offset += 3
    ) {
      const corners: number[][] = actual.mesh
        .indices!.slice(offset, offset + 3)
        .map((index: number): number[] =>
          actual.mesh.positions.slice(index * 3, index * 3 + 3),
        );
      const a: number[] = corners[1]!.map(
        (value: number, axis: number): number => value - corners[0]![axis]!,
      );
      const b: number[] = corners[2]!.map(
        (value: number, axis: number): number => value - corners[0]![axis]!,
      );
      area +=
        Math.hypot(
          a[1]! * b[2]! - a[2]! * b[1]!,
          a[2]! * b[0]! - a[0]! * b[2]!,
          a[0]! * b[1]! - a[1]! * b[0]!,
        ) / 2;
    }
    TestValidator.predicate(
      "dimensioned prism lateral area",
      nclose(area, 8 * 2.049, 1e-9),
    );
    for (const table of Object.values(generated.tables))
      TestValidator.equals(
        "only actual rows are persisted",
        fs.statSync(table).size,
        8200 * 24,
      );
    TestValidator.equals(
      "canonical qualification remains deferred",
      generated.qualification.canonicalValidation,
      "deferred",
    );
    TestValidator.equals(
      "input coefficient authority unchanged",
      JSON.stringify(loft),
      original,
    );
  } catch (error: unknown) {
    failed = true;
    primary = error;
  }
  try {
    if (
      !path
        .resolve(directory)
        .startsWith(
          path.resolve(os.tmpdir()) + path.sep + "automovie-contour-paged-",
        )
    )
      throw new Error("Owned contour-page temporary containment failed");
    fs.rmSync(directory, { recursive: true, force: false });
  } catch (error: unknown) {
    if (!failed) {
      failed = true;
      primary = error;
    }
  }
  if (failed) throw primary;
}
