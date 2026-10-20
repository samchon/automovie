import { IAutoMovieHumanSurfaceEnvelope } from "./IAutoMovieHumanSurfaceEnvelope";

/** Independent section observations along one leg. */
export interface IAutoMovieHumanSurfaceLeg {
  /** Mid-thigh cut between the actual hip and knee centres. */
  thigh?: IAutoMovieHumanSurfaceEnvelope;

  /** Knee-centre section. */
  knee?: IAutoMovieHumanSurfaceEnvelope;

  /** Calf support at one quarter of the knee-to-ankle chord. */
  calf?: IAutoMovieHumanSurfaceEnvelope;

  /** Ankle cut at the actual foot joint. */
  ankle?: IAutoMovieHumanSurfaceEnvelope;
}
