import type { IAutoMovieMaterialSubstance } from "../material/IAutoMovieMaterialSubstance";

/**
 * Data and callback contracts shared by the ValidateMaterialSubstance
 * operations.
 */
export namespace IAutoMovieValidateMaterialSubstance {
  /**
   * Range-check one substance record.
   *
   * The engine ships no substances, so every value here is the production's own
   * and every measured property is optional. What the engine owns is the
   * refusal: a negative density, an absorption above one, or a vapour
   * resistance below still air are not measurements a later study can use, and
   * a study that silently consumes them reports a number nobody can trace back
   * to a defect.
   *
   * A null property is unmeasured and passes. A present one must be finite and
   * in range: density, specific heat and service life above 0, thermal
   * conductivity at least 0, sound absorption within [0, 1], and vapour
   * resistance at least 1, the factor of still air. The id and classification
   * must be non-blank, and a present name or surface id too. Every finding is
   * returned with a `$input` path; nothing throws, and the surface id is not
   * resolved against any material.
   */
  export type IProps = {
    /** Substance record to range-check. */
    substance: IAutoMovieMaterialSubstance;
  };
}
