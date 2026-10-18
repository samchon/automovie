import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import type { RecoveryMeshSections as R } from "./RecoveryMeshSections.ts";
import type { RecoveryOpenContinuation as O } from "./RecoveryOpenContinuation.ts";
import { reconstructRecoveryLocal } from "./reconstructRecoveryLocal.ts";

/**
 * Consume immutable absolute curves and source-free graph with the local Hermite engine.
 * Usage: recoveryLocal curves.json continuation.json model.json ruled|quadratic. Source registration
 * remains bound through the generating publications; this command opens no source mesh.
 * Prefixes favor the longest open-only declared interval family, without changing curves.
 *
 * @evidence contracts/common.md#principled-implementation Complete-byte hashes admit the saved coefficient authority and its explicit graph before the engine creates independent indexed geometry through its public cubic and streaming contracts.
 * @evidence contracts/common.md#clear-and-simple-design One CLI owns input admission and epoch binding; reconstruction owns graph transport, the engine owns mathematics, and spool publication owns bounded file assembly.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No source vertices, indices, normals, selected hand-authored planes or external mesh substitution enter this command.
 * @evidence contracts/common.md#meaningful-documentation States changed operator entry, immutable generating inputs, publication ordering and explicit unfinished checkpoints.
 * @evidence contracts/performance.md#efficient-algorithms Each input is read and hashed once; generating and output costs are delegated to the source-free local engine and spool consumer.
 * @evidence contracts/performance.md#reuse-equivalent-work Existing coefficients and endpoint graph are reused without observation or fitting. Actual emitted fragments serve checkpoint and final output.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Parsed bundle and graph are call-owned. Read buffers expire after admission; the consumer releases emitted chunks to bounded disk staging. File handles close synchronously and existing publications remain immutable.
 */
export function recoveryLocal(args: string[]): void {
  const [curves, continuation, output, operator]: string[] = args;
  const sourceEpoch: string | undefined = process.env.RUN_SOURCE_EPOCH;
  if (
    !curves ||
    !continuation ||
    !output ||
    !sourceEpoch ||
    !/^[a-f0-9]{40,64}$/i.test(sourceEpoch) ||
    (operator !== "ruled" && operator !== "quadratic")
  )
    throw new Error(
      "Usage: recoveryLocal curves continuation output ruled|quadratic with RUN_SOURCE_EPOCH",
    );
  const started: number = performance.now();
  const read: (file: string) => { value: unknown; sha256: string } = (
    file: string,
  ): { value: unknown; sha256: string } => {
    const bytes: Buffer = fs.readFileSync(file);
    return {
      value: JSON.parse(bytes.toString("utf8")) as unknown,
      sha256: createHash("sha256").update(bytes).digest("hex"),
    };
  };
  const saved: ReturnType<typeof read> = read(curves),
    topology: ReturnType<typeof read> = read(continuation);
  const graph: O.Continuation & { provenance: { curveBundleSha256: string } } =
    topology.value as O.Continuation & {
      provenance: { curveBundleSha256: string };
    };
  if (graph.provenance.curveBundleSha256 !== saved.sha256)
    throw new Error(
      "Continuation does not bind this exact coefficient publication",
    );
  console.error(
    JSON.stringify({
      phase: "local-input-admitted",
      sourceEpoch,
      curveBundleSha256: saved.sha256,
      continuationSha256: topology.sha256,
      memory: process.memoryUsage(),
      elapsedMs: performance.now() - started,
    }),
  );
  const result: ReturnType<typeof reconstructRecoveryLocal> =
    reconstructRecoveryLocal(
      saved.value as R.Bundle,
      graph,
      path.resolve(output),
      {
        sourceEpoch,
        curveBundleSha256: saved.sha256,
        continuationSha256: topology.sha256,
        operator,
      },
    );
  console.log(
    JSON.stringify({
      phase: "local-final",
      file: path.resolve(output),
      ...result,
      memory: process.memoryUsage(),
      elapsedMs: performance.now() - started,
    }),
  );
}

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
)
  recoveryLocal(process.argv.slice(2));
