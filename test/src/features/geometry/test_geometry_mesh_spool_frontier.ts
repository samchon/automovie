import { TestValidator } from "@nestia/e2e";
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";

import type { tessellateAutoMovieLocalHermite64 as T } from "../../../../packages/engine/src/geometry/curve/tessellateAutoMovieLocalHermite64";
import { createAutoMovieRecoveryMeshSpool, readAutoMovieRecoveryMeshFrontier, writeAutoMovieRecoveryArtifact } from "@automovie/recovery/node";



/**
 * Batched source-free channels retain one complete indexed publication frontier.
 *
 * Scenarios:
 * 1. Ordered mathematical chunks retain shared global indices and actual metadata.
 * 2. Two frontier records bind only their new fragments and the exact predecessor.
 * 3. Rejected indexing and an occupied frontier preserve the last published state.
 * 4. A single large UTF-8 record remains complete instead of being dropped or truncated.
 * 5. The bounded recovery reader admits the whole committed chain and rejects a wrong source or changed fragment.
 *
 * @evidence contracts/testing.md#behavioral-verification Appends independently authored chunk values, publishes a standalone artifact, and independently reads and hashes every frontier-bound array fragment. This catches unflushed channels, duplicate or missing values, per-chunk metadata files and false predecessor publication.
 * @evidence contracts/testing.md#independent-expectations Explicit integer coordinates, indices and construction text supply the byte oracle through standard JSON encoding. Global index zero remains shared by later triangles. Every accepted chunk requires one ownership row, while fewer than 8192 small rows fit one declared batch between frontiers.
 * @evidence contracts/testing.md#distinguishing-cases Covers empty base state, multiple commits, cross-chunk indices, immutable output refusal, invalid vertex offset, Unicode byte sizing and one indivisible record above the staging target. Generator replay, source fitting and mesh quality are separate contracts.
 * @evidence contracts/testing.md#execution-ownership Portable CPU storage semantics use one owned workspace directory and no source asset, anatomical fixture, process, viewer, GPU or compile. The directory is removed in finally.
 */
