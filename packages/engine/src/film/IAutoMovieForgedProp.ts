import { IAutoMovieConstraintViolation, IAutoMoviePropSpec } from "@automovie/interface";

export type IAutoMovieForgedProp =
  | IAutoMovieForgedProp.ISuccess
  | IAutoMovieForgedProp.IFailure;
export namespace IAutoMovieForgedProp {
  /**
   * The prop passed the model and articulation contracts.
   *
   * @evidence requirements/asset-authoring/validation.md#asset-purpose-validation Marks one prop specification admissible only when both its model validation and articulation-purpose checks succeed.
   * @evidence specifications/asset-and-representation/fidelity-and-validation.md#asset-spec-validation-purpose-inputs IAutoMovieForgedProp.ISuccess realizes purpose-driven prop validation: The prop passed the model and articulation contracts.
   */
  export interface ISuccess {
    /**
     * Discriminator.
     *
     * @evidence requirements/asset-authoring/validation.md#asset-purpose-validation The true discriminator admits a prop whose geometry and articulation serve its declared purpose.
     * @evidence specifications/asset-and-representation/fidelity-and-validation.md#asset-spec-validation-purpose-inputs IAutoMovieForgedProp.ISuccess.success marks the prop as fit for its declared staging purpose.
     */
    success: true;

    /**
     * The accepted spec, echoed for the staging join.
     *
     * @evidence requirements/asset-authoring/validation.md#asset-purpose-validation Preserves the accepted prop specification that staging will join to the already validated geometry and semantic controls.
     * @evidence specifications/asset-and-representation/fidelity-and-validation.md#asset-spec-validation-purpose-inputs IAutoMovieForgedProp.ISuccess.prop realizes purpose-driven prop validation: The accepted spec, echoed for the staging join.
     */
    prop: IAutoMoviePropSpec;
  }

  /**
   * The spec broke a contract; every violation listed for the correction round.
   *
   * @evidence requirements/asset-authoring/validation.md#asset-purpose-validation Withholds a prop whose geometry, articulation, or semantic profile cannot serve its authored purpose and carries the correction violations.
   * @evidence specifications/asset-and-representation/fidelity-and-validation.md#asset-spec-validation-purpose-inputs IAutoMovieForgedProp.IFailure realizes purpose-driven prop validation: The spec broke a contract; every violation listed for the correction round.
   */
  export interface IFailure {
    /**
     * Discriminator.
     *
     * @evidence requirements/asset-authoring/validation.md#asset-purpose-validation The false discriminator withholds a purpose-invalid prop from staging and interaction.
     * @evidence specifications/asset-and-representation/fidelity-and-validation.md#asset-spec-validation-purpose-inputs IAutoMovieForgedProp.IFailure.success withholds a purpose-invalid prop from staging.
     */
    success: false;

    /**
     * Every violation found, for the correction round.
     *
     * @evidence requirements/asset-authoring/validation.md#asset-purpose-validation Returns every geometry, articulation, and declared-purpose mismatch for correction before staging.
     * @evidence specifications/asset-and-representation/fidelity-and-validation.md#asset-spec-validation-purpose-inputs IAutoMovieForgedProp.IFailure.violations realizes purpose-driven prop validation: Every violation found, for the correction round.
     */
    violations: IAutoMovieConstraintViolation[];
  }
}
