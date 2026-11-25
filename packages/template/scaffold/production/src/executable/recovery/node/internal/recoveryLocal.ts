import type {
  AutoMovieRecoveryCurveData,
  AutoMovieRecoveryCurveFormat,
  IAutoMovieRecoveryAnalyticPublication,
  IAutoMovieRecoveryTensorFamiliesInput,
} from "@automovie/interface";
import {
  applyAutoMovieRecoveryAnalyticPublication,
  restoreRecoveryCurveBasis,
} from "@automovie/recovery";
import fs from "node:fs";
import path from "node:path";

import { archiveAutoMovieRecoveryModel } from "../artifact/archiveAutoMovieRecoveryModel";
import type { publishAutoMovieRecoveryInput } from "../artifact/publishAutoMovieRecoveryInput";
import { reconstructAutoMovieRecoveryLocal } from "../reconstruction/reconstructAutoMovieRecoveryLocal";
import type { recoveryOpen } from "./recoveryOpen";

/**
 * Publish local recovery from fixed, typed coefficients and a source-free
 * continuation graph. The optional analytic extension binds both original byte
 * hashes before replacing coefficients. Final-only modes skip repeated prefix
 * publication, and gzip mode verifies the archive before retiring raw output.
 */
export async function recoveryLocal(
  props: recoveryLocal.IInput,
): Promise<void> {
  const {
    curves,
    continuation,
    output,
    operator,
    publication,
    analytic,
    sourceEpoch,
  }: recoveryLocal.IInput = props;
  if (output.length === 0)
    throw new Error("A local recovery output path is required");
  if (!/^[a-f0-9]{40,64}$/i.test(sourceEpoch))
    throw new Error("A frozen pre-execution source epoch is required");
  const destination: string = path.resolve(output);
  const directory: string = path.dirname(destination);
  if (
    publication === "final-only-gzip" &&
    (path.basename(destination) !== "model.json" ||
      fs.existsSync(destination + ".gz") ||
      fs.existsSync(path.join(directory, "model-storage-receipt.json")))
  )
    throw new Error(
      "Lossless final storage requires an unused model.json archive and receipt",
    );

  const started: number = performance.now();
  if (continuation.value.provenance.curveBundleSha256 !== curves.sha256)
    throw new Error(
      "Continuation does not bind this exact coefficient publication",
    );
  console.error(
    JSON.stringify({
      phase: "local-input-admitted",
      sourceEpoch,
      curveBundleSha256: curves.sha256,
      continuationSha256: continuation.sha256,
      memory: process.memoryUsage(),
      elapsedMs: performance.now() - started,
    }),
  );
  let bundle: IAutoMovieRecoveryTensorFamiliesInput = restoreRecoveryCurveBasis(
    curves.value,
  );
  if (analytic !== undefined) {
    if (analytic.bytes > 256 * 1024 * 1024)
      throw new Error(
        "Analytic publication exceeds the declared 256 MiB input budget",
      );
    bundle = applyAutoMovieRecoveryAnalyticPublication(
      bundle,
      restoreRecoveryCurveBasis(analytic.value),
      {
        curveBundleSha256: curves.sha256,
        continuationSha256: continuation.sha256,
      },
    );
  }

  const result: ReturnType<typeof reconstructAutoMovieRecoveryLocal> =
    reconstructAutoMovieRecoveryLocal(bundle, continuation.value, destination, {
      sourceEpoch,
      curveBundleSha256: curves.sha256,
      continuationSha256: continuation.sha256,
      operator,
      publishCheckpoints: publication === undefined,
      analyticPublicationSha256: analytic?.sha256,
    });
  const archive:
    | Awaited<ReturnType<typeof archiveAutoMovieRecoveryModel>>
    | undefined =
    publication === "final-only-gzip"
      ? await archiveAutoMovieRecoveryModel({
          output: directory,
          path: destination,
          bytes: result.bytes,
          sha256: result.sha256,
        })
      : undefined;
  console.log(
    JSON.stringify({
      phase: "local-final",
      ...result,
      ...(archive ?? {}),
      file: archive?.path ?? destination,
      archive,
      memory: process.memoryUsage(),
      elapsedMs: performance.now() - started,
    }),
  );
}

export namespace recoveryLocal {
  /** Immutable input publications and the selected local output. */
  export interface IInput {
    /** Source-free cubic observations, in either saved coefficient basis. */
    curves: publishAutoMovieRecoveryInput.IArtifact<
      AutoMovieRecoveryCurveData<
        IAutoMovieRecoveryTensorFamiliesInput,
        AutoMovieRecoveryCurveFormat
      >
    >;

    /** The open graph linked to these exact curve bytes. */
    continuation: publishAutoMovieRecoveryInput.IArtifact<
      recoveryOpen.IContinuation
    >;

    /** Optional analytic replacement of the same curves and graph. */
    analytic?: publishAutoMovieRecoveryInput.IArtifact<
      AutoMovieRecoveryCurveData<
        IAutoMovieRecoveryAnalyticPublication,
        AutoMovieRecoveryCurveFormat
      >
    >;

    /** Destination of the model before optional lossless archive storage. */
    output: string;

    /** Station interpolation for ordinary open surfaces. */
    operator: "ruled" | "quadratic";

    /** Omit to publish prefixes as well as the final model. */
    publication?: "final-only" | "final-only-gzip";

    /** Frozen generating source identity. */
    sourceEpoch: string;
  }
}
