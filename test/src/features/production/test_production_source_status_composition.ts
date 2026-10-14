import type { IAutoMovieProductionEvidence } from "@automovie/evidence";
import type { IAutoMovieBuildProjectOutput } from "@automovie/interface";
import type { IAutoMovieProductionDesignGraph } from "@automovie/production";
import { TestValidator } from "@nestia/e2e";
import path from "node:path";
import type { AutoMovieProductionProject } from "../../../../packages/production/src/production/AutoMovieProductionProject";
import { createAutoMovieProductionSourceStatus } from "../../../../packages/production/src/production/createAutoMovieProductionSourceStatus";

import { textDigest } from "./sourceStatus/textDigest";

type ProjectFixture = Pick<AutoMovieProductionProject,
  "root" | "productionId" | "revision" | "graph" | "readSource" |
  "contentInputs" | "screenplayIndex" | "readProseDocument" |
  "generatedManifest" | "generatedRoot" | "readGeneratedFile"
> & { manifest: () => Record<string, never> };

type CountedEvidence = { evidence: IAutoMovieProductionEvidence; reads: () => number };
type CountedBuilder = {
  builder: Parameters<typeof createAutoMovieProductionSourceStatus>[0]["builder"];
  runs: () => number;
};

/** Logical project identity; the empty manifest disables native derivation reads. */
const ROOT: string = path.join(__dirname, "source-status-project");

/** An unavailable generated inventory and an empty loader, without physical reads. */
const runtime: NonNullable<Parameters<typeof createAutoMovieProductionSourceStatus>[0]["runtime"]> = {
  listFiles: (_root: string): string[] => {
    throw new Error("The runtime cannot provide its generated inventory.");
  },
  moduleCache: (): Readonly<Record<string, unknown>> => ({}),
};

const GRAPH: IAutoMovieProductionDesignGraph = {
  production: null,
  models: new Map(),
  world: null,
  formations: new Map(),
  shots: new Map(),
  acceptance: new Map(),
};

const answerOf: () => IAutoMovieBuildProjectOutput = (): IAutoMovieBuildProjectOutput => ({
  success: true,
  revision: 5,
  builder: {
    version: "unit",
    inputFingerprint: textDigest("unlisted project"),
  },
  diagnostics: [],
  materialized: [],
});

const projectOf: () => ProjectFixture = (): ProjectFixture => ({
  root: ROOT,
  productionId: "harbor",
  revision: (): number => 5,
  graph: (): IAutoMovieProductionDesignGraph => GRAPH,
  readSource: (file: string): Uint8Array => {
    throw new Error(`Source "${file}" does not exist.`);
  },
  contentInputs: (): ReturnType<AutoMovieProductionProject["contentInputs"]> => [],
  manifest: (): Record<string, never> => ({}),
  screenplayIndex: (): null => null,
  readProseDocument: (): null => null,
  generatedManifest: (): null => null,
  generatedRoot: (): string => path.join(ROOT, "generated", "harbor"),
  readGeneratedFile: (file: string): Uint8Array => {
    throw new Error(`Generated file "${file}" does not exist.`);
  },
});

/** Film evidence whose kind reads are counted, with no owner edges. */
const countedEvidence: () => CountedEvidence = (): CountedEvidence => {
  let reads: number = 0;
  const evidence: IAutoMovieProductionEvidence = {} as IAutoMovieProductionEvidence;
  Object.defineProperty(evidence, "manifest", {
    get: (): Pick<IAutoMovieProductionEvidence["manifest"], "kind"> => {
      reads += 1;
      return { kind: "film" };
    },
  });
  Object.defineProperty(evidence, "sourceOwners", { value: [] });
  return { evidence, reads: (): number => reads };
};

