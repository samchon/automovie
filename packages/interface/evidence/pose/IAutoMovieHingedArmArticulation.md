# src/pose/IAutoMovieHingedArmArticulation.ts#IAutoMovieHingedArmArticulation.IProps

## @evidence contracts/development/common.md#meaningful-documentation

Separates radian hinge limits, degree swivel, local quaternion scoring and lazy callback lifetime.

## @evidence contracts/development/design.md#principled-representation

Finite coherent rest geometry and ordered at-most-one-turn hinge range are caller premises; degenerate chains return null and invalid continuation tolerance throws.

## @evidence contracts/development/design.md#minimal-and-owned-surface

hingedArmArticulation searches geometry shared with hingedArmSwivel while caller scoring owns clinical decomposition, ROM and effort objectives.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Optional exact and tiebreak callbacks expose bounded scoring work without smuggling a rig policy into the geometric solver.
