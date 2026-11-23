# src/validation/IAutoMovieValidateTransformScalars.ts#IAutoMovieValidateTransformScalars

## @evidence contracts/development/common.md#meaningful-documentation

Unchecked transform and reporting sink for shared TRS scalar admission. Nested contracts define the relevant units, ownership and failure states.

## @evidence contracts/development/design.md#principled-representation

Unknown ingress and a canonical mutable collector keep raw values separate from admitted TRS semantics.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Model, pose, affordance and artifact gates share the same transform scalar policy.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No normalized output or success brand conceals findings or collector exceptions.

# src/validation/IAutoMovieValidateTransformScalars.ts#IAutoMovieValidateTransformScalars.IProps

## @evidence contracts/development/common.md#meaningful-documentation

Defines admission, independent nested paths, append-only effects, aliasing and exception propagation.

## @evidence contracts/development/design.md#principled-representation

unknown is the untrusted ingress value; admitted translation uses its owning transform frame/length unit, scale is dimensionless and rotation is a dimensionless unit quaternion.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Model, pose, affordance, architecture and artifact validators share this scalar gate and the canonical collector rather than separate TRS rules.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Positive scale excludes collapsed/reflected authored transforms; no normalization, replacement value or caller-specific quaternion tolerance repairs input.
