import { IAutoMovieScript } from "../harness/IAutoMovieScript";
import { IAutoMovieBlocking } from "./IAutoMovieBlocking";
import { IAutoMoviePerformance } from "./IAutoMoviePerformance";
import { IAutoMovieShotActorProgram } from "./IAutoMovieShotActorProgram";
import { IAutoMovieStage } from "./IAutoMovieStage";

/** Context-free shot program returned by a registered source builder. */
export interface IAutoMovieShotProgram {
  /**
   * Runtime facts for every articulated stage actor that performs a verb.
   *
   * Geometry and gait curves remain builder-owned through {@link model}; the
   * source states only the scale-dependent values a generic builder cannot
   * infer without guessing.
   */
  actors: IAutoMovieShotActorProgram[];

  /** Macro treatment containing the registered beat. */
  script: IAutoMovieScript;

  /** Set declaration whose scene id must equal the registration's scene. */
  stage: IAutoMovieStage;

  /** Checked intent that the action program must realize. */
  blocking: IAutoMovieBlocking;

  /** Thin verb program compiled by the engine. */
  performance: IAutoMoviePerformance;

  /** One authoritative sample time for every declared semantic event. */
  eventSamples: Array<{
    /** Event-contract identity. */
    id: string;

    /** Shot-local measurement time in seconds. */
    time: number;
  }>;
}
