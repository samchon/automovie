# src/geometry/construction/AutoMovieLoftSectionLegacy.ts#AutoMovieLoftSectionLegacy.prepare

## @evidence contracts/development/implementation.md#principled-implementation

Uses the same bracket, complete endpoint arrays and declared physical/pole weights as the existing coefficient readers.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One source lookup precedes the required one or three row combinations.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Refuses unsupported mixed-boundary bases; order0 never asks an unavailable physical derivative map for order1/2.

## @evidence contracts/development/common.md#meaningful-documentation

Coefficient rows use local mm and actual physical station derivatives.

## @evidence contracts/development/implementation.md#efficient-algorithms

O(log L) bracketing and O(N) output per requested derivative order, plus explicit source validation.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Endpoint controls and the source coordinate are shared by all prepared rows.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns owned rows without retaining the chain globally.

# src/geometry/construction/AutoMovieLoftSectionLegacy.ts#AutoMovieLoftSectionLegacy.phase

## @evidence contracts/development/implementation.md#principled-implementation

Differentiates the same periodic spline value row analytically in phase.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One spline jet supplies exactly the phase-only tuple.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Requires no physical station derivative and uses no finite difference.

## @evidence contracts/development/common.md#meaningful-documentation

Returns local value, first and second phase vectors in mm/radian units.

## @evidence contracts/development/implementation.md#efficient-algorithms

Reads the periodic cubic's fixed local support once.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Shares the basis evaluation between value and both phase derivatives.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns three fresh local vectors and retains no output.

# src/geometry/construction/AutoMovieLoftSectionLegacy.ts#AutoMovieLoftSectionLegacy.jet

## @evidence contracts/development/implementation.md#principled-implementation

Value/phase partials read row0, s and sphi read row1, and ss reads row2 of the same coefficient generating function.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Extracts only six required total-order-two vectors.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A value-only prepared field is refused rather than promoted to a false physical jet.

## @evidence contracts/development/common.md#meaningful-documentation

Physical station uses mm; phase uses the actual spline correspondence radians.

## @evidence contracts/development/implementation.md#efficient-algorithms

Three local periodic spline evaluations have constant phase support.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses prepared actual station rows and the value/phase result.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns fresh required vectors; unused higher derivative components are neither required finite nor exposed.

# src/geometry/construction/AutoMovieLoftSectionLegacy.ts#AutoMovieLoftSectionLegacy.extend

## @evidence contracts/development/implementation.md#principled-implementation

Each full basis coefficient is defined by c0+d*c1+d*d*c2/2, with its actual derivative rows, so all phase derivatives remain derivatives of a real generating function.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One polynomial extension in coefficient space supplies value-only or physical source2 rows.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Does not call the host outside its domain or invent missing native Cartesian higher derivatives.

## @evidence contracts/development/common.md#meaningful-documentation

This is an explicitly new boundary extension law, not a claim of original host fidelity outside its domain.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear work in complete endpoint coefficient rows per station; later phase reads retain local support.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The actual endpoint rows serve every displacement in the caller-owned boundary definition.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns one or three fresh rows without a cache or host reference.
