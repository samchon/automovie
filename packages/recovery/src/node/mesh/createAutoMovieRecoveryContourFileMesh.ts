import {
  type IAutoMovieCurve64 as C,
  type IAutoMovieContourLoftEmission64,
  type IAutoMovieContourLoft64 as L,
  generateAutoMovieContourLoft64,
} from "@automovie/engine/geometry/curve";
import fs from "node:fs";
import path from "node:path";

import type { IAutoMovieRecoveryArraySource } from "../../structures/node/IAutoMovieRecoveryArraySource";
import type { IAutoMovieRecoveryContourFileMesh } from "../../structures/node/IAutoMovieRecoveryContourFileMesh";
import { writeAutoMovieRecoveryArtifact } from "../artifact/writeAutoMovieRecoveryArtifact";
import { createRecoveryFileVectorTable } from "../internal/createRecoveryFileVectorTable";

/**
 * Consume the actual contour kernel without retaining complete output channels.
 * Original millimetre vertices and accumulated area vectors use fixed-width files.
 * Face cross products accumulate in original face and corner order, then each
 * vertex is normalized once by the original normal formula. Construction samples
 * and scalar channels publish bounded immutable fragments. Original preparation
 * rings, reports and identity maps still have their actual input/output bounds;
 * this is not a constant-memory claim for the whole kernel.
 *
 * @evidence contracts/common.md#principled-implementation The shared indexed kernel supplies every original vertex and face. Binary64 file round trips preserve values and reduction order before one metre conversion and normalization.
 * @evidence contracts/common.md#clear-and-simple-design One sink owns file-backed coordinates and normal accumulation, then returns exact fragment bindings for the ordinary artifact writer.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No source surface or normal, coordinate weld, omitted face, changed triangulation or placeholder validation substitutes for actual generation.
 * @evidence contracts/common.md#meaningful-documentation Separates bounded channel buffers from retained kernel metadata and canonical validation deferred status.
 * @evidence contracts/performance.md#efficient-algorithms Channel and normal passes cost O(V+T+K) scalar work and O(V+T+K) persisted bytes, in addition to unchanged kernel preparation and strip search. Table misses transfer at most one valid page plus a dirty victim; nonlocal access can still cause repeated page I/O.
 * @evidence contracts/performance.md#reuse-equivalent-work Each original face contributes one cross product to all three original corner accumulators; immutable fragments serve model and sidecar publication.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Scalar channel buffers retain at most 8192 numbers each. Every structured generating ring flushes immediately, so at most one indivisible ring's copied points/phases are pending; its size is bounded by the original retained ring, independently of emitted-mesh limits. Each table owns at most three 65520-byte pages, totaling 393120 bytes across both tables, plus bounded headers and per-face triples. Dirty victims flush before reuse and both tables finish before success. Fragment descriptors and kernel reports grow with actual admitted output. Every acquired descriptor closes independently without replacing a primary failure.
 */
