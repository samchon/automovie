/**
 * How one clinical axis relates to a rig's rest pose: a pose angle `r`
 * (rest-relative, what the engine articulates) maps to the clinical angle the
 * ROM table is written in as `clinical = sign·r + neutral`. `sign` mirrors an
 * axis whose positive direction is flipped per side (a right arm abducts with
 * negative rotation in the rig); `neutral` is the clinical angle the rig sits
 * at when at rest (a T-pose arm is already ~90° abducted).
 */
export interface IAutoMovieAxisFrame {
  /** Axis direction relative to the clinical convention. */
  sign: 1 | -1;
  /** Clinical angle represented by the rig's rest orientation. */
  neutral: number;
}
