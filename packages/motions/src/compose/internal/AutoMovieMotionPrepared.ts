/*
 * A value a plan solves when it is prepared
 * (`IAutoMovieMotionHumanActionPlan.prepare`): the prepare-time geometry of a
 * law whose shape reads what the performance resolves around it (a partner as
 * shown, a committed stop).
 *
 * Before the plan is prepared, while the performance still places actions, a
 * read builds the value from what is placed so far and keeps nothing; once
 * prepared, every read returns the value `prepare` solved, so the display reads
 * no build. A change to what the value was solved on (a stop the performance
 * commits) clears it until the next preparation solves it again.
 * Parameter build: Builds the value from what the performance holds now.
 * Parameter reentry: Makes the error a read inside its own build throws (the value
 * read back while it is being built), if the build can recurse.
 * Returns: The value's reader.
 */
export function AutoMovieMotionPrepared<T>(
  build: () => T,
  reentry?: () => Error,
): AutoMovieMotionPrepared.IValue<T> {
  let solved: T | undefined;
  let building: boolean = false;
  const make = (): T => {
    if (building && reentry !== undefined) throw reentry();
    building = true;
    try {
      return build();
    } finally {
      building = false;
    }
  };
  return {
    read: (): T => solved ?? make(),
    prepare: (): T => {
      solved = undefined;
      const value: T = make();
      solved = value;
      return value;
    },
    clear: (): void => {
      solved = undefined;
    },
  };
}

/*
 * Companion types of AutoMovieMotionPrepared.
 */
export namespace AutoMovieMotionPrepared {
  /*
   * A prepared value's reader.
   */
  export interface IValue<T> {
    /*
     * The value: the prepared one, or one built from the performance as placed
     * so far before the plan is prepared.
     * Returns: The value.
     */
    read(): T;

    /*
     * Solve the value, from what the performance holds now.
     * Returns: The value solved.
     */
    prepare(): T;

    /*
     * Clear the prepared value: what it was solved on has changed.
     */
    clear(): void;
  }
}
