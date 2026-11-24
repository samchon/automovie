# src/geometry/construction/AutoMovieConstructionProfileGrid.ts#AutoMovieConstructionProfileGrid

## @evidence contracts/development/common.md#meaningful-documentation

States millimetre tolerance, original guide marks, indexed sample layout, the sampled criterion and resource/depth failures.

## @evidence contracts/development/design.md#principled-representation

The create operation derives IAutoMovieConstructionProfileGrid.IGrid records from prepared original Point0 readers under a positive millimetre chord tolerance.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime grid derivation stays here; interface owns the grid consumed by body assembly and Human source preparation.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The public surface reuses canonical prepared-profile and grid contracts; tessellation samples do not replace original curves or certify whole-domain geometry.

# src/geometry/construction/AutoMovieConstructionProfileGrid.ts#AutoMovieConstructionProfileGrid.create

## @evidence contracts/development/common.md#meaningful-documentation

Documents the member contract in its own summary: Derive grids from original Point0; malformed or unresolved requests produce no partial output.

## @evidence contracts/development/implementation.md#principled-implementation

Implements the documented behavior (Derive grids from original Point0; malformed or unresolved requests produce no partial output) directly over its typed inputs (`prepared`, `tolerance`) as a single pass (for-of over prepared.definition.loops), delegating to `Number.isFinite`, `fail`, `result.push`, `grid`; the premises are the units, frames and ranges stated in its parameter documentation, enforced only where the body performs no validation and relies on its callers. Apart from structural 0, 1 and 2 the body uses no numeric literal.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One operation of 10 lines and 4 top-level statements that reuses `Number.isFinite`, `fail`, `result.push`, `grid` from their owners instead of copying them; it adds no option, layer or abstraction beyond its documented parameters.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Scanning the body finds no `any`, type assertion, non-null assertion, suppression directive or TODO, and no branch keyed on a consumer, fixture or expected answer; values come from its parameters.

## @evidence contracts/development/implementation.md#efficient-algorithms

Cost is driven by the sizes of `prepared`, `tolerance`; the dominant cost is a single pass (for-of over prepared.definition.loops), performed once per call with 1 allocation site (literals and constructed values). No speedup is claimed and none is measured.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Each level evaluates its complete rectangular sample domain once. The chord and boundary observations reuse the same numeric rows by index.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

The function acquires no handle, timer, listener or task and keeps no state between calls; its 1 allocation site become the returned value or die with the call, so nothing grows.
