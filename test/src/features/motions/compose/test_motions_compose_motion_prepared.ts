import { TestValidator } from "@nestia/e2e";

import { motionPrepared } from "../../../../../packages/motions/src/compose/internal/motionPrepared";
import { throwsError } from "../../internal/throwsError";

/** A built value: the count of builds when it was made. */
interface IBuilt {
  /** The build's ordinal. */
  ordinal: number;
}

/**
 * `motionPrepared` holds a value a plan solves when it is prepared: cold reads
 * rebuild outside a stable evaluation. A stable evaluation reuses a completed
 * provisional build until its inputs change. A preparation commits a fresh
 * value, and a clear makes the next read provisional again.
 *
 * Scenarios:
 *
 * 1. Two reads before preparation build twice and keep neither.
 * 2. A preparation builds once; reads then return that very value.
 * 3. A clear returns reads to building; the next preparation builds anew.
 * 4. A build that reads its own value back throws the re-entry error.
 * 5. One stable evaluation shares a completed read and releases it on exit.
 * 6. Nested or invalidated views build from their own inputs.
 * 7. A failed build publishes nothing and can retry immediately.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names cold, provisional, committed and failed reads, plus scope exit and input changes.
 * @evidence contracts/development/testing.md#behavioral-verification Calls the value reader and preparation scope with an in-memory builder whose ordinal is observable.
 * @evidence contracts/development/testing.md#independent-expectations Counts exact builds from the declared calls and checks identity separately from the changing input.
 */
export function test_motions_compose_motion_prepared(): void {
  let builds: number = 0;
  const value: motionPrepared.IValue<IBuilt> = motionPrepared(
    (): IBuilt => ({ ordinal: ++builds }),
  );

  // 1. Cold reads.
  TestValidator.predicate(
    "cold reads build afresh",
    value.read().ordinal === 1 && value.read().ordinal === 2,
  );

  // 2. Prepared.
  const prepared: IBuilt = value.prepare();
  TestValidator.predicate(
    "reads return the prepared value",
    prepared.ordinal === 3 &&
      value.read() === prepared &&
      value.read() === prepared &&
      builds === 3,
  );

  // 3. Cleared.
  value.clear();
  TestValidator.predicate(
    "a clear builds again",
    value.read().ordinal === 4 && value.prepare().ordinal === 5,
  );

  // 4. Re-entry.
  const recursive: motionPrepared.IValue<IBuilt> = motionPrepared(
    (): IBuilt => recursive.read(),
    (): Error => new Error("read back while it is being built"),
  );
  TestValidator.predicate(
    "a build that reads itself throws",
    motionPrepared.evaluate(
      (): boolean => throwsError((): IBuilt => recursive.read()),
      true,
    ),
  );

  motionPrepared.evaluate((): void => {
    const first: IBuilt = value.read();
    TestValidator.equals(
      "the committed build remains current",
      first.ordinal,
      5,
    );
    value.clear();
    const provisional: IBuilt = value.read();
    TestValidator.predicate(
      "stable reads share the provisional value",
      provisional.ordinal === 6 && value.read() === provisional,
    );
  }, true);
  TestValidator.equals(
    "scope exit releases its value",
    value.read().ordinal,
    7,
  );

  let current: string = "outer";
  const observed: motionPrepared.IValue<string> = motionPrepared(
    (): string => current,
  );
  motionPrepared.evaluate((): void => {
    TestValidator.equals("outer value", observed.read(), "outer");
    current = "nested";
    TestValidator.equals(
      "nested view",
      motionPrepared.branch((): string => observed.read()),
      "nested",
    );
    current = "changed";
    TestValidator.equals(
      "the outer scope starts fresh",
      observed.read(),
      "changed",
    );
    current = "invalidated";
    motionPrepared.invalidate();
    TestValidator.equals("changed bound input", observed.read(), "invalidated");
  }, true);

  let attempts: number = 0;
  const retry: motionPrepared.IValue<number> = motionPrepared((): number => {
    if (++attempts === 1) throw new Error("first build");
    return attempts;
  });
  motionPrepared.evaluate((): void => {
    TestValidator.predicate(
      "the first build fails",
      throwsError(() => retry.read()),
    );
    TestValidator.equals(
      "retry is shared only after success",
      [retry.read(), retry.read()],
      [2, 2],
    );
  }, true);
}
