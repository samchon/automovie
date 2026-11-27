

/** The state {@link physicalGlitchFilter} advances.
 * @see https://github.com/ihmcrobotics/ihmc-open-robotics-software/blob/201903_Stable/ihmc-robotics-toolkit/src/main/java/us/ihmc/robotics/math/filters/GlitchFilteredYoBoolean.java
 */
export namespace AutoMovieEnginePhysicalGlitchFilter {
  // Ported from IHMC Open Robotics Software, tag 201903_Stable (Apache-2.0):
  // ihmc-robotics-toolkit/src/main/java/us/ihmc/robotics/math/filters/
  // GlitchFilteredYoBoolean.java, the constructor's set(false) l.65,
  // set(boolean) l.68-75 and update(boolean) l.77-89; develop moved it, the
  // same, to ihmc-yovariables.

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
  export function advance(input: IInput): AutoMovieEnginePhysicalGlitchFilter.IState {
    const count: number =
      input.value !== input.state.value ? input.state.count + 1 : 0;

    // Reaching the window sets the value, which resets the count (l.68-75).
    return count >= input.window
      ? { value: input.value, count: 0 }
      : { value: input.state.value, count };
  }

  /** Inputs for one controller update. */
  export interface IInput {
    /** Previous controller state. */
    state: Readonly<AutoMovieEnginePhysicalGlitchFilter.IState>;
    /** The new unfiltered Boolean input. */
    value: boolean;
    /** Required consecutive observations. */
    window: number;
  }

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

  /**
   * A reference window in this controller's updates: the reference counts its
   * own controller's updates, so its window lasts `count` times its period;
   * the same time in updates of `dt` is the nearest whole count, at least one,
   * within half an update of the reference's time.
   *
   * @param count The reference's window, updates.
   * @param period The reference controller's period, seconds.
   * @param dt This controller's period, seconds.
   * @returns The window, updates.
   */
  export function ticks(count: number, period: number, dt: number): number {
    return Math.max(1, Math.round((count * period) / dt));
  }
}
