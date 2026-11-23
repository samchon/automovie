# src/construction/IAutoMovieSolidZip.ts#IAutoMovieSolidZip

## @evidence contracts/development/design.md#principled-representation

ISequence coindexes mesh vertex IDs and cyclic parameters with period 2pi, preserving boundary order on any branch.

## @evidence contracts/development/design.md#minimal-and-owned-surface

SolidZip uses this representation to connect existing boundary samples, including normalized-arclength clocks.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Number arrays cannot enforce matching lengths, ordering or valid IDs; zipper callers supply admitted sequences.

## @evidence contracts/development/common.md#meaningful-documentation

Distinguishes the cyclic parameter from geometric polar angle.

# src/construction/IAutoMovieSolidZip.ts#IAutoMovieSolidZip.ISequence

## @evidence contracts/development/design.md#principled-representation

Vertex labels and a one-turn scalar correspondence describe one boundary for monotone zipper traversal.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Two parallel arrays preserve mesh identity without copying world positions into this operator.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The type does not enforce equal lengths, finite monotone parameters, distinct vertices or compatible geometry with another boundary.

## @evidence contracts/development/common.md#meaningful-documentation

Names vertex/parameter correspondence and the parameter's 2pi periodic convention.
