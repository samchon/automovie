import type { IAutoMovieHumanBodyLinearRgb } from "./IAutoMovieHumanBodyLinearRgb";

/**
 * The existing colour and roughness overrides for one source material.
 * Omitted properties retain that material's value; the document keys this
 * record by an existing material ID and admission retains that ownership.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanBodyMaterialOverride {
  /** Optional linear RGB colour, each component in [0,1]. */
  color?: IAutoMovieHumanBodyLinearRgb;

  /** Optional surface roughness, dimensionless in [0,1]. */
  roughness?: number;
}