export function createAutoMovieRecoveryContourFileMesh(
  input: L,
  directory: string,
  limits: { maxVertices: number; maxTriangles: number },
): IAutoMovieRecoveryContourFileMesh {
  if (
    !limits ||
    !Number.isSafeInteger(limits.maxVertices) ||
    limits.maxVertices < 1 ||
    !Number.isSafeInteger(limits.maxTriangles) ||
    limits.maxTriangles < 1 ||
    limits.maxVertices > Math.floor(Number.MAX_SAFE_INTEGER / 24) ||
    limits.maxTriangles > Math.floor(Number.MAX_SAFE_INTEGER / 3)
  )
    throw new Error(
      "Safe whole-contour output limits are required before storage acquisition",
    );
  if (fs.existsSync(directory))
    throw new Error("Contour storage must use a new directory");
  fs.mkdirSync(directory, { recursive: true });
  const positionPath: string = path.join(directory, "positions-mm.bin");
  const areaPath: string = path.join(directory, "accumulated-area.bin");
  const descriptors: number[] = [];
  const placeholders: unknown[][] = [[], [], [], []];
  const pending: unknown[][] = [[], [], [], []];
  const sources: IAutoMovieRecoveryArraySource[][] = [[], [], [], []];
  const counts: number[] = [0, 0, 0, 0];
  const flush: (channel: number) => void = (channel: number): void => {
    if (!pending[channel]!.length) return;
    const file: string = path.join(
      directory,
      `${["positions", "indices", "normals", "construction"][channel]}.${sources[channel]!.length}.json`,
    );
    const digest: ReturnType<typeof writeAutoMovieRecoveryArtifact> =
      writeAutoMovieRecoveryArtifact(file, pending[channel]!);
    sources[channel]!.push({
      path: file,
      ...digest,
      items: pending[channel]!.length,
    });
    pending[channel] = [];
  };
  const append: (channel: number, value: unknown) => void = (
    channel: number,
    value: unknown,
  ): void => {
    pending[channel]!.push(value);
    counts[channel]!++;
    if (channel === 3 || pending[channel]!.length === 8192) flush(channel);
  };
  let vertices: number = 0,
    triangles: number = 0;
  let emission: IAutoMovieContourLoftEmission64;
  let failed: boolean = false,
    primary: unknown;
  try {
    const positions: number = fs.openSync(positionPath, "wx+");
    descriptors.push(positions);
    const area: number = fs.openSync(areaPath, "wx+");
    descriptors.push(area);
    const table: (
      descriptor: number,
    ) => ReturnType<typeof createRecoveryFileVectorTable> = (
      descriptor: number,
    ): ReturnType<typeof createRecoveryFileVectorTable> =>
      createRecoveryFileVectorTable({
        maxRows: limits.maxVertices,
        read: (
          target: Buffer,
          offset: number,
          length: number,
          position: number,
        ): number => fs.readSync(descriptor, target, offset, length, position),
        write: (
          source: Buffer,
          offset: number,
          length: number,
          position: number,
        ): number => fs.writeSync(descriptor, source, offset, length, position),
      });
    const positionTable: ReturnType<typeof createRecoveryFileVectorTable> =
      table(positions);
    const areaTable: ReturnType<typeof createRecoveryFileVectorTable> =
      table(area);
    emission = generateAutoMovieContourLoft64(input, {
      vertex: (index: number, point: C.Vector): void => {
        if (index !== vertices || vertices >= limits.maxVertices)
          throw new Error(
            "Contour vertex population exceeded its admitted output ceiling",
          );
        positionTable.append(point);
        areaTable.append([0, 0, 0]);
        for (const value of point) {
          const metre: number = value * 0.001;
          if (!Number.isFinite(metre) || !Number.isFinite(Math.fround(metre)))
            throw new Error(
              "Contour output position is not representable for upload",
            );
          append(0, metre);
        }
        vertices++;
      },
      triangle: (a: number, b: number, c: number): void => {
        if (
          triangles >= limits.maxTriangles ||
          [a, b, c].some(
            (index: number): boolean =>
              !Number.isSafeInteger(index) || index < 0 || index >= vertices,
          )
        )
          throw new Error(
            "Contour face exceeds its admitted population or index range",
          );
        const x: [number, number, number] = positionTable.read(a);
        const y: [number, number, number] = positionTable.read(b);
        const z: [number, number, number] = positionTable.read(c);
        const u: [number, number, number] = [
          y[0] - x[0],
          y[1] - x[1],
          y[2] - x[2],
        ];
        const v: [number, number, number] = [
          z[0] - x[0],
          z[1] - x[1],
          z[2] - x[2],
        ];
        const cross: [number, number, number] = [
          u[1] * v[2] - u[2] * v[1],
          u[2] * v[0] - u[0] * v[2],
          u[0] * v[1] - u[1] * v[0],
        ];
        for (const index of [a, b, c]) {
          const previous: [number, number, number] = areaTable.read(index);
          areaTable.update(index, [
            previous[0] + cross[0],
            previous[1] + cross[1],
            previous[2] + cross[2],
          ]);
          append(1, index);
        }
        triangles++;
      },
      construction: (
        id: string,
        points: readonly C.Vector[],
        phase: (point: C.Vector) => number,
      ): void => {
        // One original ring is indivisible; no complete output collection is copied.
        append(3, {
          id,
          closed: true,
          points: points.map((point: C.Vector): number[] =>
            point.map((value: number): number => value * 0.001),
          ),
          phases: points.map(phase),
        });
      },
    });
    if (emission.vertices !== vertices || emission.triangles !== triangles)
      throw new Error(
        "Contour channel counts differ from actual kernel emission",
      );
    positionTable.finish();
    for (let index: number = 0; index < vertices; index++) {
      const normal: [number, number, number] = areaTable.read(index);
      const length: number = Math.hypot(...normal);
      for (const value of normal) {
        const normalized: number = length > 0 ? value * (1 / length) : 0;
        if (
          !Number.isFinite(normalized) ||
          !Number.isFinite(Math.fround(normalized))
        )
          throw new Error("Contour normal is not representable for upload");
        append(2, normalized);
      }
    }
    areaTable.finish();
    for (let channel: number = 0; channel < pending.length; channel++)
      flush(channel);
    if (
      counts[0] !== vertices * 3 ||
      counts[1] !== triangles * 3 ||
      counts[2] !== vertices * 3
    )
      throw new Error(
        "Complete contour channels require matching scalar populations",
      );
  } catch (error: unknown) {
    failed = true;
    primary = error;
  }
  for (const descriptor of descriptors)
    try {
      fs.closeSync(descriptor);
    } catch (error: unknown) {
      if (!failed) {
        failed = true;
        primary = error;
      }
    }
  if (failed) throw primary;
  return {
    mesh: {
      positions: placeholders[0] as number[],
      indices: placeholders[1] as number[],
      normals: placeholders[2] as number[],
      uvs: null,
      skin: null,
    },
    construction: placeholders[3] as object[],
    arraySources: new Map(
      placeholders.map(
        (
          target: unknown[],
          channel: number,
        ): [unknown[], IAutoMovieRecoveryArraySource[]] => [
          target,
          sources[channel]!,
        ],
      ),
    ),
    emission: emission!,
    tables: { positionsMm: positionPath, accumulatedArea: areaPath },
    qualification: {
      finite64: true,
      finite32: true,
      indexRange: true,
      canonicalValidation: "deferred",
      rasterAreaQualified: false,
    },
  };
}
