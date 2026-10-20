import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";

import type { IAutoMovieRecoveryMeshFrontier } from "../../structures/node/IAutoMovieRecoveryMeshFrontier";
import type { IAutoMovieRecoveryMeshFrontierInput } from "../../structures/node/IAutoMovieRecoveryMeshFrontierInput";

/**
 * Verify a closed source-free spool frontier and recover its complete array bindings.
 * The caller supplies the expected source/input binding and bounded read budgets.
 * This reads committed fragments only; uncommitted files are neither inferred nor removed.
 *
 * @evidence contracts/common.md#principled-implementation Exact SHA-256 predecessor links reconstruct the append-only journal, then independent byte hashes, JSON populations, append-only indices and ownership ranges verify the common seven-channel boundary.
 * @evidence contracts/common.md#clear-and-simple-design This reader owns persisted-byte admission. The spool owns writes, the caller owns the immutable base model, and generator resumption separately proves deterministic replay.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No directory-order guess, coordinate weld, missing-array reconstruction, source mesh, normal substitution or incomplete-file salvage supplies output. A mismatched source binding refuses the frontier.
 * @evidence contracts/common.md#meaningful-documentation Returns verified array-source descriptors and the exact last context. This does not certify source fidelity, geometry quality or a resumed engine iterator.
 * @evidence contracts/performance.md#efficient-algorithms Journal admission costs O(J+F), followed by one required byte/hash/JSON pass over the F referenced fragments. Index and ownership checks visit stored values once; uncommitted directory contents are not scanned.
 * @evidence contracts/performance.md#reuse-equivalent-work Verified original fragment paths feed the existing artifact writer without regenerating vertices, copying a whole mesh or fitting curves. Later publication still verifies its own required reads.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Declared journal, fragment count and byte budgets bound metadata and one parsed fragment. Peak metadata includes O(J+F+C) retained journal/context bytes C; only the last context and O(F) binding records survive. Synchronous reads close their descriptors and no complete numeric channel is retained.
 */
