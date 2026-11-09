import {
  IAutoMovieActionCall,
  IAutoMovieBeatEndState,
  IAutoMovieMotion,
} from "@automovie/interface";

/**
 * The injected content callback that returns one local-time motion cycle for an action and actor, or null when unsupported. Optional verified previous beat state lets the implementation resume authored simulation facts. A thrown synthesis error propagates to the caller.
 *
 * @evidence contracts/development/design.md#principled-representation Separates per-action rig-specific content generation from compilePerformance's repeat, placement, masking and layering; returned clips must be admitted and compatible with the actor skeleton.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One callable seam supplies content without embedding an asset loader, physics host or timeline policy in the compiler.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Null explicitly means no clip; the interface does not invent content for an unsupported verb or promise that every declared verb has a reference implementation.
 * @evidence contracts/development/common.md#meaningful-documentation Documents cycle-local seconds, actor identity, prior-state optionality, null and exception effects.
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
