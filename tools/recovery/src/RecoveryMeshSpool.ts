import fs from "node:fs";
import path from "node:path";

import type { tessellateAutoMovieLocalHermite64 as T } from "../../../packages/engine/src/geometry/curve/tessellateAutoMovieLocalHermite64.ts";
import type { IAutoMovieMesh } from "../../../packages/interface/src/model/IAutoMovieMesh.ts";
import { writeRecoveryArtifact } from "./writeRecoveryArtifact.ts";

/**
 * Own append-only engine mesh buffers as immutable bounded JSON array fragments.
 * A published prefix is one indexed mesh: shared station vertices keep their actual
 * global index across chunks and runs. Source-free chunk ownership maps generated
 * triangles back to run, interval and patch records without carrying source faces.
 *
 * @evidence contracts/common.md#principled-implementation Sequential vertex suffixes and already-declared global indices preserve the engine's shared boundary contract; byte-bound array fragments assemble the interface mesh without regenerating geometry.
 * @evidence contracts/common.md#clear-and-simple-design One closure owns generated mesh placeholders, bounded pending arrays, fragment bindings and prefix publication.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No source mesh, coordinate weld, numeric rounding, chunk-local duplicated boundary or replacement of existing output is permitted.
 * @evidence contracts/common.md#meaningful-documentation States units, append-only indices, generated ownership and immutable prefix semantics.
 * @evidence contracts/performance.md#efficient-algorithms Appending and final serialization are linear in generated values; each published prefix rereads its immutable fragments to verify bytes and produce a standalone viewer artifact.
 * @evidence contracts/performance.md#reuse-equivalent-work The same generated fragments serve successive explicit prefixes and final output; shared vertices are written once rather than copied into separate mesh parts.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Pending arrays flush at 8192 values plus the current bounded engine chunk; retained fragment descriptors grow with output chunks, not output numeric buffers. Publication owns temporary descriptors through the writer; immutable spool files remain lineage artifacts.
 */
export function RecoveryMeshSpool(
  directory: string,
  initialConstruction: readonly object[] = [],
): {
  mesh: IAutoMovieMesh;
  construction: object[];
  ownership: object[];
  counts: { vertices: number; triangles: number; chunks: number };
  append: (
    chunk: T.Chunk,
    owner: {
      run: string;
      firstSection: number;
      curves: readonly string[];
      pairs: readonly number[];
    },
  ) => void;
  publish: (
    output: string,
    artifact: object,
  ) => ReturnType<typeof writeRecoveryArtifact>;
} {
  if (fs.existsSync(directory))
    throw new Error("A generating mesh spool must be new");
  fs.mkdirSync(directory, { recursive: true });
  type Binding = { path: string; sha256: string; items: number };
  type Channel = {
    target: unknown[];
    pending: unknown[];
    files: Binding[];
    name: string;
  };
  const positions: number[] = [],
    normals: number[] = [],
    indices: number[] = [];
  const sources: { domain: string; id: number }[] = [],
    vertices: number[] = [];
  const construction: object[] = [],
    ownership: object[] = [];
  const channels: Channel[] = [
    positions,
    normals,
    indices,
    sources,
    vertices,
    construction,
    ownership,
  ].map(
    (target: unknown[], i: number): Channel => ({
      target,
      pending: [],
      files: [],
      name: [
        "positions",
        "normals",
        "indices",
        "sources",
        "vertices",
        "construction",
        "ownership",
      ][i]!,
    }),
  );
  const mesh: IAutoMovieMesh = {
    positions,
    normals,
    indices,
    uvs: null,
    skin: null,
    physicalVertices: { sources, vertices },
  };
  const counts: { vertices: number; triangles: number; chunks: number } = {
    vertices: 0,
    triangles: 0,
    chunks: 0,
  };
  const flush: (channel: Channel) => void = (channel: Channel): void => {
    if (!channel.pending.length) return;
    const file: string = path.join(
      directory,
      `${channel.name}.${channel.files.length}.json`,
    );
    const published: ReturnType<typeof writeRecoveryArtifact> =
      writeRecoveryArtifact(file, channel.pending);
    channel.files.push({
      path: file,
      sha256: published.sha256,
      items: channel.pending.length,
    });
    channel.pending = [];
  };
  const appendValues: (channel: Channel, values: readonly unknown[]) => void = (
    channel: Channel,
    values: readonly unknown[],
  ): void => {
    for (const value of values) {
      channel.pending.push(value);
      if (channel.pending.length >= 8192) flush(channel);
    }
    if (channel.target === construction || channel.target === ownership)
      flush(channel);
  };
  appendValues(channels[5]!, initialConstruction);
  return {
    mesh,
    construction,
    ownership,
    counts,
    append: (
      chunk: T.Chunk,
      owner: {
        run: string;
        firstSection: number;
        curves: readonly string[];
        pairs: readonly number[];
      },
    ): void => {
      const count: number = chunk.positions.length / 3;
      if (
        chunk.vertexStart !== counts.vertices ||
        !Number.isSafeInteger(count) ||
        chunk.normals.length !== chunk.positions.length ||
        chunk.physicalVertexIds.length !== count ||
        chunk.indices.length % 3 ||
        chunk.positions.some((x: number): boolean => !Number.isFinite(x)) ||
        chunk.normals.some((x: number): boolean => !Number.isFinite(x)) ||
        chunk.indices.some(
          (x: number): boolean =>
            !Number.isSafeInteger(x) || x < 0 || x >= counts.vertices + count,
        )
      )
        throw new Error(
          "Engine stream violated append-only indexed mesh admission",
        );
      appendValues(channels[0]!, chunk.positions);
      appendValues(channels[1]!, chunk.normals);
      appendValues(channels[2]!, chunk.indices);
      for (let i: number = 0; i < count; i++) {
        const id: number = counts.vertices + i;
        appendValues(channels[3]!, [{ domain: "recovery.generated.open", id }]);
        appendValues(channels[4]!, [id]);
      }
      appendValues(channels[5]!, chunk.construction);
      appendValues(channels[6]!, [
        {
          meshPart: "recovery.local-open",
          run: owner.run,
          beforeSection: owner.firstSection + chunk.interval,
          afterSection: owner.firstSection + chunk.interval + 1,
          graphAddress: `/intervals/${owner.firstSection + chunk.interval}/pairs/${owner.pairs[chunk.interval]}`,
          curves: [
            owner.curves[chunk.interval],
            owner.curves[chunk.interval + 1],
          ],
          vertexStart: chunk.vertexStart,
          vertexCount: count,
          triangleStart: counts.triangles,
          triangleCount: chunk.indices.length / 3,
          physicalVertexIds: chunk.physicalVertexIds,
          patches: chunk.faceRanges.map(
            (range: T.Chunk["faceRanges"][number]): object => ({
              ...range,
              triangleStart: counts.triangles + range.triangleStart,
            }),
          ),
          diagnostics: chunk.diagnostics,
          counts: chunk.counts,
        },
      ]);
      counts.vertices += count;
      counts.triangles += chunk.indices.length / 3;
      counts.chunks++;
    },
    publish: (
      output: string,
      artifact: object,
    ): ReturnType<typeof writeRecoveryArtifact> => {
      for (const channel of channels) flush(channel);
      return writeRecoveryArtifact(
        output,
        artifact,
        new Map(
          channels.map((channel: Channel): [unknown[], Binding[]] => [
            channel.target,
            channel.files,
          ]),
        ),
      );
    },
  };
}
