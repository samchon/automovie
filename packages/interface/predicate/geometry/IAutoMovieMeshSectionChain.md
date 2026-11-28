# src/geometry/IAutoMovieMeshSectionChain.ts#IAutoMovieMeshSectionChain

## @evidence contracts/development/common.md#meaningful-documentation

One oriented, closed or open piece of a section, projected to the two in-plane axes.

## @evidence contracts/development/design.md#principled-representation

Extraction joins segments through their crossing-edge identities and projects the resulting order to the station chart.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The piece owns its ordered chart point sequence and closure bit. The cut supplies station and diagnostics.

# src/geometry/IAutoMovieMeshSectionChain.ts#IAutoMovieMeshSectionChain.points

## @evidence contracts/development/common.md#meaningful-documentation

Ordered chart points in millimetres from the station centre. The raw chain walk merges adjacent projected crossings within 1e-9 mm and omits a repeated close.

# src/geometry/IAutoMovieMeshSectionChain.ts#IAutoMovieMeshSectionChain.closed

## @evidence contracts/development/common.md#meaningful-documentation

True when the chain closes in the segment walk or enclosing bridge pass. Open chains expose unmatched segment ends.
