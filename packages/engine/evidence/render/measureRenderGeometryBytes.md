# src/render/measureRenderGeometryBytes.ts#measureRenderGeometryBytes

## @evidence contracts/development/common.md#meaningful-documentation

States the phase's base, its fixed order, the flattening padding rules and their units, and the rows it appends.

## @evidence contracts/development/implementation.md#principled-implementation

A flattened buffer carries every attribute for every vertex, so a mix of coloured and bare parts pads the bare vertices with an RGB triple and a mix of relief-weighted and bare parts pads them with one weight, each a 32-bit float, counted once per prototype as the renderer allocates it.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The inventory's geometry memory phase, split from the orchestrator by responsibility; the population phase owns the base buffer bytes it adds to.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The padding follows the buffer layout, not a fitted factor.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the drawn models' parts, after one sort of the drawn model ids.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each inventory runs it once.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Adds padding to the caller's cost records and rows to its sink; it retains nothing.
