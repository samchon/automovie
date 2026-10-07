/**
 * Product-neutral metadata for one named scalp or skin appearance trait.
 * Null endpoints mean no numerical bound from the runtime owner. Open bounds
 * are preserved explicitly, and dependent rules remain visible rather than
 * becoming invented universal slider limits. A current value comes from the
 * document reader, never a universal person's anatomical default.
 *
 * @evidence contracts/common.md#principled-implementation Explicit open endpoints and named dependent rules preserve the runtime domain without arbitrary UI bounds.
 * @evidence contracts/common.md#clear-and-simple-design One descriptor type serves scalar and closed-choice styling traits without importing product UI.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The descriptor invents no biological range or current document value.
 * @evidence contracts/common.md#meaningful-documentation States null bounds, dependency and default ownership.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping Metadata names traits rather than parts.
 * @evidenceExclude contracts/modeling.md#parameter-channels The input owners state trait meaning.
 * @evidenceExclude contracts/modeling.md#emitted-geometry Metadata emits no geometry.
 * @evidenceExclude contracts/modeling.md#spatial-conventions Trait units are carried without conversion.
 * @evidenceExclude contracts/modeling.md#shared-boundaries Metadata builds no boundary.
 * @evidenceExclude contracts/modeling.md#rendered-observation Metadata displays no form.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The input owners state authored qualification.
 * @evidenceExclude contracts/anatomy.md#permitted-range Metadata transports numerical admission rather than asserting a physiological interval.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Metadata introduces no new person input.
 * @author Samchon
 */
export interface IAutoMovieHumanFaceStylingDescriptor {
  /** Relative path beneath one population's traits or one named skin area. */
  path: readonly string[];

  /** Human-readable meaning of the control. */
  label: string;

  /** mm, degrees, ratio or choice, with no implicit conversion. */
  unit: string;

  /** Numerical minimum; null means no scalar bound. */
  minimum: number | null;

  /** Numerical maximum; null means no finite upper bound. */
  maximum: number | null;

  /** Whether equality at the numerical minimum is refused. */
  minimumExclusive?: boolean;

  /** Whether equality at the numerical maximum is refused. */
  maximumExclusive?: boolean;

  /** Closed permitted choices for an enum control. */
  choices?: readonly string[];

  /** Runtime dependent condition that a standalone interval cannot express. */
  dependentRule?: string;

  /** Value qualification and supported meaning, shown with the control. */
  qualification: string;
}
