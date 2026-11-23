# src/motion/IAutoMoviePreserveRetargetContacts.ts#IAutoMoviePreserveRetargetContacts.IProps

## @evidence contracts/development/common.md#meaningful-documentation

Admitted source and target motions share key times, source contacts are mapped by dimensionless rootScale and residuals are measured in target metres. The retarget pass reports constrained residuals through the supplied collector; it cannot erase source sliding.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

IAutoMoviePreserveRetargetContacts.IProps keeps the operation's declared data fields separate from its implementation. The declared structural types do not certify the documented numerical or semantic preconditions.

## @evidence contracts/development/design.md#principled-representation

Admitted source and target motions share key times, source contacts are mapped by dimensionless rootScale and residuals are measured in target metres. The retarget pass reports constrained residuals through the supplied collector; it cannot erase source sliding. Required members and referenced canonical contracts establish the structural shape; numeric and cross-field constraints remain runtime obligations.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The canonical IAutoMoviePreserveRetargetContacts.IProps contract belongs to interface; packages/engine/src/motion/preserveRetargetContacts.ts uses this boundary. Runtime computation remains with those consumers.
