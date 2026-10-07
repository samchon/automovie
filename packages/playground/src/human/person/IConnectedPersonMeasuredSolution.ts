import type { IAutoMovieHumanPersonDocument } from "@automovie/human";

/**
 * A person measurement solved in the measurement worker: the person with the
 * solved body channel, the value its final Float32 skin measures, and whether
 * the target lies within the measurement's source sample.
 *
 * @evidence requirements/actors/body-authoring/contract.md#actor-body-measurements Returns the solved person and the length its final skin actually measures.
 * @evidence specifications/asset-and-representation/body-authoring/contract.md#body-spec-measurements Reports whether the target lies within the measurement's source sample.
 * @author Samchon
 */
export interface IConnectedPersonMeasuredSolution {
  /** The person with the solved body channel; everything else unchanged. */
  document: IAutoMovieHumanPersonDocument;

  /** The value the solved person's final Float32 skin measures, metres. */
  actualMetres: number;

  /** Whether the target lies within the range the measurement's source sample observed. */
  population: "within-source-sample" | "outside-source-sample";
}
