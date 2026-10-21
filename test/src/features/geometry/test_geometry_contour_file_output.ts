import {
  type IAutoMovieCurve64 as C,
  type IAutoMovieContourLoft64 as L,
  generateAutoMovieContourLoft64,
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
 * Actual contour file output retains original indexed geometry and normal order.
 * A dimensioned open-ended square prism and a concentric cavity have independent
 * lateral areas; these are source-free mathematical inputs, not Human fixtures.
 * Scenarios:
 * 1. Prism and cavity preserve indexed values, ordered normals and known area.
 * 2. Exact output ceilings succeed and one-below ceilings refuse.
 * 3. Empty generation and immutable storage retain their distinct outcomes.
 * 4. Vertex/construction callbacks preserve their original thrown identity.
 * 5. Accessors refuse without invocation; reflection failures retain the primary.
 *
 * @evidence contracts/testing.md#behavioral-verification Generates real memory and file channels, publishes and rereads their complete values, measures actual triangle areas, and exercises exact population ceilings and original callback-error identity. Accessors refuse without execution; an input-reflection throw retains its original symbol and leaves no destination. Caller coefficients remain byte-identical.
 * @evidence contracts/testing.md#independent-expectations A two-metre square's perimeter is eight metres and a one-metre axial height gives eight square metres of lateral surface; a one-metre cavity adds four. Four straight boundary spans require eight elementary triangles and eight vertices per cylinder. File/memory equality additionally checks original normal reduction and order, but does not independently prove topology or rasterization.
 * @evidence contracts/testing.md#distinguishing-cases Covers ordinary open-ended prism, reversed cavity winding, complete empty output, exact versus one-below vertex/triangle ceilings, existing destination refusal, throwing vertex/construction callbacks, uncalled accessor refusal and input-reflection failure. Existing contour boundary and strip tests own split/merge, terminal, phase, malformed curve and shared-bank semantics; this entry does not claim actual filesystem cleanup-failure injection or whole canonical validation.
 * @evidence contracts/testing.md#execution-ownership The discoverable entry invokes public CPU kernels and synchronous Node artifact/file consumers with authored cubic geometry in one owned temporary directory. It starts no process/browser/GPU/build and replaces no foreign method; temporary files are removed after preserving any primary test failure.
 */
export function test_geometry_contour_file_output(): void {
  const directory: string = fs.mkdtempSync(
    path.join(os.tmpdir(), "automovie-contour-file-"),
  );
  const ring: (y: number, half: number, name: string) => C.Cubic = (
    y: number,
    half: number,
    name: string,
  ): C.Cubic => {
    const points: C.Vector[] = [
      [-half, y, -half],
      [half, y, -half],
      [half, y, half],
      [-half, y, half],
    ];
    return {
      type: "cubicBezier",
      name,
      unit: "mm",
      phaseUnit: "mm",
      closed: true,
      phaseIntervals: [2 * half, 2 * half, 2 * half, 2 * half],
      spans: points.map((a: C.Vector, index: number): C.Span => {
        const b: C.Vector = points[(index + 1) % points.length]!;
        return [
          a,
          [a[0] + (b[0] - a[0]) / 3, a[1], a[2] + (b[2] - a[2]) / 3],
          [
            a[0] + (2 * (b[0] - a[0])) / 3,
            a[1],
            a[2] + (2 * (b[2] - a[2])) / 3,
          ],
          b,
        ];
      }),
    };
  };
  const input: (cavity: boolean) => L = (cavity: boolean): L => ({
    sections: [0, 1000].map(
      (coordinateMm: number): L.ISection => ({
        coordinateMm,
        loops: [
          {
            curve: ring(coordinateMm, 1000, `outer.${coordinateMm}`),
            winding: 1,
          },
          ...(cavity
            ? [
                {
                  curve: ring(coordinateMm, 500, `inner.${coordinateMm}`),
                  winding: -1 as const,
                },
              ]
            : []),
        ],
      }),
    ),
    intervals: [
      {
        beforeMm: 0,
        afterMm: 1000,
        groups: [
          { before: [0], after: [0], supported: true, reason: null },
          ...(cavity
            ? [{ before: [1], after: [1], supported: true, reason: null }]
            : []),
        ],
      },
    ],
    events: [],
    chordToleranceMm: 0.2,
  });
  const area: (mesh: L.IResult["mesh"]) => number = (
    mesh: L.IResult["mesh"],
  ): number => {
    let total: number = 0;
    for (let face: number = 0; face < mesh.indices!.length; face += 3) {
      const ids: number[] = mesh.indices!.slice(face, face + 3);
      const p: number[][] = ids.map((id: number): number[] =>
        mesh.positions.slice(3 * id, 3 * id + 3),
      );
      const a: number[] = p[1]!.map(
        (value: number, axis: number): number => value - p[0]![axis]!,
      );
      const b: number[] = p[2]!.map(
        (value: number, axis: number): number => value - p[0]![axis]!,
      );
      total +=
        Math.hypot(
          a[1]! * b[2]! - a[2]! * b[1]!,
          a[2]! * b[0]! - a[0]! * b[2]!,
          a[0]! * b[1]! - a[1]! * b[0]!,
        ) / 2;
    }
    return total;
  };
  const refuses: (operation: () => void) => boolean = (
    operation: () => void,
  ): boolean => {
    try {
      operation();
      return false;
    } catch {
      return true;
    }
  };
  let failed: boolean = false,
    primary: unknown;
  try {
    for (const cavity of [false, true]) {
      const loft: L = input(cavity),
        before: string = JSON.stringify(loft);
      const expected: L.IResult = tessellateAutoMovieContourLoft64(loft);
      const count: number = cavity ? 16 : 8;
      TestValidator.equals(
        "independent generated vertex count",
        expected.mesh.positions.length / 3,
        count,
      );
      TestValidator.equals(
        "independent generated triangle count",
        expected.mesh.indices!.length / 3,
        count,
      );
      TestValidator.predicate(
        "dimensioned lateral area",
        nclose(area(expected.mesh), cavity ? 12 : 8, 1e-12),
      );
      const generated: ReturnType<
        typeof createAutoMovieRecoveryContourFileMesh
      > = createAutoMovieRecoveryContourFileMesh(
        loft,
        path.join(directory, cavity ? "cavity" : "prism"),
        { maxVertices: count, maxTriangles: count },
      );
      const target: string = path.join(
        directory,
        cavity ? "cavity.json" : "prism.json",
      );
      writeAutoMovieRecoveryArtifact(
        target,
        { mesh: generated.mesh, construction: generated.construction },
        generated.arraySources,
      );
      const actual: {
        mesh: L.IResult["mesh"];
        construction: L.IResult["construction"];
      } = JSON.parse(fs.readFileSync(target, "utf8"));
      for (const field of ["positions", "normals"] as const)
        TestValidator.predicate(
          "complete original coordinates and ordered normal values",
          actual.mesh[field]!.length === expected.mesh[field]!.length &&
            actual.mesh[field]!.every((value: number, index: number): boolean =>
              nclose(value, expected.mesh[field]![index]!, 0),
            ),
        );
      TestValidator.equals(
        "original index order",
        actual.mesh.indices,
        expected.mesh.indices,
      );
      TestValidator.predicate(
        "complete original generating construction",
        actual.construction.length === expected.construction.length &&
          actual.construction.every(
            (
              row: (typeof actual.construction)[number],
              index: number,
            ): boolean => {
              const original: typeof row = expected.construction[index]!;
              return (
                row.id === original.id &&
                row.closed === original.closed &&
                row.points.length === original.points.length &&
                row.phases!.length === original.phases!.length &&
                row.points.every((point: C.Vector, i: number): boolean =>
                  point.every((value: number, axis: number): boolean =>
                    nclose(value, original.points[i]![axis]!, 0),
                  ),
                ) &&
                row.phases!.every((value: number, i: number): boolean =>
                  nclose(value, original.phases![i]!, 0),
                )
              );
            },
          ),
      );
      TestValidator.equals(
        "source coefficients unchanged",
        JSON.stringify(loft),
        before,
      );
      TestValidator.equals(
        "canonical validation remains deferred",
        generated.qualification.canonicalValidation,
        "deferred",
      );
      TestValidator.predicate(
        "one below vertex ceiling refuses",
        refuses((): void => {
          createAutoMovieRecoveryContourFileMesh(
            loft,
            path.join(directory, cavity ? "cavity-small-v" : "prism-small-v"),
            { maxVertices: count - 1, maxTriangles: count },
          );
        }),
      );
      TestValidator.predicate(
        "one below triangle ceiling refuses",
        refuses((): void => {
          createAutoMovieRecoveryContourFileMesh(
            loft,
            path.join(directory, cavity ? "cavity-small-t" : "prism-small-t"),
            { maxVertices: count, maxTriangles: count - 1 },
          );
        }),
      );
      TestValidator.predicate(
        "existing storage refuses",
        refuses((): void => {
          createAutoMovieRecoveryContourFileMesh(
            loft,
            path.join(directory, cavity ? "cavity" : "prism"),
            { maxVertices: count, maxTriangles: count },
          );
        }),
      );
    }
    const empty: L = {
      sections: [],
      events: [],
      intervals: [],
      chordToleranceMm: 0.2,
    };
    const emptyFile: ReturnType<typeof createAutoMovieRecoveryContourFileMesh> =
      createAutoMovieRecoveryContourFileMesh(
        empty,
        path.join(directory, "empty"),
        { maxVertices: 1, maxTriangles: 1 },
      );
    TestValidator.equals(
      "empty actual channel populations",
      [emptyFile.emission.vertices, emptyFile.emission.triangles],
      [0, 0],
    );
    for (const stage of ["vertex", "construction"] as const) {
      const sentinel: symbol = Symbol(stage);
      let observed: unknown;
      try {
        generateAutoMovieContourLoft64(input(false), {
          vertex: (): void => {
            if (stage === "vertex") throw sentinel;
          },
          triangle: (): void => {},
          construction: (): void => {
            if (stage === "construction") throw sentinel;
          },
        });
      } catch (error: unknown) {
        observed = error;
      }
      TestValidator.predicate(
        "original sink throw is never a numerical partial",
        observed === sentinel,
      );
    }
    const encoded: symbol = Symbol("reflection"),
      destination: string = path.join(directory, "reflection-failed.json");
    let observed: unknown;
    let invoked: boolean = false;
    const accessor: { readonly value: number } = {
      get value(): number {
        invoked = true;
        throw encoded;
      },
    };
    TestValidator.predicate(
      "accessor refuses",
      refuses((): void => {
        writeAutoMovieRecoveryArtifact(
          path.join(directory, "accessor-failed.json"),
          accessor,
        );
      }),
    );
    TestValidator.predicate("accessor is never invoked", !invoked);
    const record: { value: number } = new Proxy(
      { value: 1 },
      {
        getOwnPropertyDescriptor: (): PropertyDescriptor | undefined => {
          throw encoded;
        },
      },
    );
    try {
      writeAutoMovieRecoveryArtifact(destination, record);
    } catch (error: unknown) {
      observed = error;
    }
    TestValidator.predicate(
      "original reflection failure identity",
      observed === encoded,
    );
    TestValidator.predicate(
      "failed publication has no destination",
      !fs.existsSync(destination),
    );
  } catch (error: unknown) {
    failed = true;
    primary = error;
  }
  const resolved: string = path.resolve(directory),
    prefix: string =
      path.resolve(os.tmpdir()) + path.sep + "automovie-contour-file-";
  try {
    if (!resolved.startsWith(prefix))
      throw new Error("Owned temporary directory containment failed");
    fs.rmSync(resolved, { recursive: true, force: false });
  } catch (error: unknown) {
    if (!failed) {
      failed = true;
      primary = error;
    }
  }
  if (failed) throw primary;
}
