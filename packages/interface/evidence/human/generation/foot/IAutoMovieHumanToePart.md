# src/human/generation/foot/IAutoMovieHumanToePart.ts#IAutoMovieHumanToePart

## @evidence contracts/development/common.md#meaningful-documentation

Foot-axis toe originals and shared millimetre coordinate sources, with optional parent-derived vertical laws. Member comments specify the individual units, frames and optional-value meanings.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The namespace groups only IInput, ISource, IDefinition declarations; it adds no runtime state, fixture dispatch or alternate implementation. Each member retains its own concrete data or callable representation.

## @evidence contracts/development/design.md#principled-representation

IInput, ISource, IDefinition separate the declared inputs, results and related quantities. Their numeric domains and geometric consistency remain the Human producers' and engine operators' runtime responsibility; the namespace introduces no additional frame or clock.

## @evidence contracts/development/design.md#minimal-and-owned-surface

AutoMovieHumanToePart exchanges the named IInput, ISource, IDefinition contracts with its Human callers. Interface owns these type declarations without importing that implementation.

# src/human/generation/foot/IAutoMovieHumanToePart.ts#IAutoMovieHumanToePart.IInput

## @evidence contracts/development/common.md#meaningful-documentation

The toe's original point course and foot-axis section laws, calibration mm.

The optional positive and negative transverse half-breadths are authored by the actual adjacent courses at the given side. The same declaration carries their signed range limits through the native source interpolator.

## @evidence contracts/development/design.md#principled-representation `name`: Anatomical source name, toe.left.1 through toe.right.5. `centres`: Named generating points on the plan-affine hidden-start-to-apex course and the declared height source; not measured joints. `apex`: Declared generated skin apex; no further pulp reach is added.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Returned by AutoMovieHumanFootInterim.toes. Read by AutoMovieHumanFootBreadth.measure, AutoMovieHumanToePart.create, AutoMovieHumanToePart.define.

## @evidence contracts/development/design.md#prohibited-design-shortcuts `vertical`: Actual local-parent transfer and one same-clock origin/plantar source; absent only for constant-height analytic fixtures.

# src/human/generation/foot/IAutoMovieHumanToePart.ts#IAutoMovieHumanToePart.ISource

## @evidence contracts/development/common.md#meaningful-documentation

One exact millimetre origin and its canonical metre declaration, before any unit round trip or loft.

## @evidence contracts/development/design.md#principled-representation `origin`: Original coordinate curves; the same mm clock owns this origin and the signed radial curves.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Returned by AutoMovieHumanToePart.source. Also types AutoMovieHumanToePart.declaration.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `origin`; callers supply the complete record.

# src/human/generation/foot/IAutoMovieHumanToePart.ts#IAutoMovieHumanToePart.IDefinition

## @evidence contracts/development/common.md#meaningful-documentation

Final source plus the exact millimetre coordinate owner used by its axis and horizontal metric readers.

## @evidence contracts/development/design.md#principled-representation `origin`: Present on success; absent on an input/axis failure.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Returned by AutoMovieHumanToePart.define.

## @evidence contracts/development/design.md#prohibited-design-shortcuts `origin`: Present on success; absent on an input/axis failure.
