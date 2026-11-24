// Ported from IHMC Open Robotics Software, tag 201903_Stable (Apache-2.0):
// ihmc-robotics-toolkit/src/main/java/us/ihmc/robotics/math/filters/
// GlitchFilteredYoBoolean.java, the constructor's set(false) l.65,
// set(boolean) l.68-75 and update(boolean) l.77-89; develop moved it, the
// same, to ihmc-yovariables. See NOTICE.

/**
 * One update of a glitch-filtered boolean: the filtered value changes to its
 * input only once the input has differed from it on `window` successive
 * updates, and a change resets the count. IHMC's controllers filter contact and
 * capture decisions this way (`WrenchBasedFootSwitch`,
 * `PushRecoveryControlModule`, `AngularMomentumIntegrator`).
 *
 * The state is plain data the caller keeps, so a checkpoint resumes the filter
 * exactly; a window of zero or one follows the input at once, as the reference
 * does.
 *
 * @param input The filter's state, this update's input value and the window, a
 *   count of updates.
 * @returns The state after the update, a new one; the input is never written.
 */
export function physicalGlitchFilter(input: {
  state: Readonly<physicalGlitchFilter.IState>;
  value: boolean;
  window: number;
}): physicalGlitchFilter.IState {
  const count: number =
    input.value !== input.state.value ? input.state.count + 1 : 0;

  // Reaching the window sets the value, which resets the count (l.68-75).
  return count >= input.window
    ? { value: input.value, count: 0 }
    : { value: input.state.value, count };
}

/** The state {@link physicalGlitchFilter} advances. */
export namespace physicalGlitchFilter {
  /** A glitch-filtered boolean. */
  export interface IState {
    /** The filtered value. */
    value: boolean;

    /** How many successive updates the input has differed from the value. */
    count: number;
  }

  /**
   * A filter set to a value with its count cleared, as the reference's
   * `set(boolean)` does; a new filter starts false (l.65).
   *
   * @param value The value, false by default.
   * @returns The new state.
   */
  export function set(value: boolean = false): IState {
    return { value, count: 0 };
  }
}
