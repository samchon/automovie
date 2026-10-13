import { IAutoMovieBlockingActor } from "./IAutoMovieBlockingActor";
import { IAutoMovieBlockingCamera } from "./IAutoMovieBlockingCamera";
import { IAutoMovieBlockingCoverage } from "./IAutoMovieBlockingCoverage";

/**
 * Models one shot's intent before dense motion is synthesized.
 *
 * The engine checks this plan against script, stage, prior beat state and the
 * final action program. Prose explains craft; typed anchors and camera fields
 * carry the facts that can be checked deterministically.
 */
export interface IAutoMovieBlocking {
  /** Script beat identity realized by this plan. */
  beat: string;

  /** Dramatic purpose used by later visual review. */
  analysis: string;

  /** Why the chosen placement, coverage and timing serve that purpose. */
  rationale: string;

  /** Actor-local intent and optional causal timing anchors. */
  actors: IAutoMovieBlockingActor[];

  /** Hero camera coverage the action program must realize. */
  camera: IAutoMovieBlockingCamera;

  /** Additional independently renderable camera takes. */
  coverage?: IAutoMovieBlockingCoverage[];

  /** Positive shot-local duration in seconds. */
  duration: number;
}
