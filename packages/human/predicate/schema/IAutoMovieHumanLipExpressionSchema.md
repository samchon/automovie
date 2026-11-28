# src/schema/IAutoMovieHumanLipExpressionSchema.ts#IAutoMovieHumanLipExpressionSchema

## @evidence contracts/development/common.md#meaningful-documentation

The declaration distinguishes optional anatomical side pairs from optional scalar intensities and retains the FACS name of each action.

## @evidence contracts/development/design.md#principled-representation

Each supplied intensity has inclusive [0, 1] bounds. A supplied side-specific value contains both anatomical sides. The polygon renderer checks action overlap with the enclosing expression when it admits named lip fields.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The mouth schema reuses the Interface's named lip actions. The established action list provides the alternate sided representation, and the consuming renderer owns the admitted subset.
