/**
 * How one clinical axis relates to a rig's rest pose: a pose angle `r`
 * (rest-relative, what the engine articulates) maps to the clinical angle the
 * ROM table is written in as `clinical = sign·r + neutral`. `sign` mirrors an
 * axis whose positive direction is flipped per side (a right arm abducts with
 * negative rotation in the rig); `neutral` is the clinical angle the rig sits
 * at when at rest (a T-pose arm is already ~90° abducted).
 *
 * @evidence requirements/asset-authoring/rig-and-state.md#asset-rig-basis-controls Defines the affine conversion from rig-relative rotation to one clinical control.
 * @evidence specifications/asset-and-representation/rig-deformation-and-state.md#asset-spec-rig-inputs Makes the rest-frame conversion explicit for an authored joint axis.
 */
export interface IAutoMovieAxisFrame {
  /**
   * Axis direction relative to the clinical convention.
   *
   * @evidence requirements/asset-authoring/rig-and-state.md#asset-rig-basis-controls Defines the polarity of the clinical-to-rig angle conversion.
   * @evidence specifications/asset-and-representation/rig-deformation-and-state.md#asset-spec-rig-inputs Carries the axis-orientation conversion from the declared rest basis.
   */
  sign: 1 | -1;
  /**
   * Clinical angle represented by the rig's rest orientation.
   *
   * @evidence requirements/asset-authoring/rig-and-state.md#asset-rig-basis-controls Declares the semantic control value encoded by the rig's zero articulation.
   * @evidence specifications/asset-and-representation/rig-deformation-and-state.md#asset-spec-rig-inputs Carries the rest-pose offset of the clinical-to-rig conversion.
   */
  neutral: number;
}
