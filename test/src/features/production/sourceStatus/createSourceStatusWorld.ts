import type { IAutoMovieBuildProjectOutput } from "@automovie/interface";
import type { ISourceStatusEntry } from "./ISourceStatusEntry";
import type { ISourceStatusSnapshot } from "./ISourceStatusSnapshot";
import type { ISourceStatusEvaluation } from "./ISourceStatusEvaluation";
import { retainAutoMovieProductionSourceStatus } from "./retainAutoMovieProductionSourceStatus";
import { textDigest } from "./textDigest";
import { fingerprintOf } from "./fingerprintOf";
import { generatedBytesOf } from "./generatedBytesOf";
import { SCREENPLAY_DOCUMENT } from "./SCREENPLAY_DOCUMENT";
import { SOURCE_FAILURE } from "./SOURCE_FAILURE";
import { GENERATED_STALE } from "./GENERATED_STALE";
import { GENERATED_TAMPERED } from "./GENERATED_TAMPERED";
import type { ISourceStatusState } from "./ISourceStatusState";
import { answerOf } from "./answerOf";
import type { ISourceStatusWorld } from "./ISourceStatusWorld";

/**
 * Create the existing mutable source-status arrangement.
 *
 * @evidence contracts/testing.md#behavioral-verification Preserves initial source and generated strings, revision seven, observation counters, hook positions and compile mutation order; acquire deduplicates/sorts requested documents while evaluate preserves repeated reads.
 * @evidence contracts/testing.md#independent-expectations Existing units supply exact counter increments, revisions, ordered observations and explicit diagnostic literals. The modeled evaluate/acquire capabilities do not independently prove native filesystem or compiler behavior.
 * @evidence contracts/testing.md#distinguishing-cases Retention, refusal and race consumers arrange unchanged inputs, changed source/documents/resident state, missing snapshots, thrown hooks, repeated reads and revision dependence through these same existing mutable ports.
 * @evidence contracts/testing.md#execution-ownership Each call returns caller-owned state/hooks/counters and closures over that one world; status alone invokes the maintained retention owner and compile changes only the existing logical compiled/generated/revision fields.
 */
export const createSourceStatusWorld: () => ISourceStatusWorld = (): ISourceStatusWorld => {
  const initial: string = "export const opening = defineShot({ beats: 3 });\n";
  const state: ISourceStatusState = {
    revision: 7,
    source: initial,
    compiled: initial,
    generated: generatedBytesOf(initial),
    valid: true,
    resident: null,
    screenplay: "treatment and scene index v1",
    documents: new Map([[SCREENPLAY_DOCUMENT, "INT. HARBOR - NIGHT"]]),
    read: [SCREENPLAY_DOCUMENT],
    undeclaredModules: [],
    incomplete: false,
    revisionBound: false,
  };
  const counts: ISourceStatusWorld["counts"] = { evaluations: 0, acquisitions: 0 };
  const hooks: ISourceStatusWorld["hooks"] = {
    acquire: (): void => undefined,
    snapshot: (_snapshot: ISourceStatusSnapshot): void => undefined,
    beforeRead: (): void => undefined,
    read: (_index: number): void => undefined,
    afterRead: (): void => undefined,
    output: (_output: IAutoMovieBuildProjectOutput): void => undefined,
    afterAnswer: (): void => undefined,
  };
  const documentDigest: (file: string) => string | null = (file: string): string | null => {
    const text: string | null | undefined = state.documents.get(file);
    return text === undefined || text === null ? null : textDigest(text);
  };
  const acquire: ISourceStatusWorld["acquire"] = (
    documents: readonly string[],
  ): ISourceStatusSnapshot | null => {
    counts.acquisitions += 1;
    hooks.acquire();
    if (state.incomplete) return null;
    const snapshot: ISourceStatusSnapshot = {
      revision: state.revision,
      inputFingerprint: fingerprintOf(state.source),
      resident: state.resident,
      screenplay:
        state.screenplay === null ? null : textDigest(state.screenplay),
      documents: [...new Set(documents)]
        .sort((left: string, right: string): number => (left < right ? -1 : left > right ? 1 : 0))
        .map((file: string): ISourceStatusEntry => ({ path: file, digest: documentDigest(file) })),
      generated: {
        inputFingerprint: fingerprintOf(state.compiled),
        manifest: textDigest(`manifest\0${state.compiled}`),
        files: [
          { path: "shots/opening.json", digest: textDigest(state.generated) },
        ],
      },
    };
    hooks.snapshot(snapshot);
    return snapshot;
  };
  const evaluate: ISourceStatusWorld["evaluate"] = (): ISourceStatusEvaluation => {
    counts.evaluations += 1;
    hooks.beforeRead();
    const documents: ISourceStatusEntry[] = state.read.map((file: string, index: number): ISourceStatusEntry => {
      hooks.read(index);
      return { path: file, digest: documentDigest(file) };
    });
    hooks.afterRead();
    const output: IAutoMovieBuildProjectOutput = answerOf(state, [
      ...(state.valid ? [] : [SOURCE_FAILURE]),
      ...(state.compiled === state.source ? [] : [GENERATED_STALE]),
      ...(state.generated === generatedBytesOf(state.compiled)
        ? []
        : [GENERATED_TAMPERED]),
    ]);
    hooks.output(output);
    hooks.afterAnswer();
    return {
      output,
      documents,
      undeclaredModules: [...state.undeclaredModules],
      revisionBound: state.revisionBound,
    };
  };
  return {
    state,
    counts,
    hooks,
    acquire,
    evaluate,
    status: (): (() => IAutoMovieBuildProjectOutput) => retainAutoMovieProductionSourceStatus({ acquire, evaluate }),
    compile: (): void => {
      state.compiled = state.source;
      state.generated = generatedBytesOf(state.source);
      state.revision += 1;
    },
  };
};
