# src/geometry/curve/IAutoMoviePchipField64.ts#IAutoMoviePchipField64

## @evidence contracts/development/design.md#principled-representation

Each component uses the same weighted harmonic and endpoint-limited scalar slopes unless explicitly replaced, then the same cubic Hermite power coefficients interpolate its supports and declared first derivatives. Authored slopes do not imply monotonicity.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The coefficient field is separate from AutoMoviePchip64 because vector consumers need coefficient access and polynomial extrapolation rather than the scalar field's closed-domain query policy.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No spatial tangent normalization or anatomical coordinate convention modifies the componentwise interpolation.

## @evidence contracts/development/common.md#meaningful-documentation

States component ordering, derivative units, explicit slope authority, extrapolation and caller responsibility for stable supplied support arrays. Overrides are copied at construction.

# src/geometry/curve/IAutoMoviePchipField64.ts#IAutoMoviePchipField64.IEndpointDerivatives

## @evidence contracts/development/common.md#meaningful-documentation

States derivative units, omitted endpoint behavior, copied ownership and the constructor's row admission.

## @evidence contracts/development/design.md#principled-representation

Independent optional start/end rows describe exactly the endpoint overrides; row width and finiteness depend on the constructed field and are checked there.

## @evidence contracts/development/design.md#minimal-and-owned-surface

AutoMoviePchipField64 consumes these two boundary overrides while its complete-row form remains another construction option.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Supplied slopes retain their magnitudes without spatial normalization; they may overshoot and do not promise the default shape-preserving behavior.

# src/geometry/curve/IAutoMoviePchipField64.ts#IAutoMoviePchipField64.Derivatives

## @evidence contracts/development/common.md#meaningful-documentation

States the two supported input forms, station/component ordering, copied rows and derivative units inherited from the endpoint contract.

## @evidence contracts/development/design.md#principled-representation

Array rows replace every station seed; an endpoint record replaces only its present ends. The constructor checks the station count and all finite component dimensions.

## @evidence contracts/development/design.md#minimal-and-owned-surface

One canonical union describes the existing public constructor's third argument and reuses its endpoint record instead of repeating the inline input shape.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The type preserves readonly inputs and existing numeric admission; it adds no new interpolation branch or implicit conversion.
