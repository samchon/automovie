# src/geometry/construction/AutoMovieLoftCoefficientSource.ts#AutoMovieLoftCoefficientSource.prepare

## @evidence contracts/development/implementation.md#principled-implementation

Adds zero pole rows and solves a new coefficient natural cubic in the selected common pole coordinate, then converts regular layer jets by both chain-rule orders. The caller supplies axis-centred physical poles, not arbitrary off-axis fan closures.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One preparation returns a new layer table with explicit parameter data and unchanged coefficient values.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Refuses mismatched closure, nonincreasing parameter knots or nonfinite derivatives; no synthetic section, tolerance adjustment or finite pole-station derivative is substituted.

## @evidence contracts/development/common.md#meaningful-documentation

Input parameter and stations use kernel mm; failures return the premise string and do not mutate the input chain.

## @evidence contracts/development/implementation.md#efficient-algorithms

O(LW) natural solves and conversions allocate only retained derivative rows, two cap rows and linear scratch.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Curvature results feed parameter slopes, regular station derivatives and both virtual cap endpoints once.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Failure releases local tables; success owns new derivative arrays and shares original coefficient/frame fields plus fixed pole records.

# src/geometry/construction/AutoMovieLoftCoefficientSource.ts#AutoMovieLoftCoefficientSource.controls

## @evidence contracts/development/implementation.md#principled-implementation

Reads actual principal values with their parameter jets; an owned cap uses its virtual pole row before the first/after the last surviving section.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One binary bracket and shared-map decision prepare endpoints for all phase controls.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Invalid present metadata throws; only missing/different maps or a genuinely unowned range return null for the caller's existing path.

## @evidence contracts/development/common.md#meaningful-documentation

Checks parameter domains and row widths, not arbitrary caller-supplied numeric correctness; immutable prepared data remains the producer premise.

## @evidence contracts/development/implementation.md#efficient-algorithms

O(log L) bracketing and constant map/weight work avoid eager O(W) coefficient combination.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The returned preparation shares stored endpoint jets across every phase read at the station.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns fixed-size weight rows and borrowed endpoints; no module cache retains the chain.

# src/geometry/construction/AutoMovieLoftCoefficientSource.ts#AutoMovieLoftCoefficientSource.weights

## @evidence contracts/development/implementation.md#principled-implementation

Converts parameter weights by dq/ds and d2q/ds2 for both derivative orders; value weights remain finite at the pole.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The existing lazy/eager Hermite consumers use the same six-weight array representation.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A singular physical derivative request throws instead of producing a finite endpoint Taylor jet.

## @evidence contracts/development/common.md#meaningful-documentation

Order zero reads the finite value; orders one/two require the prepared finite forward 2-jet.

## @evidence contracts/development/implementation.md#efficient-algorithms

Six fixed scalar combinations take constant work and storage.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses the station's prepared parameter basis and map derivatives across all controls.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns weights and retains no span or chain.
