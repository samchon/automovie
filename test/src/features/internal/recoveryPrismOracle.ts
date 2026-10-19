import type { IAutoMovieMesh } from "@automovie/interface";
import type { reconstructAutoMovieRecoveryModel } from "@automovie/recovery";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "./nclose";

/** Authored straight-cubic prism fixtures and independent area, winding and exposed-edge measurements for the public source-free scenario. No result snapshot defines the expected surface. */
export namespace recoveryPrismOracle {
  /** Saved source-free input accepted by the public reconstruction operation. */
  export type Input = Parameters<typeof reconstructAutoMovieRecoveryModel>[0];
  type Curve = Input["loft"]["sections"][number]["loops"][number]["curve"];
  /**
   * Author one closed 3-mm square at millimetre station y and lateral offset x.
   * Four linear cubic spans retain the supplied name; the enclosing fixture
   * declares positive material winding.
   * The returned controls and phase widths are owned by the scenario.
   */
  export const ring: (y: number, x: number, name: string) => Curve = (
    y: number,
    x: number,
    name: string,
  ): Curve => {
    const corners: [number, number, number][] = [
      [x, y, 0],
      [x, y, 3],
      [x + 3, y, 3],
      [x + 3, y, 0],
    ];
    return {
      type: "cubicBezier",
      name,
      closed: true,
      unit: "mm",
      phaseUnit: "mm",
      phaseIntervals: [3, 3, 3, 3],
      spans: corners.map(
        (p: [number, number, number], i: number): Curve["spans"][number] => {
          const q: [number, number, number] = corners[(i + 1) % 4]!;
          return [
            p,
            [p[0] + (q[0] - p[0]) / 3, y, p[2] + (q[2] - p[2]) / 3],
            [p[0] + (2 * (q[0] - p[0])) / 3, y, p[2] + (2 * (q[2] - p[2])) / 3],
            q,
          ];
        },
      ),
    };
  };
  /**
   * Author two 3-mm square rings 2 mm apart with explicit ordinary continuation.
   * The optional second domain is displaced by 10 mm and explicitly unsupported;
   * it must remain in coverage without contributing geometry to the valid prism.
   * Each call owns fresh records and controls, independently of generated output.
   */
  export const makeInput: (unsupported: boolean) => Input = (
    unsupported: boolean,
  ): Input => {
    const sections: Input["loft"]["sections"] = [0, 2].map(
      (y: number): Input["loft"]["sections"][number] => {
        const loops: Input["loft"]["sections"][number]["loops"][number][] = [
          { curve: ring(y, 0, `square.${y}`), winding: 1 },
        ];
        if (unsupported)
          loops.push({ curve: ring(y, 10, `omitted.${y}`), winding: 1 });
        return { coordinateMm: y, loops };
      },
    );
    return {
      schema: "automovie-recovery-curves-v1",
      loft: {
        sections,
        events: [],
        chordToleranceMm: 0.01,
        intervals: [
          {
            beforeMm: 0,
            afterMm: 2,
            groups: [
              { before: [0], after: [0], supported: true, reason: null },
              ...(unsupported
                ? [
                    {
                      before: [1],
                      after: [1],
                      supported: false,
                      reason: "General domain intentionally unsupported",
                    },
                  ]
                : []),
            ],
          },
        ],
      },
      reports: sections.map(
        (
          section: Input["loft"]["sections"][number],
        ): Input["reports"][number] => ({
          coordinateMm: section.coordinateMm,
          fits: section.loops.map(
            (): Input["reports"][number]["fits"][number] => ({
              sampleMaximumMm: 0,
              polylineUpperEstimateMm: 0,
              toleranceMet: true,
              observationsPerSpan: 2,
              handleFallbacks: 0,
            }),
          ),
          open: [],
          isolatedContactsMm: [],
          diagnostics: [],
        }),
      ),
      diagnostics: [],
      topologyGaps: [],
      unconsumedEvents: [],
      policy: {
        axis: [0, 1, 0],
        reference: [1, 0, 0],
        stepMm: 2,
        toleranceMm: 0.01,
        chordToleranceMm: 0.01,
        maxSections: 8,
        maxSpans: 8,
        exactCoordinateAliases: false,
        sourceOrientationSign: 1,
        cornerDegrees: 45,
      },
      summary: {
        observations: unsupported ? 32 : 16,
        spans: unsupported ? 16 : 8,
        sections: 2,
        events: 0,
        aliases: 0,
      },
    };
  };
  /**
   * Check generated prism walls against independent physical area and boundaries.
   * Require 24e-6 square metres, outward winding, opposed interior edge incidence
   * and two open 0.012-metre perimeters while allowing adaptive subdivisions.
   * Exact output-position keys measure this authored prism's physical incidence;
   * they change no mesh and make no claim about arbitrary coincident surfaces.
   * Throws on a missing value or violated invariant and borrows output unchanged.
   */
  export const measure: (
    result: ReturnType<typeof reconstructAutoMovieRecoveryModel>,
  ) => void = (
    result: ReturnType<typeof reconstructAutoMovieRecoveryModel>,
  ): void => {
    if (!("value" in result))
      throw new Error("Expected retained source-free geometry");
    let area: number = 0;
    const boundaryLengths: number[] = [0, 0];
    const edges: Map<
      string,
      { count: number; balance: number; a: number[]; b: number[] }
    > = new Map();
    for (const part of result.value.model.parts) {
      if (part.geometry.type !== "mesh")
        throw new Error("Expected generated mesh geometry");
      const mesh: IAutoMovieMesh = part.geometry.mesh;
      if (mesh.indices === null) throw new Error("Expected indexed geometry");
      TestValidator.predicate(
        "metre positions are finite",
        mesh.positions.every((v: number): boolean => Number.isFinite(v)),
      );
      TestValidator.predicate(
        "complete vertex and triangle tuples",
        mesh.positions.length % 3 === 0 &&
          mesh.indices.length > 0 &&
          mesh.indices.length % 3 === 0,
      );
      const point: (index: number) => number[] = (index: number): number[] => {
        TestValidator.predicate(
          "index addresses a complete vertex",
          Number.isSafeInteger(index) &&
            index >= 0 &&
            index * 3 + 2 < mesh.positions.length,
        );
        const p: number[] = mesh.positions.slice(index * 3, index * 3 + 3);
        TestValidator.predicate(
          "positions stay on the analytic prism walls in metres",
          p[0]! >= -1e-12 &&
            p[0]! <= 0.003 + 1e-12 &&
            p[1]! >= -1e-12 &&
            p[1]! <= 0.002 + 1e-12 &&
            p[2]! >= -1e-12 &&
            p[2]! <= 0.003 + 1e-12 &&
            (nclose(p[0]!, 0, 1e-12) ||
              nclose(p[0]!, 0.003, 1e-12) ||
              nclose(p[2]!, 0, 1e-12) ||
              nclose(p[2]!, 0.003, 1e-12)),
        );
        return p;
      };
      for (let i: number = 0; i < mesh.indices.length; i += 3) {
        const vertices: number[][] = [
          point(mesh.indices[i]!),
          point(mesh.indices[i + 1]!),
          point(mesh.indices[i + 2]!),
        ];
        const a: number[] = vertices[0]!,
          b: number[] = vertices[1]!,
          c: number[] = vertices[2]!;
        const u: number[] = b.map((v: number, j: number): number => v - a[j]!);
        const v: number[] = c.map(
          (value: number, j: number): number => value - a[j]!,
        );
        const cross: number[] = [
          u[1]! * v[2]! - u[2]! * v[1]!,
          u[2]! * v[0]! - u[0]! * v[2]!,
          u[0]! * v[1]! - u[1]! * v[0]!,
        ];
        const triangleArea: number = Math.hypot(...cross) / 2;
        TestValidator.predicate(
          "every triangle has finite positive area",
          Number.isFinite(triangleArea) && triangleArea > 0,
        );
        TestValidator.predicate(
          "positive outer winding points away from the prism interior",
          cross[0]! * ((a[0]! + b[0]! + c[0]!) / 3 - 0.0015) +
            cross[2]! * ((a[2]! + b[2]! + c[2]!) / 3 - 0.0015) >
            0,
        );
        area += triangleArea;
        for (let j: number = 0; j < 3; j++) {
          const p: number[] = vertices[j]!,
            q: number[] = vertices[(j + 1) % 3]!;
          const pKey: string = p.join(","),
            qKey: string = q.join(",");
          const forward: boolean = pKey < qKey;
          const key: string = forward ? `${pKey}|${qKey}` : `${qKey}|${pKey}`;
          const edge: {
            count: number;
            balance: number;
            a: number[];
            b: number[];
          } = edges.get(key) ?? { count: 0, balance: 0, a: p, b: q };
          edge.count++;
          edge.balance += forward ? 1 : -1;
          edges.set(key, edge);
        }
      }
    }
    TestValidator.predicate(
      "four walls have the analytic metre area",
      nclose(area, 24e-6, 1e-12),
    );
    for (const edge of edges.values()) {
      TestValidator.predicate(
        "annulus edge incidence",
        edge.count === 1 || (edge.count === 2 && edge.balance === 0),
      );
      if (edge.count !== 1) continue;
      const lower: boolean =
        nclose(edge.a[1]!, 0, 1e-12) && nclose(edge.b[1]!, 0, 1e-12);
      const upper: boolean =
        nclose(edge.a[1]!, 0.002, 1e-12) && nclose(edge.b[1]!, 0.002, 1e-12);
      TestValidator.predicate(
        "exposed edges lie on a declared open end",
        lower || upper,
      );
      const end: number = lower ? 0 : 1;
      boundaryLengths[end] =
        boundaryLengths[end]! +
        Math.hypot(
          ...edge.a.map((v: number, j: number): number => v - edge.b[j]!),
        );
    }
    TestValidator.predicate(
      "each open square perimeter remains",
      boundaryLengths.every((length: number): boolean =>
        nclose(length, 0.012, 1e-12),
      ),
    );
    TestValidator.predicate(
      "retained primitive ownership names only the valid group",
      result.value.primitiveRanges.length > 0 &&
        result.value.primitiveRanges.every(
          (range: (typeof result.value.primitiveRanges)[number]): boolean =>
            range.group === 0,
        ),
    );
  };
}
