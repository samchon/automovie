import type {
  AutoMovieContentDigest,
  IAutoMovieBuildProjectOutput,
  IAutoMovieGeneratedManifest,
} from "@automovie/interface";
import type { IAutoMovieProductionDesignGraph } from "@automovie/production";
import { TestValidator } from "@nestia/e2e";
import path from "node:path";

import { loadSourceModule } from "../internal/loadSourceModule";

const modulePath = (name: string): string =>
  path.resolve(
    __dirname,
    "../../../../packages/production/src/production",
    name,
  );
const { createAutoMovieProductionSourceStatus } = loadSourceModule<{
  createAutoMovieProductionSourceStatus(props: {
    project: object;
    builder: {
      lintSource(): {
        output: IAutoMovieBuildProjectOutput;
        documents: Array<{ path: string; content: string | null }>;
        revisionBound: boolean;
      };
    };
    runtime: {
      listFiles: (root: string) => string[];
      moduleCache: () => Readonly<Record<string, unknown>>;
    };
  }): () => IAutoMovieBuildProjectOutput;
}>(modulePath("createAutoMovieProductionSourceStatus.ts"));
const { currentAutoMovieProductionBuildInputFingerprint } = loadSourceModule<{
  currentAutoMovieProductionBuildInputFingerprint(
    project: object,
    scope: "source",
  ): AutoMovieContentDigest | null;
}>(modulePath("productionBuildIdentity.ts"));

/**
 * A host's complete observations let the composed gate retain a proven answer.
 *
 * This scenario counts an injected gate at the actual source-status composition
 * entry. It exercises fresh input acquisition and evaluation tracing together;
 * it does not claim to render a frame or measure an authored film's latency.
 *
 * Scenarios:
 * 1. Five successive guard queries invoke the injected gate once and still
 *    list the complete generated population at every snapshot boundary.
 * 2. A revision-only write refreshes an unbound answer without gate execution.
 * 3. An observation that throws causes evaluation, preserves a failed answer,
 *    and cannot reuse the retained success on either successive query.
 * 4. Restored observations re-establish one success and then reuse it.
 */
export const test_production_source_status_runtime = (): void => {
  const root = path.resolve("source-status-runtime-input");
  const graph: IAutoMovieProductionDesignGraph = {
    production: null,
    models: new Map(),
    world: null,
    formations: new Map(),
    shots: new Map(),
    acceptance: new Map(),
  };
  let revision = 7;
  let evaluations = 0;
  let listings = 0;
  let cacheReads = 0;
  let refused = false;
  const cause = new Error(
    "The generated population observation is unavailable.",
  );
  const project = {
    root,
    productionId: "harbor",
    revision: () => revision,
    graph: () => graph,
    readSource: (file: string): Uint8Array => {
      throw new Error(`Source "${file}" does not exist.`);
    },
    contentInputs: () => [],
    manifest: () => ({}),
    screenplayIndex: () => null,
    generatedManifest: (): IAutoMovieGeneratedManifest => manifest,
    generatedRoot: () => path.join(root, "generated", "harbor"),
  };
  const fingerprint = currentAutoMovieProductionBuildInputFingerprint(
    project,
    "source",
  );
  TestValidator.predicate(
    "the arranged input has a complete fingerprint",
    fingerprint !== null,
  );
  const manifest: IAutoMovieGeneratedManifest = {
    version: 1,
    builder: { packageVersion: "unit", protocolVersion: "1" },
    inputFingerprint: fingerprint!,
    files: [],
  };
  const status = createAutoMovieProductionSourceStatus({
    project,
    builder: {
      lintSource: () => {
        evaluations += 1;
        return {
          documents: [],
          revisionBound: false,
          output: {
            success: refused === false,
            revision,
            builder: { version: "unit", inputFingerprint: fingerprint! },
            diagnostics: refused
              ? [
                  {
                    code: "generated-path-outside",
                    category: "error",
                    phase: "compile",
                    target: "generated-root",
                    path: null,
                    message: cause.message,
                  },
                ]
              : [],
            materialized: [],
          },
        };
      },
    },
    runtime: {
      listFiles: () => {
        listings += 1;
        if (refused) throw cause;
        return [];
      },
      moduleCache: () => {
        cacheReads += 1;
        return {};
      },
    },
  });
  const answers = Array.from({ length: 5 }, () => status());
  TestValidator.equals(
    "five unchanged queries run one gate with fresh observations",
    {
      evaluations,
      listings,
      cacheReads,
      successes: answers.map((answer) => answer.success),
    },
    {
      evaluations: 1,
      listings: 6,
      cacheReads: 1,
      successes: [true, true, true, true, true],
    },
  );
  revision += 1;
  TestValidator.equals(
    "revision-only publication preserves a proven unbound answer",
    { revision: status().revision, evaluations },
    { revision: 8, evaluations: 1 },
  );
  refused = true;
  const failures = [status(), status()];
  TestValidator.equals(
    "an unreadable population never reuses prior success",
    {
      evaluations,
      successes: failures.map((answer) => answer.success),
      causes: failures.map((answer) => answer.diagnostics[0]!.message),
    },
    {
      evaluations: 3,
      successes: [false, false],
      causes: [cause.message, cause.message],
    },
  );
  refused = false;
  const recovered = [status(), status()];
  TestValidator.equals(
    "recovery establishes one new retained answer",
    {
      evaluations,
      cacheReads,
      successes: recovered.map((answer) => answer.success),
    },
    {
      evaluations: 4,
      cacheReads: 4,
      successes: [true, true],
    },
  );
};