/**
 * The composed status only reuses what it can read.
 *
 * The composition reads snapshots through the project handle and the builder's
 * own generated inventory port, and judges them against the evidence a compile
 * would read now: the live reader when one is supplied, otherwise the fixed
 * declaration. An inventory the runtime cannot supply leaves no snapshot,
 * so every call runs the builder's gate and returns its answer.
 *
 * Scenarios:
 *
 * 1. With a live reader, an unlistable generated root runs the gate at both
 *    calls and judges each snapshot against the evidence the reader returns,
 *    never the fixed declaration.
 * 2. Without a live reader, the fixed declaration judges each snapshot and the
 *    gate still runs at both calls.
 *
 * @evidence contracts/testing.md#behavioral-verification Invokes actual composed status twice with either live or fixed authoring evidence, checking two gate runs, returned answers, selected evidence-kind reads and zero reads of the shadowed fixed evidence. The generated walk refuses, so unavailable observations cannot retain success; kind reads establish reader selection rather than complete graph validity.
 * @evidence contracts/testing.md#independent-expectations Literal two-run counts and [ANSWER,ANSWER] populations encode reevaluation on unobservable state. Independently counted manifest getters distinguish live from fixed selection with existing lower bounds, not exact internal read counts. The kind-only evidence assertion and structurally minimal project fixture do not establish a fully opened project contract.
 * @evidence contracts/testing.md#distinguishing-cases Keeps live-reader precedence and fixed-only fallback under the same failing generated walk. Successful reuse is owned by runtime/retention tests, and thrown gate or during-run mismatch cases by refusal/race tests; these cases do not require an exact acquisition count.
 * @evidence contracts/testing.md#execution-ownership The named test_production_source_status_composition owns two portable synchronous scenarios through actual composition and injected project/generated/loader ports. Empty manifest disables derivation inspection before physical root reads, and no authored project module, filesystem, process or renderer executes. Actual imports expose the preexisting class-versus-minimal-structural-project type mismatch for the dedicated later cross-package repair; runtime inputs remain unchanged and execution is unclaimed.
 */
export function test_production_source_status_composition(): void {
  const ANSWER: IAutoMovieBuildProjectOutput = answerOf();
  function builderOf(): CountedBuilder {
    let runs: number = 0;
    return {
      builder: {
        lintSource: (): ReturnType<CountedBuilder["builder"]["lintSource"]> => {
          runs += 1;
          return { output: ANSWER, documents: [], revisionBound: false };
        },
      },
      runs: (): number => runs,
    };
  }

  const liveBuilder: CountedBuilder = builderOf();
  const liveFixed: CountedEvidence = countedEvidence();
  const liveRead: CountedEvidence = countedEvidence();
  const liveStatus: () => IAutoMovieBuildProjectOutput = createAutoMovieProductionSourceStatus({
    project: projectOf(),
    builder: liveBuilder.builder,
    authoringEvidence: liveFixed.evidence,
    currentAuthoringEvidence: (): IAutoMovieProductionEvidence => liveRead.evidence,
    runtime,
  });
  const liveAnswers: IAutoMovieBuildProjectOutput[] = [liveStatus(), liveStatus()];

  const fixedBuilder: CountedBuilder = builderOf();
  const fixed: CountedEvidence = countedEvidence();
  const fixedStatus: () => IAutoMovieBuildProjectOutput = createAutoMovieProductionSourceStatus({
    project: projectOf(),
    builder: fixedBuilder.builder,
    authoringEvidence: fixed.evidence,
    runtime,
  });
  const fixedAnswers: IAutoMovieBuildProjectOutput[] = [fixedStatus(), fixedStatus()];

  TestValidator.equals(
    "an unlistable generated root runs the gate at every call",
    {
      live: { runs: liveBuilder.runs(), answers: liveAnswers },
      fixed: { runs: fixedBuilder.runs(), answers: fixedAnswers },
    },
    {
      live: { runs: 2, answers: [ANSWER, ANSWER] },
      fixed: { runs: 2, answers: [ANSWER, ANSWER] },
    },
  );
  TestValidator.equals(
    "the live reader, when supplied, is what judges each snapshot",
    {
      liveReaderJudged: liveRead.reads() >= 2,
      liveFixedIgnored: liveFixed.reads() === 0,
      fixedJudged: fixed.reads() >= 2,
    },
    { liveReaderJudged: true, liveFixedIgnored: true, fixedJudged: true },
  );
}