export function test_geometry_mesh_spool_frontier(): void {
  type Receipt = { path: string; sha256: string; bytes: number };
  type Fragment = Receipt & { items: number };
  type Frontier = {
    sequence: number;
    previous: Receipt | null;
    counts: { vertices: number; triangles: number; chunks: number };
    channels: { name: string; items: number; files: Fragment[] }[];
  };
  const workspace: string = fs.realpathSync(process.cwd());
  const root: string = fs.mkdtempSync(path.join(workspace, ".mesh-spool-"));
  if (path.dirname(root) !== workspace)
    throw new Error("Spool scratch must belong to this workspace");
  const hash: (bytes: Buffer) => string = (bytes: Buffer): string =>
    createHash("sha256").update(bytes).digest("hex");
  const read: (receipt: Receipt) => Frontier = (receipt: Receipt): Frontier => {
    const bytes: Buffer = fs.readFileSync(receipt.path);
    TestValidator.equals(
      "frontier complete length",
      bytes.length,
      receipt.bytes,
    );
    TestValidator.equals("frontier complete hash", hash(bytes), receipt.sha256);
    return JSON.parse(bytes.toString("utf8")) as Frontier;
  };
  const chunk: (i: number) => T.Chunk = (i: number): T.Chunk => ({
    interval: i,
    vertexStart: i * 3,
    positions: [0, i, 0, 1, i, 0, 0, i, 1],
    normals: [0, 1, 0, 0, 1, 0, 0, 1, 0],
    physicalVertexIds: [`v${i * 3}`, `v${i * 3 + 1}`, `v${i * 3 + 2}`],
    indices: [0, i * 3 + 1, i * 3 + 2],
    construction: [
      {
        id: `curve${i}`,
        closed: false,
        points: [
          [0, i, 0],
          [1, i, 0],
        ],
      },
    ],
    diagnostics: [],
    counts: {
      cells: 1,
      vertices: 3,
      triangles: 1,
      omittedZeroAreaTriangles: 0,
      unresolvedVertexNormals: 0,
      maxErrorBoundMm: 0,
    },
    faceRanges: [
      {
        patch: "affine",
        u0: 0,
        u1: 1,
        t0: 0,
        t1: 1,
        triangleStart: 0,
        triangleCount: 1,
        omittedZeroAreaTriangles: 0,
      },
    ],
  });
  try {
    const spool: ReturnType<typeof createAutoMovieRecoveryMeshSpool> = createAutoMovieRecoveryMeshSpool(
      path.join(root, "spool"),
    );
    const binding: object = {
      sourceEpoch: "generic-frontier",
      inputSha256: "0".repeat(64),
    };
    const zero: Receipt = spool.commit(path.join(root, "zero.json"), {
      binding,
      currentRun: null,
    });
    TestValidator.equals("empty admitted base", read(zero).counts, {
      vertices: 0,
      triangles: 0,
      chunks: 0,
    });
    const expectedPositions: number[] = [],
      expectedIndices: number[] = [];
    const curves: string[] = Array.from(
        { length: 34 },
        (_: unknown, j: number): string => `curve${j}`,
      ),
      pairs: number[] = Array.from({ length: 33 }, (): number => 0);
    for (let i: number = 0; i < 32; i++) {
      const value: T.Chunk = chunk(i);
      spool.append(value, { run: "ordinary", firstSection: 0, curves, pairs });
      expectedPositions.push(...value.positions);
      expectedIndices.push(...value.indices);
    }
    const first: Receipt = spool.commit(path.join(root, "first.json"), {
      binding,
      currentRun: { emittedChunks: 32 },
    });
    const row: Frontier = read(first);
    const limits: Omit<
      Parameters<typeof readAutoMovieRecoveryMeshFrontier>[0],
      "frontier"
    > = {
      directory: path.join(root, "spool"),
      expectedBinding: binding,
      maxJournals: 4,
      maxFragments: 32,
      maxJournalBytes: 1_048_576,
      maxFragmentBytes: 2_097_152,
    };
    TestValidator.equals("one complete predecessor", row.previous, zero);
    TestValidator.equals("all channels share one chunk boundary", row.counts, {
      vertices: 96,
      triangles: 32,
      chunks: 32,
    });
    TestValidator.equals(
      "ownership records batch between frontiers",
      row.channels.find(
        (channel: Frontier["channels"][number]): boolean =>
          channel.name === "ownership",
      )!.files.length,
      1,
    );
    for (const channel of row.channels) {
      let items: number = 0;
      for (const file of channel.files) {
        const bytes: Buffer = fs.readFileSync(file.path);
        TestValidator.equals("fragment exact length", bytes.length, file.bytes);
        TestValidator.equals("fragment exact hash", hash(bytes), file.sha256);
        items += (JSON.parse(bytes.toString("utf8")) as unknown[]).length;
      }
      TestValidator.equals("all new items bound", items, channel.items);
    }
    TestValidator.error(
      "bad global suffix refuses before publication",
      (): void => {
        spool.append(chunk(0), {
          run: "bad",
          firstSection: 0,
          curves: [],
          pairs: [],
        });
      },
    );
    TestValidator.error(
      "future global index refuses before publication",
      (): void => {
        spool.append(
          { ...chunk(32), indices: [0, 97, 999] },
          { run: "bad-index", firstSection: 0, curves, pairs },
        );
      },
    );
    const next: T.Chunk = chunk(32);
    spool.append(next, { run: "ordinary", firstSection: 0, curves, pairs });
    TestValidator.error(
      "occupied immutable frontier refuses after all-channel flush",
      (): void => {
        spool.commit(first.path, { binding });
      },
    );
    TestValidator.equals(
      "uncommitted flushed files do not change the served prefix",
      readAutoMovieRecoveryMeshFrontier({ ...limits, frontier: first }).counts,
      { vertices: 96, triangles: 32, chunks: 32 },
    );
    expectedPositions.push(...next.positions);
    expectedIndices.push(...next.indices);
    const second: Receipt = spool.commit(path.join(root, "second.json"), {
      binding,
      currentRun: null,
    });
    const later: Frontier = read(second);
    TestValidator.equals(
      "failed commit does not advance lineage",
      later.previous,
      first,
    );
    const oldPaths: Set<string> = new Set(
      row.channels.flatMap((channel: Frontier["channels"][number]): string[] =>
        channel.files.map((file: Fragment): string => file.path),
      ),
    );
    TestValidator.predicate(
      "journal lists new fragments only",
      later.channels.every((channel: Frontier["channels"][number]): boolean =>
        channel.files.every(
          (file: Fragment): boolean => !oldPaths.has(file.path),
        ),
      ),
    );
    const reader: Parameters<typeof readAutoMovieRecoveryMeshFrontier>[0] = {
      ...limits,
      frontier: second,
    };
    const recovered: ReturnType<typeof readAutoMovieRecoveryMeshFrontier> =
      readAutoMovieRecoveryMeshFrontier(reader);
    TestValidator.equals(
      "verified recovery reaches the whole frontier",
      recovered.counts,
      { vertices: 99, triangles: 33, chunks: 33 },
    );
    const recoveredPositions: unknown[] = [],
      recoveredIndices: unknown[] = [];
    const recoveredPath: string = path.join(root, "recovered.json");
    writeAutoMovieRecoveryArtifact(
      recoveredPath,
      { positions: recoveredPositions, indices: recoveredIndices },
      new Map([
        [
          recoveredPositions,
          recovered.channels.find(
            (channel: (typeof recovered.channels)[number]): boolean =>
              channel.name === "positions",
          )!.files,
        ],
        [
          recoveredIndices,
          recovered.channels.find(
            (channel: (typeof recovered.channels)[number]): boolean =>
              channel.name === "indices",
          )!.files,
        ],
      ]),
    );
    TestValidator.equals(
      "verified frontier publishes actual stored geometry",
      fs.readFileSync(recoveredPath, "utf8"),
      JSON.stringify({
        positions: expectedPositions,
        indices: expectedIndices,
      }),
    );
    TestValidator.error(
      "another source cannot inherit a frontier",
      (): void => {
        readAutoMovieRecoveryMeshFrontier({
          ...reader,
          expectedBinding: { sourceEpoch: "different" },
        });
      },
    );
    TestValidator.error(
      "journal read budget refuses without partial promotion",
      (): void => {
        readAutoMovieRecoveryMeshFrontier({ ...reader, maxJournals: 1 });
      },
    );
    const output: string = path.join(root, "model.json");
    spool.publish(output, {
      mesh: spool.mesh,
      construction: spool.construction,
      ownership: spool.ownership,
    });
    const artifact: {
      mesh: { positions: number[]; indices: number[] };
      construction: unknown[];
      ownership: { triangleStart: number; vertexStart: number }[];
    } = JSON.parse(fs.readFileSync(output, "utf8")) as {
      mesh: { positions: number[]; indices: number[] };
      construction: unknown[];
      ownership: { triangleStart: number; vertexStart: number }[];
    };
    TestValidator.equals(
      "complete position encoding",
      JSON.stringify(artifact.mesh.positions),
      JSON.stringify(expectedPositions),
    );
    TestValidator.equals(
      "shared global index encoding",
      JSON.stringify(artifact.mesh.indices),
      JSON.stringify(expectedIndices),
    );
    TestValidator.equals(
      "all construction survives",
      artifact.construction.length,
      33,
    );
    TestValidator.equals(
      "all ownership survives",
      artifact.ownership.length,
      33,
    );
    TestValidator.predicate(
      "global ownership ranges remain ordered",
      artifact.ownership.every(
        (
          owner: { triangleStart: number; vertexStart: number },
          i: number,
        ): boolean => owner.triangleStart === i && owner.vertexStart === i * 3,
      ),
    );
    const changed: Fragment = row.channels[0]!.files[0]!;
    const original: Buffer = fs.readFileSync(changed.path);
    fs.writeFileSync(changed.path, "[]");
    TestValidator.error("changed committed data refuses recovery", (): void => {
      readAutoMovieRecoveryMeshFrontier(reader);
    });
    fs.writeFileSync(changed.path, original);
    const text: string = "曲線".repeat(200_000);
    const large: ReturnType<typeof createAutoMovieRecoveryMeshSpool> = createAutoMovieRecoveryMeshSpool(
      path.join(root, "large-spool"),
      [{ text }],
    );
    const largePath: string = path.join(root, "large.json");
    large.publish(largePath, { construction: large.construction });
    TestValidator.equals(
      "indivisible UTF-8 record retained exactly",
      fs.readFileSync(largePath, "utf8"),
      JSON.stringify({ construction: [{ text }] }),
    );
  } finally {
    fs.rmSync(root, { recursive: true });
  }
}
