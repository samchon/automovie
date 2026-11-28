# src/construction/IAutoMovieConstructionPortBand.ts#IAutoMovieConstructionPortBand.ISide

## @evidence contracts/development/common.md#meaningful-documentation

The comment names the geometry, rail law and sign needed to read the kept part.

## @evidence contracts/development/design.md#principled-representation

PortBand reads the rail at the correspondence's child phase and evaluates the actual child surface on its retained side. The rail's derivatives supply the coordinate chain rule.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The side shares the actual surface and scalar rail with the seam readers. The band owns blending and chart conversion.

# src/construction/IAutoMovieConstructionPortBand.ts#IAutoMovieConstructionPortBand.ISide.surface

## @evidence contracts/development/common.md#meaningful-documentation

The comment states the world source and units.

# src/construction/IAutoMovieConstructionPortBand.ts#IAutoMovieConstructionPortBand.ISide.rail

## @evidence contracts/development/common.md#meaningful-documentation

The comment identifies the scalar output, phase units and required derivative capability.

# src/construction/IAutoMovieConstructionPortBand.ts#IAutoMovieConstructionPortBand.ISide.into

## @evidence contracts/development/common.md#meaningful-documentation

The comment identifies which direction leaves the rail toward retained geometry.

# src/construction/IAutoMovieConstructionPortBand.ts#IAutoMovieConstructionPortBand.IInput

## @evidence contracts/development/common.md#meaningful-documentation

The comment identifies original geometry ownership, column inputs and transverse units.

## @evidence contracts/development/design.md#principled-representation

PortBand.create derives interpolated cross speeds and its child phase map, checks their monotonicity and whole-span source reach, then blends actual source fields with flat endpoint weights and their derivatives.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The input reuses original surface, curve and scalar fields. Column controls select reach and correspondence while the exact band composes the actual seams.

# src/construction/IAutoMovieConstructionPortBand.ts#IAutoMovieConstructionPortBand.IInput.name

## @evidence contracts/development/common.md#meaningful-documentation

The comment identifies the realized output identity.

# src/construction/IAutoMovieConstructionPortBand.ts#IAutoMovieConstructionPortBand.IInput.host

## @evidence contracts/development/common.md#meaningful-documentation

The comment identifies the surface evaluated at the host boundary and band interior.

# src/construction/IAutoMovieConstructionPortBand.ts#IAutoMovieConstructionPortBand.IInput.curve

## @evidence contracts/development/common.md#meaningful-documentation

The comment identifies the shared geometry used for the first seam.

# src/construction/IAutoMovieConstructionPortBand.ts#IAutoMovieConstructionPortBand.IInput.child

## @evidence contracts/development/common.md#meaningful-documentation

The comment identifies the owner of the opposite seam.

# src/construction/IAutoMovieConstructionPortBand.ts#IAutoMovieConstructionPortBand.IInput.childPhases

## @evidence contracts/development/common.md#meaningful-documentation

The comment identifies correspondence samples, units and order.

# src/construction/IAutoMovieConstructionPortBand.ts#IAutoMovieConstructionPortBand.IInput.field

## @evidence contracts/development/common.md#meaningful-documentation

The comment identifies the observed source of each band's ribbon factor.

# src/construction/IAutoMovieConstructionPortBand.ts#IAutoMovieConstructionPortBand.IInput.length

## @evidence contracts/development/common.md#meaningful-documentation

The comment specifies transverse limits and end assignment.

# src/construction/IAutoMovieConstructionPortBand.ts#IAutoMovieConstructionPortBand.IInput.orientation

## @evidence contracts/development/common.md#meaningful-documentation

The comment identifies the orientation rule reused by the exact surface.
