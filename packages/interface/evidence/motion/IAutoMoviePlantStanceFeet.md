# src/motion/IAutoMoviePlantStanceFeet.ts#IAutoMoviePlantStanceFeet

## @evidence contracts/development/common.md#meaningful-documentation

Detection and IK share the skeleton, clinical axes and rest frames; ground and tolerance are model metres and sampleRate is samples per second. plantStanceFeet admits its numerical controls, but ROM or reach limits can leave residual contact error.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

This namespace groups the IAutoMoviePlantStanceFeet contracts used by packages/engine/src/motion/plantStanceFeet.ts; each nested declaration retains its own shape and domain constraints, without an implementation-package dependency.

## @evidence contracts/development/design.md#principled-representation

Detection and IK share the skeleton, clinical axes and rest frames; ground and tolerance are model metres and sampleRate is samples per second. plantStanceFeet admits its numerical controls, but ROM or reach limits can leave residual contact error. The namespace groups these type contracts without implementing the operation.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The canonical IAutoMoviePlantStanceFeet contract belongs to interface; packages/engine/src/motion/plantStanceFeet.ts uses its nested records and callbacks. Runtime computation remains with those consumers.

# src/motion/IAutoMoviePlantStanceFeet.ts#IAutoMoviePlantStanceFeet.IProps

## @evidence contracts/development/common.md#meaningful-documentation

Detection and IK share the skeleton, clinical axes and rest frames; ground and tolerance are model metres and sampleRate is samples per second. plantStanceFeet admits its numerical controls, but ROM or reach limits can leave residual contact error.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

IAutoMoviePlantStanceFeet.IProps keeps the operation's declared data fields separate from its implementation. The declared structural types do not certify the documented numerical or semantic preconditions.

## @evidence contracts/development/design.md#principled-representation

Detection and IK share the skeleton, clinical axes and rest frames; ground and tolerance are model metres and sampleRate is samples per second. plantStanceFeet admits its numerical controls, but ROM or reach limits can leave residual contact error. Required members and referenced canonical contracts establish the structural shape; numeric and cross-field constraints remain runtime obligations.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The canonical IAutoMoviePlantStanceFeet.IProps contract belongs to interface; packages/engine/src/motion/plantStanceFeet.ts uses this boundary. Runtime computation remains with those consumers.
