import type { IAutoMovieDesignMutationOutput } from "@automovie/interface";
import { compareCodeUnits } from "../contentIdentity";
import { parseAutoMovieStructuredJson } from "../duplicateAwareJson";
import type { IAutoMovieDesignDerivationBasis } from "./IAutoMovieDesignDerivationBasis";
import { AutoMovieDesignDerivationError } from "./AutoMovieDesignDerivationError";
import { captureAutoMovieDesignDerivationBasis } from "./captureAutoMovieDesignDerivationBasis";
import { createAutoMovieDesignDerivationCandidate } from "./createAutoMovieDesignDerivationCandidate";
import type { IAutoMovieDesignProducerEntry } from "./IAutoMovieDesignProducerEntry";
import type { IAutoMovieDesignDerivationOutcome } from "./IAutoMovieDesignDerivationOutcome";
import type { IAutoMovieDesignDerivationRun } from "./IAutoMovieDesignDerivationRun";
import { canonicalDesignBytes } from "./canonicalDesignBytes";

/**
 * Stage a producer plan, then invoke its stores sequentially in declared order.
 *
 * @evidence contracts/common.md#principled-implementation Captures one basis per entry, observes two canonical evaluations, rechecks live metadata and rejects declared orphan residents before its first store; unchanged canonical values skip their store.
 * @evidence contracts/common.md#clear-and-simple-design Candidate observation and publication are separate phases, with publication order retained for dependent records.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The evaluator ignores the candidate's cloned basis argument and calls entry.evaluate() on its captured environment. Stores are sequential without rollback, so later refusal can leave earlier writes; no maintained product runtime currently invokes this public API.
 * @evidence contracts/common.md#meaningful-documentation States callback trust, unchanged-store elision, declared-order publication, partial-write failure and the missing runtime host.
 * @evidence contracts/performance.md#efficient-algorithms For n entries each capture calls the source reader separately, so inventory/hash cost repeats n times per capture pass; two evaluations, canonical serialization, sorting and actual stores remain included.
 * @evidence contracts/performance.md#reuse-equivalent-work Only exact canonical resident/output byte equality skips a store; evaluations and source callbacks are not shared across entries or separate runs.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Borrowed entries/residents and staged output bytes stay reachable during synchronous publication; returned outcomes are caller-owned, and partial store effects retain their store owner's lifetime.
 */
export function runAutoMovieDesignDerivation(props: {
  /** Production that owns every declared target. */
  production: string;

  /** Declared emitter path and bytes; capture hashes normalized source text. */
  emitter: { path: string; bytes: Uint8Array };

  /** Caller-declared tool labels; this owner does not observe tool versions. */
  tool: IAutoMovieDesignDerivationBasis["tool"];

  /** Caller-supplied source inventory; target-local import closure is its premise. */
  sourceInputs: () => readonly { path: string; bytes: Uint8Array }[];

  /** Every design record resident before the run, with its stored value. */
  resident: readonly { target: string; recordPath: string; value: unknown }[];

  /** The complete declared producer plan, in publication order. */
  entries: readonly IAutoMovieDesignProducerEntry[];
}): IAutoMovieDesignDerivationRun {
  const captureBases: () => IAutoMovieDesignDerivationBasis[] = (): IAutoMovieDesignDerivationBasis[] =>
    props.entries.map((entry: IAutoMovieDesignProducerEntry): IAutoMovieDesignDerivationBasis =>
      captureAutoMovieDesignDerivationBasis({
        production: props.production,
        target: entry.target,
        recordPath: entry.recordPath,
        emitter: props.emitter,
        source: entry.source,
        sourceInputs: props.sourceInputs,
        tool: props.tool,
      }),
    );
  const candidate: ReturnType<typeof createAutoMovieDesignDerivationCandidate> = createAutoMovieDesignDerivationCandidate({
    bases: captureBases(),
    evaluate: (): { target: string; recordPath: string; bytes: Uint8Array }[] =>
      props.entries.map((entry: IAutoMovieDesignProducerEntry): { target: string; recordPath: string; bytes: Uint8Array } => ({
        target: entry.target,
        recordPath: entry.recordPath,
        bytes: canonicalDesignBytes(entry.target, entry.evaluate()),
      })),
    currentBases: captureBases,
  });
  const derived: Set<string> = new Set(props.entries.map((entry: IAutoMovieDesignProducerEntry): string => entry.target));
  const orphans: string[] = props.resident
    .filter((record: { target: string; recordPath: string; value: unknown }): boolean => derived.has(record.target) === false)
    .map((record: { target: string; recordPath: string; value: unknown }): string => `  ${record.recordPath}  (${record.target})`)
    .sort(compareCodeUnits);
  if (orphans.length !== 0)
    throw new AutoMovieDesignDerivationError(
      "design-derivation-orphan-record",
      [
        `${orphans.length} resident design record(s) are derived by no producer entry:`,
        ...orphans,
        "",
        "Derive each record from its current owner or delete the named file. No design record was published.",
      ].join("\n"),
    );
  const residentByTarget: Map<string, { target: string; recordPath: string; value: unknown }> = new Map(
    props.resident.map((record: { target: string; recordPath: string; value: unknown }): [string, { target: string; recordPath: string; value: unknown }] => [record.target, record]),
  );
  const outcomes: IAutoMovieDesignDerivationOutcome[] = props.entries.map(
    (entry: IAutoMovieDesignProducerEntry): IAutoMovieDesignDerivationOutcome => {
      const bytes: Buffer = Buffer.from(candidate.outputs.get(entry.recordPath)!);
      const current: { target: string; recordPath: string; value: unknown } | undefined = residentByTarget.get(entry.target);
      if (
        current !== undefined &&
        Buffer.from(canonicalDesignBytes(entry.target, current.value)).equals(
          bytes,
        )
      )
        return {
          target: entry.target,
          recordPath: entry.recordPath,
          state: "unchanged",
        };
      const output: IAutoMovieDesignMutationOutput = entry.store(
        parseAutoMovieStructuredJson({ record: "design-record", bytes }),
      );
      if (output.accepted === false)
        throw new AutoMovieDesignDerivationError(
          "design-derivation-publication-failed",
          `Design target "${entry.target}" was refused by the project store: ${output.diagnostics
            .map((diagnostic: IAutoMovieDesignMutationOutput["diagnostics"][number]): string => diagnostic.message)
            .join(" ")}`,
        );
      return {
        target: entry.target,
        recordPath: entry.recordPath,
        state: current === undefined ? "created" : "updated",
      };
    },
  );
  return { manifest: candidate.manifest, outcomes };
}
