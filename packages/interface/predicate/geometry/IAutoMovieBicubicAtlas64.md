# src/geometry/IAutoMovieBicubicAtlas64.ts#IAutoMovieBicubicAtlas64.Corner.owner

## @evidence contracts/development/common.md#meaningful-documentation

The field points to the patch and unit corner chosen by registry construction and identifies the first retained incident.

# src/geometry/IAutoMovieBicubicAtlas64.ts#IAutoMovieBicubicAtlas64.ICornerOwner

## @evidence contracts/development/common.md#meaningful-documentation

The declaration states deterministic patch selection, the zero-based ordinal, and the exact unit U and V corner choices.

## @evidence contracts/development/design.md#principled-representation

The corner registry retains an original patch ordinal and its 0-or-1 coordinates for deterministic shared coefficient evaluation.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The owner address contains only the patch and two chart coordinates. Shared coefficients and later render vertex state remain on Corner.

# src/geometry/IAutoMovieBicubicAtlas64.ts#IAutoMovieBicubicAtlas64.ICornerOwner.patch

## @evidence contracts/development/common.md#meaningful-documentation

The ordinal addresses the original input patch chosen by the registry.

# src/geometry/IAutoMovieBicubicAtlas64.ts#IAutoMovieBicubicAtlas64.ICornerOwner.u

## @evidence contracts/development/common.md#meaningful-documentation

The normalized U member selects the low or high corner endpoint.

# src/geometry/IAutoMovieBicubicAtlas64.ts#IAutoMovieBicubicAtlas64.ICornerOwner.v

## @evidence contracts/development/common.md#meaningful-documentation

The normalized V member selects the low or high corner endpoint.
