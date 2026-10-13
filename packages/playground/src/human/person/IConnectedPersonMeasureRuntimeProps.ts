import type {
  IAutoMovieHumanPersonBodyView,
  IAutoMovieHumanPersonHeadView,
} from "@automovie/human";

/**
 * Inputs of `createConnectedPersonMeasureRuntime`: the views the resident
 * person worker read once, and its stage signal.
 *
 * @author Samchon
 */
export interface IConnectedPersonMeasureRuntimeProps {
  /** The head partition view, read once by the worker. */
  head: Promise<IAutoMovieHumanPersonHeadView>;

  /** The body partition view, read once by the worker. */
  body: Promise<IAutoMovieHumanPersonBodyView>;

  /** Report a finished stage to the page's progress display. */
  signal: (stage: string) => void;
}
