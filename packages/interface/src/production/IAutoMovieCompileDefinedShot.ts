import type { IAutoMovieDefinedShot } from "../authoring/IAutoMovieDefinedShot";
import type { IAutoMovieEngineShotRuntime } from "./IAutoMovieEngineShotRuntime";

/**
 * Data and callback contracts shared by the CompileDefinedShot operations.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Compile one {@link defineShot} registration into shot source, continuity and a contract realization, or into the diagnostics of the first phase that failed. Member documentation states the supplied records, units and absence meanings used by compileDefinedShot.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Source callbacks are typed against their supplied Context instead of widened casts; compilation admission and diagnostics remain the engine's responsibility.
 * @evidence contracts/development/design.md#principled-representation shot is the registered source, context is its single build call's input and runtime supplies motion, rig, scene and continuity services; generic Context keeps the registration and input types identical.
 * @evidence contracts/development/design.md#minimal-and-owned-surface interface owns IAutoMovieCompileDefinedShot, used by compileDefinedShot. Its IProps members carry this operation's declared inputs or results; imported domain records keep their existing definitions.
 */
export namespace IAutoMovieCompileDefinedShot {
  /**
   * Compile one {@link defineShot} registration into shot source, continuity and a contract realization, or into the diagnostics of the first phase that failed.
   *
   * The phases run in order: registration ids, one synchronous `build` call with `context`, the program held to its registration, the runtime's physics advice, staging, blocking against `runtime.previous`, restaging at the resumed placements, performance, contract realization, and continuity sampling. The builder supplies ordinary code; the engine owns referential integrity, blocking coherence, verb composition, range-of-motion and artifact validation, and continuity. A throw from the builder becomes `builder-failed`, and a throw from any other phase becomes `pipeline-failed` named after the phase that was running, so this boundary never throws.
   *
   * When `runtime.previous` is supplied, each actor it names opens at that beat's position, facing, mount and pose, and the opening snapshot keeps its gait phase, root velocity, foot plants and mount. The runtime's foot plants for a node the performance replanted are replaced by the new ones.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Compile one {@link defineShot} registration into shot source, continuity and a contract realization, or into the diagnostics of the first phase that failed. Member documentation states the supplied records, units and absence meanings used by compileDefinedShot.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Source callbacks are typed against their supplied Context instead of widened casts; compilation admission and diagnostics remain the engine's responsibility.
   * @evidence contracts/development/design.md#principled-representation shot is the registered source, context is its single build call's input and runtime supplies motion, rig, scene and continuity services; generic Context keeps the registration and input types identical.
   * @evidence contracts/development/design.md#minimal-and-owned-surface interface owns IAutoMovieCompileDefinedShot.IProps, used by compileDefinedShot. Its shot, context, runtime members carry this operation's declared inputs or results; imported domain records keep their existing definitions.
   */
  export type IProps<Context> = {
    /** Registered source export, as {@link defineShot} returned it. */
    shot: IAutoMovieDefinedShot<Context>;

    /** Caller-owned data passed to the builder's single call. */
    context: Context;

    /** Host motion, rig, scene and continuity capabilities the phases read. */
    runtime: IAutoMovieEngineShotRuntime;
  };
}
