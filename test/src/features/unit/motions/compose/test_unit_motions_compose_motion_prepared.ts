import { AutoMovieMotionPrepared } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { throwsError } from "../../../internal/throwsError";

/** A built value: the count of builds when it was made. */
interface IBuilt {
  /** The build's ordinal. */
  ordinal: number;
}

/**
 * `AutoMovieMotionPrepared` holds a value a plan solves when it is prepared:
 * before that, each read builds it afresh and keeps nothing; once prepared,
 * reads return the prepared value; a clear drops it until the next
 * preparation.
 *
 * Scenarios:
 *
 * 1. Two reads before preparation build twice and keep neither.
 * 2. A preparation builds once; reads then return that very value.
 * 3. A clear returns reads to building; the next preparation builds anew.
 * 4. A build that reads its own value back throws the re-entry error.
 */
export function test_unit_motions_compose_motion_prepared(): void {
  let builds: number = 0;
  const value: AutoMovieMotionPrepared.IValue<IBuilt> = AutoMovieMotionPrepared(
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
  const recursive: AutoMovieMotionPrepared.IValue<IBuilt> =
    AutoMovieMotionPrepared(
      (): IBuilt => recursive.read(),
      (): Error => new Error("read back while it is being built"),
    );
  TestValidator.predicate(
    "a build that reads itself throws",
    throwsError((): IBuilt => recursive.read()),
  );
}
