import type {
  IAutoMovieHumanPersonBodyView,
  IAutoMovieHumanPersonHeadView,
} from "@automovie/human";

/**
 * Inputs of `createConnectedPersonMeasureRuntime`: the views the resident
 * person worker read once, and its stage signal.
 *
 * @evidence requirements/actors/body-authoring/contract.md#actor-body-editor Hands the measurement runtime the same body view the person preview evaluates.
 * @evidence specifications/asset-and-representation/body-authoring/contract.md#body-spec-editor Shares one read of the source views between preview and measurement.
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-editor Hands the measurement runtime the same head view the person preview evaluates.
 * @author Samchon
 */
export interface IConnectedPersonMeasureRuntimeProps {
  /** The head partition view, read once by the worker. */
  head: Promise<IAutoMovieHumanPersonHeadView>;

  /** The body partition view, read once by the worker. */
  body: Promise<IAutoMovieHumanPersonBodyView>;

  /** Report a finished stage to the page transport's silence deadline. */
  signal: (stage: string) => void;
}
