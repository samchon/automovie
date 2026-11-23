# src/motion/IAutoMoviePreserveRetargetContacts.ts#IAutoMoviePreserveRetargetContacts

## @evidence contracts/development/common.md#meaningful-documentation

Admitted source and target motions share key times, source contacts are mapped by dimensionless rootScale and residuals are measured in target metres. The retarget pass reports constrained residuals through the supplied collector; it cannot erase source sliding.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

This namespace groups the IAutoMoviePreserveRetargetContacts contracts used by packages/engine/src/motion/preserveRetargetContacts.ts; each nested declaration retains its own shape and domain constraints, without an implementation-package dependency.

## @evidence contracts/development/design.md#principled-representation

Admitted source and target motions share key times, source contacts are mapped by dimensionless rootScale and residuals are measured in target metres. The retarget pass reports constrained residuals through the supplied collector; it cannot erase source sliding. The namespace groups these type contracts without implementing the operation.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The canonical IAutoMoviePreserveRetargetContacts contract belongs to interface; packages/engine/src/motion/preserveRetargetContacts.ts uses its nested records and callbacks. Runtime computation remains with those consumers.

# src/motion/IAutoMoviePreserveRetargetContacts.ts#IAutoMoviePreserveRetargetContacts.IProps

## @evidence contracts/development/common.md#meaningful-documentation

Admitted source and target motions share key times, source contacts are mapped by dimensionless rootScale and residuals are measured in target metres. The retarget pass reports constrained residuals through the supplied collector; it cannot erase source sliding.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

IAutoMoviePreserveRetargetContacts.IProps keeps the operation's declared data fields separate from its implementation. The declared structural types do not certify the documented numerical or semantic preconditions.

## @evidence contracts/development/design.md#principled-representation

Admitted source and target motions share key times, source contacts are mapped by dimensionless rootScale and residuals are measured in target metres. The retarget pass reports constrained residuals through the supplied collector; it cannot erase source sliding. Required members and referenced canonical contracts establish the structural shape; numeric and cross-field constraints remain runtime obligations.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The canonical IAutoMoviePreserveRetargetContacts.IProps contract belongs to interface; packages/engine/src/motion/preserveRetargetContacts.ts uses this boundary. Runtime computation remains with those consumers.
