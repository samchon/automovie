import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";

import type { AutoMovieRecoveryOpenContinuation as O } from "../../internal/AutoMovieRecoveryOpenContinuation";
import type { realizeAutoMovieRecoveryTensorFamilies } from "../../internal/realizeAutoMovieRecoveryTensorFamilies";
import { applyAutoMovieRecoveryAnalyticPublication } from "../../internal/applyAutoMovieRecoveryAnalyticPublication";
import { archiveAutoMovieRecoveryModel } from "./archiveAutoMovieRecoveryModel";
import { reconstructAutoMovieRecoveryLocal } from "./reconstructAutoMovieRecoveryLocal";

/**
 * Consume immutable absolute curves and source-free graph with the local Hermite engine.
 * Usage: recoveryLocal curves.json continuation.json model.json ruled|quadratic [final-only|final-only-gzip] [analytic-publication.json]. Source registration
 * remains bound through the generating publications; this command opens no source mesh.
 * Default prefixes favor the longest open-only declared interval family. Final-only avoids repeated prefix serialization. Final-only-gzip also reverse-verifies a lossless archive before retiring the served raw model and spool; its output must be named model.json. The optional source-free extension binds both original byte hashes, replaces named coefficients once and declares analytic ownership.
 * The final log's file, bytes and sha256 describe the served publication; gzip also reports logicalBytes and logicalSha256 for the decompressed model.
 *
 * @evidence contracts/common.md#principled-implementation Complete-byte hashes admit the saved coefficient authority and its explicit graph before the engine creates independent indexed geometry through its public cubic and streaming contracts.
 * @evidence contracts/common.md#clear-and-simple-design One CLI owns input admission and epoch binding; reconstruction owns graph transport, the engine owns mathematics, and spool publication owns bounded file assembly.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No source vertices, indices, normals, selected hand-authored planes or external mesh substitution enter this command.
 * @evidence contracts/common.md#meaningful-documentation States changed operator entry, immutable generating inputs, publication ordering and explicit unfinished checkpoints.
 * @evidence contracts/performance.md#efficient-algorithms Each input is read and hashed once; generating and output costs are delegated to the source-free local engine and spool consumer. Optional gzip storage encodes the logical model once and fully reverse-decodes the compressed stream before raw retirement.
 * @evidence contracts/performance.md#reuse-equivalent-work Existing coefficients and endpoint graph are reused without observation or fitting. Actual emitted fragments serve checkpoint and final output.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Parsed bundle and graph are call-owned. Read buffers expire after admission; the consumer releases emitted chunks to bounded disk staging. File handles close synchronously and existing publications remain immutable.
 */
export async function recoveryLocal(args: string[], sourceEpoch: string): Promise<void> {
  const [
    curves,
    continuation,
    output,
    operator,
    publication,
    analytic,
  ]: string[] = args;
  if (
    args.length > 6 ||
    (publication !== undefined &&
      publication !== "final-only" &&
      publication !== "final-only-gzip") ||
    !curves ||
    !continuation ||
    !output ||
    !sourceEpoch ||
    !/^[a-f0-9]{40,64}$/i.test(sourceEpoch) ||
    (operator !== "ruled" && operator !== "quadratic")
  )
    throw new Error(
      "Usage: recoveryLocal curves continuation output ruled|quadratic [final-only|final-only-gzip] [analytic-publication.json] with source epoch argument",
    );
  if (
    publication === "final-only-gzip" &&
    (path.basename(output) !== "model.json" ||
      fs.existsSync(path.resolve(output) + ".gz") ||
      fs.existsSync(
        path.join(
          path.dirname(path.resolve(output)),
          "model-storage-receipt.json",
        ),
      ))
  )
    throw new Error(
      "Lossless final storage requires an unused model.json archive and receipt",
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
  let bundle: realizeAutoMovieRecoveryTensorFamilies.Input =
    saved.value as realizeAutoMovieRecoveryTensorFamilies.Input;
  let analyticPublicationSha256: string | undefined;
  if (analytic) {
    if (fs.statSync(analytic).size > 256 * 1024 * 1024)
      throw new Error(
        "Analytic publication exceeds the declared 256 MiB input budget",
      );
    const extension: ReturnType<typeof read> = read(analytic);
    bundle = applyAutoMovieRecoveryAnalyticPublication(
      bundle,
      extension.value as Parameters<typeof applyAutoMovieRecoveryAnalyticPublication>[1],
      { curveBundleSha256: saved.sha256, continuationSha256: topology.sha256 },
    );
    analyticPublicationSha256 = extension.sha256;
  }
  const result: ReturnType<typeof reconstructAutoMovieRecoveryLocal> =
    reconstructAutoMovieRecoveryLocal(bundle, graph, path.resolve(output), {
      sourceEpoch,
      curveBundleSha256: saved.sha256,
      continuationSha256: topology.sha256,
      operator,
      publishCheckpoints: publication === undefined,
      analyticPublicationSha256,
    });
  const archive: Awaited<ReturnType<typeof archiveAutoMovieRecoveryModel>> | undefined =
    publication === "final-only-gzip"
      ? await archiveAutoMovieRecoveryModel({
          output: path.dirname(path.resolve(output)),
          path: path.resolve(output),
          bytes: result.bytes,
          sha256: result.sha256,
        })
      : undefined;
  console.log(
    JSON.stringify({
      phase: "local-final",
      ...result,
      ...(archive ?? {}),
      file: archive?.path ?? path.resolve(output),
      archive,
      memory: process.memoryUsage(),
      elapsedMs: performance.now() - started,
    }),
  );
}
