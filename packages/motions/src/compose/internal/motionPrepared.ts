/*
 * A value a plan solves when it is prepared
 * (`IAutoMovieMotionHumanActionPlan.prepare`): the prepare-time geometry of a
 * law whose shape reads what the performance resolves around it (a partner as
 * shown, a committed stop).
 *
 * Before the plan is prepared, while the performance still places actions, a
 * read builds the value from what is placed so far. A stable evaluation can
 * reuse its completed provisional values. Once prepared, every read returns
 * the value `prepare` solved. A change to a bound input clears the value.
 * Parameter build: Builds the value from what the performance holds now.
 * Parameter reentry: Makes the error a read inside its own build throws (the value
 * read back while it is being built), if the build can recurse.
 * Returns: The value's reader.
 */
export function motionPrepared<T>(
  build: () => T,
  reentry?: () => Error,
): motionPrepared.IValue<T> {
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
    read: (): T => solved ?? motionPrepared.provisional(make),
    prepare: (): T => {
      solved = undefined;
      motionPrepared.invalidate();
      try {
        const value: T = make();
        solved = value;
        return value;
      } finally {
        motionPrepared.invalidate();
      }
    },
    clear: (): void => {
      solved = undefined;
      motionPrepared.invalidate();
    },
  };
}

/*
 * Companion types of motionPrepared.
 */
export namespace motionPrepared {
  /* The completed geometry of the active synchronous evaluation. */
  let values: Map<() => unknown, unknown> | undefined;

  const demands: WeakMap<object, (seconds: number) => boolean> = new WeakMap();

  /* Register when this plan's displayed posture first needs preparation. */
  export function onDemand(
    plan: object,
    needs: (seconds: number) => boolean,
  ): void {
    demands.set(plan, needs);
  }

  /* Untagged plans keep their ordinary readiness at entry. */
  export function needed(plan: object, seconds: number): boolean {
    return demands.get(plan)?.(seconds) ?? true;
  }

  /* Evaluate a stable view. A nested view can change what its caller sees. */
  export function evaluate<T>(read: () => T, stable: boolean): T {
    const outer: boolean = values !== undefined;
    values = stable ? new Map() : undefined;
    try {
      return read();
    } finally {
      values = outer ? new Map() : undefined;
    }
  }

  /* Give a changed view its own scope when evaluation is already active. */
  export function branch<T>(read: () => T): T {
    return values === undefined ? read() : evaluate(read, true);
  }

  /* Release provisional values when a placement, stop or solve changes them. */
  export function invalidate(): void {
    if (values !== undefined) values = new Map();
  }

  /* A builder is unique to its value. Failed or changed reads publish nothing. */
  export function provisional<T>(build: () => T): T {
    const observed: typeof values = values;
    if (observed?.has(build) === true) return observed.get(build) as T;
    const built: T = build();
    if (observed === values) observed?.set(build, built);
    return built;
  }

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
