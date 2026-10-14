import type {
  IAutoMovieBuildProjectOutput,
  IAutoMovieGeneratedManifest,
} from "@automovie/interface";
import type { IAutoMovieProductionDesignGraph } from "@automovie/production";
import { TestValidator } from "@nestia/e2e";
import path from "node:path";
import type { AutoMovieProductionProject } from "../../../../packages/production/src/production/AutoMovieProductionProject";
import { createAutoMovieProductionSourceStatus } from "../../../../packages/production/src/production/createAutoMovieProductionSourceStatus";
import { currentAutoMovieProductionBuildInputFingerprint } from "../../../../packages/production/src/production/currentAutoMovieProductionBuildInputFingerprint";

type ProjectFixture = Pick<AutoMovieProductionProject,
  "root" | "productionId" | "revision" | "graph" | "readSource" |
  "contentInputs" | "screenplayIndex" | "generatedManifest" | "generatedRoot"
> & { manifest: () => Record<string, never> };

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
 *
 * @evidence contracts/testing.md#behavioral-verification Invokes actual composed status with counted generated-walk, loader and gate capabilities. Checks five initial successes with one evaluation/six listings/one cache read, revision-only rebinding without evaluation, two repeated failed observations and restored one-run reuse; diagnostics retain the arranged cause message.
 * @evidence contracts/testing.md#independent-expectations Literal counters encode one before/after acquisition for the first admitted success and one fresh acquisition per reused query, while failed observations require a new gate each time. The arrangement obtains a current fingerprint only to align its generated manifest/gate identity; no literal digest oracle independently validates fingerprint calculation.
 * @evidence contracts/testing.md#distinguishing-cases Keeps unchanged success, revision-only unbound write, two unavailable observations with failed gates and restored observations. Fixed/live authoring selection, thrown evaluation, changed declared dependencies and during-run races belong to adjacent source-status tests. Empty declared/generated populations mean no document or generated-file reader is invoked here.
 * @evidence contracts/testing.md#execution-ownership The named test_production_source_status_runtime owns four portable synchronous scenarios through actual composition with injected project/generated/loader ports. Empty manifest disables derivation inspection before physical reads, and empty requested populations invoke no missing document/generated-file reader. No filesystem, authored module, process or renderer executes; actual imports expose the preexisting minimal-project versus class type mismatch for dedicated later repair, without changing runtime inputs or claiming execution.
 */
export function test_production_source_status_runtime(): void {
  const root: string = path.resolve("source-status-runtime-input");
  const graph: IAutoMovieProductionDesignGraph = {
    production: null,
    models: new Map(),
    world: null,
    formations: new Map(),
    shots: new Map(),
    acceptance: new Map(),
  };
  let revision: number = 7;
  let evaluations: number = 0;
  let listings: number = 0;
  let cacheReads: number = 0;
  let refused: boolean = false;
  const cause: Error = new Error(
    "The generated population observation is unavailable.",
  );
  const project: ProjectFixture = {
    root,
    productionId: "harbor",
    revision: (): number => revision,
    graph: (): IAutoMovieProductionDesignGraph => graph,
    readSource: (file: string): Uint8Array => {
      throw new Error(`Source "${file}" does not exist.`);
    },
    contentInputs: (): ReturnType<AutoMovieProductionProject["contentInputs"]> => [],
    manifest: (): Record<string, never> => ({}),
    screenplayIndex: (): null => null,
    generatedManifest: (): IAutoMovieGeneratedManifest => manifest,
    generatedRoot: (): string => path.join(root, "generated", "harbor"),
  };
  const fingerprint: string | null = currentAutoMovieProductionBuildInputFingerprint(
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
  const status: () => IAutoMovieBuildProjectOutput = createAutoMovieProductionSourceStatus({
    project,
    builder: {
      lintSource: (): ReturnType<Parameters<typeof createAutoMovieProductionSourceStatus>[0]["builder"]["lintSource"]> => {
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
      listFiles: (): string[] => {
        listings += 1;
        if (refused) throw cause;
        return [];
      },
      moduleCache: (): Readonly<Record<string, unknown>> => {
        cacheReads += 1;
        return {};
      },
    },
  });
  const answers: IAutoMovieBuildProjectOutput[] = Array.from({ length: 5 }, (): IAutoMovieBuildProjectOutput => status());
  TestValidator.equals(
    "five unchanged queries run one gate with fresh observations",
    {
      evaluations,
      listings,
      cacheReads,
      successes: answers.map((answer: IAutoMovieBuildProjectOutput): boolean => answer.success),
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
  const failures: IAutoMovieBuildProjectOutput[] = [status(), status()];
  TestValidator.equals(
    "an unreadable population never reuses prior success",
    {
      evaluations,
      successes: failures.map((answer: IAutoMovieBuildProjectOutput): boolean => answer.success),
      causes: failures.map((answer: IAutoMovieBuildProjectOutput): string => answer.diagnostics[0]!.message),
    },
    {
      evaluations: 3,
      successes: [false, false],
      causes: [cause.message, cause.message],
    },
  );
  refused = false;
  const recovered: IAutoMovieBuildProjectOutput[] = [status(), status()];
  TestValidator.equals(
    "recovery establishes one new retained answer",
    {
      evaluations,
      cacheReads,
      successes: recovered.map((answer: IAutoMovieBuildProjectOutput): boolean => answer.success),
    },
    {
      evaluations: 4,
      cacheReads: 4,
      successes: [true, true],
    },
  );
}
