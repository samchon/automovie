import type { IAutoMovieActionCall } from "../harness/IAutoMovieActionCall";
import type { IAutoMovieBeatEndState } from "../harness/IAutoMovieBeatEndState";
import type { IAutoMovieMotion } from "./IAutoMovieMotion";

/**
 * The injected content callback that returns one local-time motion cycle for an
 * action and actor, or null when unsupported. Optional verified previous beat
 * state lets the implementation resume authored simulation facts. A thrown
 * synthesis error propagates to the caller.
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
