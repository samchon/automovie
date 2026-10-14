import { TestValidator } from "@nestia/e2e";
import type { IAutoMovieBuildProjectOutput } from "@automovie/interface";
import type { ISourceStatusSnapshot } from "./sourceStatus/ISourceStatusSnapshot";

import {
  SCREENPLAY_DOCUMENT,
  createSourceStatusWorld,
  runsPerCall,
  textDigest,
} from "./sourceStatusFixtures";

/** Gate runs at two boundaries after one arrangement applied to a fresh world. */
function runsAfter(
  arrange: (world: ReturnType<typeof createSourceStatusWorld>) => void,
): number[] {
  const world: ReturnType<typeof createSourceStatusWorld> = createSourceStatusWorld();
  arrange(world);
  return runsPerCall(world, world.status(), 2).runs;
}

/**
 * A success is reused only when it is provably the answer for one snapshot.
 *
 * The gate reads its inputs at different moments of one run, and a concurrent
 * edit can land between them. The snapshot read before the run and the one read
 * after it must agree on every input except documents, every document the run
 * read must still read the same afterwards, and the answer must name the same
 * revision and input identity as that snapshot, which the resident generated
 * manifest must record too. Otherwise the success may describe a state that
 * never existed at once, so it is returned but not reused.
 *
 * Scenarios:
 *
 * 1. A run with no concurrent edit is reused at the next boundary.
 * 2. A screenplay index, generated output or revision that moves after the gate
 *    answered is not reused, and neither is an answer whose later snapshot
 *    cannot be read.
 * 3. A document edited after the gate read it is not reused, and neither is a
 *    document the gate read twice with different text even when it is restored
 *    before the run ends.
 * 4. An answer whose revision or input fingerprint differs from the snapshot read
 *    after it is not reused, and neither is a snapshot whose generated manifest
 *    records another compile's fingerprint.
 *
 * @evidence contracts/testing.md#behavioral-verification Runs the maintained retention closure with the existing acquisition/evaluation world, observing exact per-call gate counts. An unchanged run gives [1,0], while each arranged input/read/output mismatch gives [1,1], catching reuse of an unproved success without requiring the returned success itself to be rejected.
 * @evidence contracts/testing.md#independent-expectations Literal run-count sequences follow the retention contract: one initial evaluation and either reuse or reevaluation at the second query. Explicit text/revision/generated changes and authored conflicting fingerprints establish causes independently of retention output; the world models snapshot/gate ports rather than the native compiler.
 * @evidence contracts/testing.md#distinguishing-cases Retains unchanged control, screenplay/generated/revision movement after answering, unavailable later snapshot, document movement after reading, repeated distinct document reads restored before completion, wrong answer revision/fingerprint and wrong generated fingerprint. Arbitrary unobserved changed-and-restored inputs remain outside finite snapshot proof; refusal and steady-state retention have separate units.
 * @evidence contracts/testing.md#execution-ownership The named test_production_source_status_race owns four synchronous portable groups; every runsAfter call creates a fresh mutable world and invokes its actual maintained retention owner twice. Hooks arrange deterministic read boundaries without real concurrency, filesystem, authored-source execution, process or renderer startup.
 */
export function test_production_source_status_race(): void {
  TestValidator.equals(
    "a run with no concurrent edit is reused",
    runsAfter((): void => undefined),
    [1, 0],
  );

  TestValidator.equals(
    "inputs that move while the gate runs block reuse",
    {
      screenplay: runsAfter((world: ReturnType<typeof createSourceStatusWorld>): void => {
        world.hooks.afterAnswer = (): void => {
          world.state.screenplay = "treatment and scene index v2";
          world.hooks.afterAnswer = (): void => undefined;
        };
      }),
      generated: runsAfter((world: ReturnType<typeof createSourceStatusWorld>): void => {
        world.hooks.afterAnswer = (): void => {
          world.state.generated = "compiled by a concurrent run";
          world.hooks.afterAnswer = (): void => undefined;
        };
      }),
      revision: runsAfter((world: ReturnType<typeof createSourceStatusWorld>): void => {
        world.hooks.afterAnswer = (): void => {
          world.state.revision += 1;
          world.hooks.afterAnswer = (): void => undefined;
        };
      }),
      unreadableAfter: runsAfter((world: ReturnType<typeof createSourceStatusWorld>): void => {
        world.hooks.afterAnswer = (): void => {
          world.state.incomplete = true;
          world.hooks.afterAnswer = (): void => undefined;
          world.hooks.beforeRead = (): void => {
            world.state.incomplete = false;
          };
        };
      }),
    },
    {
      screenplay: [1, 1],
      generated: [1, 1],
      revision: [1, 1],
      unreadableAfter: [1, 1],
    },
  );

  TestValidator.equals(
    "a document that moved around the gate's read blocks reuse",
    {
      editedAfterRead: runsAfter((world: ReturnType<typeof createSourceStatusWorld>): void => {
        world.hooks.afterRead = (): void => {
          world.state.documents.set(SCREENPLAY_DOCUMENT, "EXT. PIER - DAWN");
          world.hooks.afterRead = (): void => undefined;
        };
      }),
      readTwiceDifferently: runsAfter((world: ReturnType<typeof createSourceStatusWorld>): void => {
        const original: string | null = world.state.documents.get(SCREENPLAY_DOCUMENT)!;
        world.state.read = [SCREENPLAY_DOCUMENT, SCREENPLAY_DOCUMENT];
        world.hooks.read = (index: number): void => {
          if (index === 1)
            world.state.documents.set(SCREENPLAY_DOCUMENT, "EXT. PIER - DAWN");
        };
        world.hooks.afterRead = (): void => {
          world.state.documents.set(SCREENPLAY_DOCUMENT, original);
          world.hooks.read = (): void => undefined;
          world.hooks.afterRead = (): void => undefined;
        };
      }),
    },
    { editedAfterRead: [1, 1], readTwiceDifferently: [1, 1] },
  );

  TestValidator.equals(
    "an answer that names another snapshot is not reused",
    {
      revision: runsAfter((world: ReturnType<typeof createSourceStatusWorld>): void => {
        world.hooks.output = (output: IAutoMovieBuildProjectOutput): void => {
          output.revision -= 1;
        };
      }),
      inputFingerprint: runsAfter((world: ReturnType<typeof createSourceStatusWorld>): void => {
        world.hooks.output = (output: IAutoMovieBuildProjectOutput): void => {
          output.builder.inputFingerprint = textDigest("initial evidence");
        };
      }),
      generatedManifest: runsAfter((world: ReturnType<typeof createSourceStatusWorld>): void => {
        world.hooks.snapshot = (snapshot: ISourceStatusSnapshot): void => {
          snapshot.generated.inputFingerprint = textDigest("another compile");
        };
      }),
    },
    { revision: [1, 1], inputFingerprint: [1, 1], generatedManifest: [1, 1] },
  );
}