export function readAutoMovieRecoveryMeshFrontier(
  input: IAutoMovieRecoveryMeshFrontierInput,
): IAutoMovieRecoveryMeshFrontier {
  type Receipt = { path: string; bytes: number; sha256: string };
  type Fragment = Receipt & { items: number };
  type Channel = { name: string; items: number; files: Fragment[] };
  type Journal = {
    schema: string;
    directory: string;
    sequence: number;
    previous: Receipt | null;
    counts: { vertices: number; triangles: number; chunks: number };
    context: { [key: string]: unknown };
    channels: Channel[];
  };
  const names: string[] = [
    "positions",
    "normals",
    "indices",
    "sources",
    "vertices",
    "construction",
    "ownership",
  ];
  for (const budget of [
    input.maxJournals,
    input.maxFragments,
    input.maxJournalBytes,
    input.maxFragmentBytes,
  ])
    if (!Number.isSafeInteger(budget) || budget < 1)
      throw new Error("Positive finite frontier read budgets are required");
  const directory: string = fs.realpathSync(input.directory);
  const validCount: (value: number) => boolean = (value: number): boolean =>
    Number.isSafeInteger(value) && value >= 0;
  const read: (receipt: Receipt, limit: number) => Buffer = (
    receipt: Receipt,
    limit: number,
  ): Buffer => {
    if (
      !receipt ||
      typeof receipt.path !== "string" ||
      !validCount(receipt.bytes) ||
      receipt.bytes > limit ||
      !/^[a-f0-9]{64}$/i.test(receipt.sha256)
    )
      throw new Error("A bounded exact immutable byte receipt is required");
    const stat: fs.Stats = fs.lstatSync(receipt.path);
    if (!stat.isFile() || stat.isSymbolicLink() || stat.size !== receipt.bytes)
      throw new Error("Frontier byte length or plain-file ownership differs");
    const bytes: Buffer = fs.readFileSync(receipt.path);
    if (
      bytes.length !== receipt.bytes ||
      createHash("sha256").update(bytes).digest("hex") !==
        receipt.sha256.toLowerCase()
    )
      throw new Error("An immutable frontier byte hash differs");
    return bytes;
  };
  const journals: Journal[] = [];
  const visited: Set<string> = new Set();
  let next: Receipt | null = input.frontier;
  while (next !== null) {
    if (journals.length >= input.maxJournals || visited.has(next.path))
      throw new Error(
        "A frontier chain exceeds its budget or repeats a predecessor",
      );
    visited.add(next.path);
    const row: Journal = JSON.parse(
      read(next, input.maxJournalBytes).toString("utf8"),
    ) as Journal;
    if (
      row.schema !== "recovery-mesh-spool-frontier-v1" ||
      path.resolve(row.directory) !== directory ||
      !validCount(row.sequence) ||
      !row.context ||
      JSON.stringify(row.context.binding) !==
        JSON.stringify(input.expectedBinding) ||
      !row.counts ||
      !Object.values(row.counts).every(validCount) ||
      !Array.isArray(row.channels) ||
      row.channels.length !== names.length ||
      row.channels.some(
        (channel: Channel, i: number): boolean =>
          !channel ||
          channel.name !== names[i] ||
          !validCount(channel.items) ||
          !Array.isArray(channel.files),
      )
    )
      throw new Error(
        "A frontier does not bind the declared source, scope and channels",
      );
    if (journals.length && journals.at(-1)!.sequence !== row.sequence + 1)
      throw new Error("A frontier predecessor skips its sequence");
    journals.push(row);
    next = row.previous;
  }
  if (!journals.length || journals.at(-1)!.sequence !== 0)
    throw new Error("A frontier chain must terminate at sequence zero");
  journals.reverse();
  const channels: Channel[] = names.map(
    (name: string): Channel => ({ name, items: 0, files: [] }),
  );
  const paths: Set<string> = new Set();
  const vertexLimits: Map<string, number> = new Map();
  let fragments: number = 0;
  for (const row of journals) {
    for (let i: number = 0; i < channels.length; i++) {
      const channel: Channel = channels[i]!,
        incoming: Channel = row.channels[i]!;
      for (const file of incoming.files) {
        if (
          ++fragments > input.maxFragments ||
          !validCount(file.items) ||
          !file.items ||
          path.dirname(path.resolve(file.path)) !== directory ||
          path.basename(file.path) !==
            `${channel.name}.${channel.files.length}.json` ||
          paths.has(file.path)
        )
          throw new Error(
            "A committed fragment leaves its ordered channel ownership",
          );
        paths.add(file.path);
        vertexLimits.set(file.path, row.counts.vertices);
        channel.files.push(file);
        channel.items += file.items;
      }
      if (channel.items !== incoming.items)
        throw new Error(
          "Frontier delta counts do not reach their declared population",
        );
    }
    const sizes: number[] = [
      row.counts.vertices * 3,
      row.counts.vertices * 3,
      row.counts.triangles * 3,
      row.counts.vertices,
      row.counts.vertices,
      channels[5]!.items,
      row.counts.chunks,
    ];
    if (
      channels.some(
        (channel: Channel, i: number): boolean => channel.items !== sizes[i],
      )
    )
      throw new Error("A journal does not close every mesh channel together");
  }
  const final: Journal = journals.at(-1)!;
  let ownedVertices: number = 0,
    ownedTriangles: number = 0;
  for (const channel of channels) {
    let ordinal: number = 0;
    for (const file of channel.files) {
      const values: unknown[] = JSON.parse(
        read(file, input.maxFragmentBytes).toString("utf8"),
      ) as unknown[];
      if (!Array.isArray(values) || values.length !== file.items)
        throw new Error(
          "A committed fragment has a different array population",
        );
      for (const value of values) {
        if (
          (channel.name === "positions" || channel.name === "normals") &&
          (typeof value !== "number" || !Number.isFinite(value))
        )
          throw new Error("A committed numeric channel is not finite");
        if (
          channel.name === "indices" &&
          (typeof value !== "number" ||
            !validCount(value) ||
            value >= vertexLimits.get(file.path)!)
        )
          throw new Error(
            "A committed global index leaves its transaction's vertex population",
          );
        if (channel.name === "vertices" && value !== ordinal)
          throw new Error(
            "Generated physical vertex IDs lost append-only order",
          );
        if (channel.name === "ownership") {
          const owner: {
            vertexStart: number;
            vertexCount: number;
            triangleStart: number;
            triangleCount: number;
          } = value as {
            vertexStart: number;
            vertexCount: number;
            triangleStart: number;
            triangleCount: number;
          };
          if (
            !owner ||
            owner.vertexStart !== ownedVertices ||
            owner.triangleStart !== ownedTriangles ||
            !validCount(owner.vertexCount) ||
            !validCount(owner.triangleCount)
          )
            throw new Error("A committed ownership range is not contiguous");
          ownedVertices += owner.vertexCount;
          ownedTriangles += owner.triangleCount;
        }
        ordinal++;
      }
    }
  }
  if (
    ownedVertices !== final.counts.vertices ||
    ownedTriangles !== final.counts.triangles
  )
    throw new Error(
      "Ownership ranges do not cover the complete committed mesh",
    );
  return { counts: final.counts, context: final.context, channels };
}
