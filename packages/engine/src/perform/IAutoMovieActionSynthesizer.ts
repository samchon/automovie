import {
  IAutoMovieActionCall,
  IAutoMovieBeatEndState,
  IAutoMovieMotion,
} from "@automovie/interface";

/**
 * The injected content callback that returns one local-time motion cycle for an action and actor, or null when unsupported. Optional verified previous beat state lets the implementation resume authored simulation facts. A thrown synthesis error propagates to the caller.
 *
 * @evidence contracts/common.md#principled-implementation Separates per-action rig-specific content generation from compilePerformance's repeat, placement, masking and layering; returned clips must be admitted and compatible with the actor skeleton.
 * @evidence contracts/common.md#clear-and-simple-design One callable seam supplies content without embedding an asset loader, physics host or timeline policy in the compiler.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Null explicitly means no clip; the interface does not invent content for an unsupported verb or promise that every declared verb has a reference implementation.
 * @evidence contracts/common.md#meaningful-documentation Documents cycle-local seconds, actor identity, prior-state optionality, null and exception effects.
 * @evidence contracts/performance.md#efficient-algorithms The type performs no work; callback cost depends on its actual synthesis implementation and is paid once per action/actor by compilePerformance.
 * @evidence contracts/performance.md#reuse-equivalent-work The compiler consumes the callback result for repeat expansion instead of calling it once per repeated cycle; cross-action sharing belongs to implementations with a proven equivalence key.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The host owns the callback and any captured asset state; this callable type introduces no resource lifecycle, and returned clip ownership passes to its caller.
 */
export type IAutoMovieActionSynthesizer = (
  action: IAutoMovieActionCall,
  actor: string,
  /**
   * Prior verified beat state; custom synthesizers may resume its simulation
   * facts.
   */
  previous?: IAutoMovieBeatEndState | null,
) => IAutoMovieMotion | null;
