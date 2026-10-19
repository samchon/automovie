import fs from "node:fs";
import path from "node:path";

import type { tessellateAutoMovieLocalHermite64 as T } from "@automovie/engine/geometry/curve";
import type { IAutoMovieMesh } from "@automovie/interface";
import { writeAutoMovieRecoveryArtifact } from "./writeAutoMovieRecoveryArtifact";

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
 * @evidence contracts/performance.md#efficient-algorithms Appending and final serialization are linear in generated values. Each frontier serializes only new fragment bindings plus its caller-supplied context; repeated context has its own cumulative cost. Each standalone prefix rereads its immutable fragments to verify bytes and assemble the artifact.
 * @evidence contracts/performance.md#reuse-equivalent-work The same generated fragments serve successive explicit prefixes and final output; shared vertices are written once rather than copied into separate mesh parts.
 * @evidence contracts/performance.md#bound-retention-and-release-resources All seven pending channels flush at 8192 items or a one-MiB encoded-size upper estimate, plus one indivisible admitted record. Fragment and frontier descriptors grow with persisted output. Publication owns temporary descriptors through the writer; immutable spool and journal files remain lineage artifacts.
 */
export function createAutoMovieRecoveryMeshSpool(
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
  /** Flush every channel and publish new fragment bindings, the exact predecessor and plain caller-owned provenance. This persists a finite prefix, not a resumed iterator. */
  commit: (
    output: string,
    context: object,
  ) => { path: string; sha256: string; bytes: number };
  publish: (
    output: string,
    artifact: object,
  ) => ReturnType<typeof writeAutoMovieRecoveryArtifact>;
} {
  if (fs.existsSync(directory))
    throw new Error("A generating mesh spool must be new");
  fs.mkdirSync(directory, { recursive: true });
  type Binding = { path: string; sha256: string; bytes: number; items: number };
  type Channel = {
    target: unknown[];
    pending: unknown[];
    pendingBytes: number;
    items: number;
    committedFiles: number;
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
      pendingBytes: 2,
      items: 0,
      committedFiles: 0,
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
  let previous: { path: string; sha256: string; bytes: number } | null = null;
  let sequence: number = 0;
  const flush: (channel: Channel) => void = (channel: Channel): void => {
    if (!channel.pending.length) return;
    const file: string = path.join(
      directory,
      `${channel.name}.${channel.files.length}.json`,
    );
    const published: ReturnType<typeof writeAutoMovieRecoveryArtifact> =
      writeAutoMovieRecoveryArtifact(file, channel.pending);
    channel.files.push({
      path: path.resolve(file),
      ...published,
      items: channel.pending.length,
    });
    channel.pending = [];
    channel.pendingBytes = 2;
  };
  const appendValues: (channel: Channel, values: readonly unknown[]) => void = (
    channel: Channel,
    values: readonly unknown[],
  ): void => {
    for (const value of values) {
      // A finite binary64 JSON number occupies at most 25 ASCII bytes. Structured
      // records need their actual UTF-8 size; their indivisible size is caller-owned.
      const bytes: number =
        typeof value === "number"
          ? 25
          : Buffer.byteLength(JSON.stringify(value) ?? "null", "utf8");
      if (
        channel.pending.length &&
        channel.pendingBytes + bytes + 1 > 1_048_576
      )
        flush(channel);
      channel.pending.push(value);
      channel.pendingBytes += bytes + 1;
      channel.items++;
      if (channel.pending.length >= 8192 || channel.pendingBytes >= 1_048_576)
        flush(channel);
    }
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
    commit: (
      output: string,
      context: object,
    ): { path: string; sha256: string; bytes: number } => {
      for (const channel of channels) flush(channel);
      if (
        channels[0]!.items !== counts.vertices * 3 ||
        channels[1]!.items !== counts.vertices * 3 ||
        channels[2]!.items !== counts.triangles * 3 ||
        channels[3]!.items !== counts.vertices ||
        channels[4]!.items !== counts.vertices ||
        channels[6]!.items !== counts.chunks
      )
        throw new Error(
          "A mesh frontier requires every channel at the same admitted chunk",
        );
      const record: object = {
        schema: "recovery-mesh-spool-frontier-v1",
        directory: path.resolve(directory),
        sequence,
        previous,
        counts: { ...counts },
        context,
        channels: channels.map((channel: Channel): object => ({
          name: channel.name,
          items: channel.items,
          files: channel.files.slice(channel.committedFiles),
        })),
        qualification:
          "All referenced channels end at one complete admitted engine chunk. Context retains source and run provenance; generator resumption requires separate verified replay.",
      };
      const saved: ReturnType<typeof writeAutoMovieRecoveryArtifact> =
        writeAutoMovieRecoveryArtifact(output, record);
      previous = { path: path.resolve(output), ...saved };
      sequence++;
      for (const channel of channels)
        channel.committedFiles = channel.files.length;
      return { ...previous };
    },
    publish: (
      output: string,
      artifact: object,
    ): ReturnType<typeof writeAutoMovieRecoveryArtifact> => {
      for (const channel of channels) flush(channel);
      return writeAutoMovieRecoveryArtifact(
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
