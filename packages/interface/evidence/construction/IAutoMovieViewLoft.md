# src/construction/IAutoMovieViewLoft.ts#IAutoMovieViewLoft.IResult

## @evidence contracts/development/design.md#principled-representation

Separates the final loft chain/surface from admitted sections, source diagnostics and the declared phase/station continuity.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Nullable final geometry and retained sections/diagnostics express partial and total admission failures.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A missing chain remains null; surviving sections are not described as the complete original source curve.

## @evidence contracts/development/common.md#meaningful-documentation

Members state null cases, section identity and continuity.

# src/construction/IAutoMovieViewLoft.ts#IAutoMovieViewLoft.IStation

## @evidence contracts/development/design.md#principled-representation

Stores one admitted section with its station and actual input plane, before final coefficient/frame interpolation.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Station, frame and section preserve the section owner's inputs and result.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Does not claim an emitted section exists at a failed station or closing pole.

## @evidence contracts/development/common.md#meaningful-documentation

Members distinguish source station units, plane and admitted section.

# src/construction/IAutoMovieViewLoft.ts#IAutoMovieViewLoft.IChainStation

## @evidence contracts/development/common.md#meaningful-documentation

Members distinguish source station units, plane and the chain with its join curvatures.

## @evidence contracts/development/design.md#principled-representation

Stores one admitted conic chain with its physical station and exact input plane.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The loft result exposes its split station to the compatibility layer and inspection alongside ordinary section stations.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Only an admitted chain is stored and its individual arc geometry remains available.
