# src/furniture/createTable.ts#createTable

## @evidence contracts/development/implementation.md#principled-implementation

A top slab at the drawn height on legs or a plinth; the top is declared twice, as the `surface` a person works and leans at and as the `stack-top` an object is set on, and each edge is a `ledge` facing out.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Draw the dimensions and pick a listed size, build the top and its support, then the top's contacts and the four edges.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No drawer or apron. The legs stand with their centres `LEG_INSET` in from the top's edges and are `LEG_RADIUS` round, so the top overhangs their outer faces by the difference on every side, and an altar's pedestals stand `LEG_INSET` in from the top's ends; a counter's and a service counter's top overhangs its base by `COUNTER_OVERHANG` at the front and a bar counter's by the guideline's knee space, each base flush with the top at the back and at both ends. A pupil desk's top is its sheet's 5/8 in; the others' 40 mm and an altar's pedestals (`ALTAR_PEDESTAL`) are construction estimates no act reads.

## @evidence contracts/development/implementation.md#efficient-algorithms

At most five parts.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each call builds one independent model.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

## @evidence contracts/development/common.md#meaningful-documentation

States what is modelled and which edge is the front.
