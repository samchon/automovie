import { IAutoMovieConstraintViolation, IAutoMovieModel } from "@automovie/interface";

/**
 * A forged cast: every stand-in rig validated and keyed by the cast node it
 * embodies, ready for the staged scene's `modelRef ?? node` join.
 *
 * @evidence requirements/asset-authoring/validation.md#asset-rig-validation Separates a fully validated node-keyed stand-in set from addressed forge failure before staging can consume any rig.
 * @evidence specifications/asset-and-representation/fidelity-and-validation.md#asset-spec-validation-motion-transitions IAutoMovieForgedCast realizes rig validation for motion transitions: A forged cast: every stand-in rig validated and keyed by the cast node it embodies, ready for the staged scene's `modelRef ?? node` join.
 * @author Samchon
 */
export type IAutoMovieForgedCast =
  | IAutoMovieForgedCast.ISuccess
  | IAutoMovieForgedCast.IFailure;

export namespace IAutoMovieForgedCast {
  /**
   * Every stand-in exists, joins its cast member, and passed validation.
   *
   * @evidence requirements/asset-authoring/validation.md#asset-rig-validation Admits the cast only after every requested stand-in exists, joins its script node, and passes the model rig gate.
   * @evidence specifications/asset-and-representation/fidelity-and-validation.md#asset-spec-validation-motion-transitions IAutoMovieForgedCast.ISuccess realizes rig validation for motion transitions: Every stand-in exists, joins its cast member, and passed validation.
   */
  export interface ISuccess {
    /**
     * Discriminator.
     *
     * @evidence requirements/asset-authoring/validation.md#asset-rig-validation The true discriminator admits a completely validated stand-in cast to staging.
     * @evidence specifications/asset-and-representation/fidelity-and-validation.md#asset-spec-validation-motion-transitions IAutoMovieForgedCast.ISuccess.success marks every stand-in rig as validated for staging and motion.
     */
    success: true;

    /**
     * Validated stand-ins, keyed by cast node id.
     *
     * @evidence requirements/asset-authoring/validation.md#asset-rig-validation Carries only validated models keyed by the cast node identity that staging uses for its model join.
     * @evidence specifications/asset-and-representation/fidelity-and-validation.md#asset-spec-validation-motion-transitions IAutoMovieForgedCast.ISuccess.models realizes rig validation for motion transitions: Validated stand-ins, keyed by cast node id.
     */
    models: Record<string, IAutoMovieModel>;
  }

  /**
   * The forge contradicted the script or a rig failed validation.
   *
   * @evidence requirements/asset-authoring/validation.md#asset-rig-validation Withholds the entire stand-in set when a script join is absent or any forged model violates its rig contract.
   * @evidence specifications/asset-and-representation/fidelity-and-validation.md#asset-spec-validation-motion-transitions IAutoMovieForgedCast.IFailure realizes rig validation for motion transitions: The forge contradicted the script or a rig failed validation.
   */
  export interface IFailure {
    /**
     * Discriminator.
     *
     * @evidence requirements/asset-authoring/validation.md#asset-rig-validation The false discriminator withholds invalid stand-in rigs from staging and motion.
     * @evidence specifications/asset-and-representation/fidelity-and-validation.md#asset-spec-validation-motion-transitions IAutoMovieForgedCast.IFailure.success withholds a cast containing missing or invalid rigs.
     */
    success: false;

    /**
     * Every violation found, for the correction round.
     *
     * @evidence requirements/asset-authoring/validation.md#asset-rig-validation Returns each missing cast join and rig-contract failure at the responsible stand-in path.
     * @evidence specifications/asset-and-representation/fidelity-and-validation.md#asset-spec-validation-motion-transitions IAutoMovieForgedCast.IFailure.violations realizes rig validation for motion transitions: Every violation found, for the correction round.
     */
    violations: IAutoMovieConstraintViolation[];
  }
}
