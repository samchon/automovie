import type { IAutoMovieHumanBodyLinearRgb } from "./IAutoMovieHumanBodyLinearRgb";

/**
 * The existing colour and roughness overrides for one source material.
 * Omitted properties retain that material's value; the document keys this
 * record by an existing material ID and admission retains that ownership.
 *
 * @evidence contracts/common.md#principled-implementation Optional linear colour and roughness retain the source material values when absent; document admission checks material identity.
 * @evidence contracts/common.md#clear-and-simple-design The override describes only the two supported material properties.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Keys identify existing basis materials rather than injecting a named consumer material.
 * @evidence contracts/common.md#meaningful-documentation Members state channel ranges and the meaning of omitted overrides.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The material override fields declaration is erased by TypeScript and chooses no runtime algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The material override fields schema coordinates no requests or cached computations.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The material override fields type acquires no handles, tasks or retained storage.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanBodyMaterialOverride {
  /** Optional linear RGB colour, each component in [0,1]. */
  color?: IAutoMovieHumanBodyLinearRgb;

  /** Optional surface roughness, dimensionless in [0,1]. */
  roughness?: number;
}
