# src/construction/IAutoMovieLoftPhaseSource.ts#IAutoMovieLoftPhaseSource.ISource

## @evidence contracts/development/common.md#meaningful-documentation

The comment relates the conic and coefficient indices, the independent coordinate and the reason to keep native functions.

## @evidence contracts/development/design.md#principled-representation

LoftPhaseSource.prepare checks the matching curve count, at least two increasing coordinates of representable width and admitted four-quarter curve data. It computes natural spline derivatives on the identity matrix so each basis weight belongs to a source function.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The interpolation reuses ViewConic for scalar phase reads and StationHermite for coordinate weights. It adds a function-valued comparison operator that is separate from production chain ownership.

# src/construction/IAutoMovieLoftPhaseSource.ts#IAutoMovieLoftPhaseSource.ISource.coordinates

## @evidence contracts/development/common.md#meaningful-documentation

The comment states the coordinate choices and shared index order.

# src/construction/IAutoMovieLoftPhaseSource.ts#IAutoMovieLoftPhaseSource.ISource.curves

## @evidence contracts/development/common.md#meaningful-documentation

The comment fixes the source quantity units and its correspondence with the coordinate array.

# src/construction/IAutoMovieLoftPhaseSource.ts#IAutoMovieLoftPhaseSource.ISource.slopes

## @evidence contracts/development/common.md#meaningful-documentation

The comment identifies the two matrix axes and derivative order.

# src/construction/IAutoMovieLoftPhaseSource.ts#IAutoMovieLoftPhaseSource.ISource.curvatures

## @evidence contracts/development/common.md#meaningful-documentation

The comment specifies how the curvature basis aligns with the slope basis.

# src/construction/IAutoMovieLoftPhaseSource.ts#IAutoMovieLoftPhaseSource.IStation

## @evidence contracts/development/common.md#meaningful-documentation

The comment sets the intended use of the station preparation and the optional physical conversion.

## @evidence contracts/development/design.md#principled-representation

LoftPhaseSource.station brackets q within the source coordinates, combines neighboring cardinal endpoint samples and applies the chain rule only when given the forward coordinate derivatives.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The station stores one shared source and the weights needed at the requested coordinate. The phase reader uses them directly and chooses phase later.

# src/construction/IAutoMovieLoftPhaseSource.ts#IAutoMovieLoftPhaseSource.IStation.source

## @evidence contracts/development/common.md#meaningful-documentation

The comment describes which data remain shared across phase evaluation.

# src/construction/IAutoMovieLoftPhaseSource.ts#IAutoMovieLoftPhaseSource.IStation.weights

## @evidence contracts/development/common.md#meaningful-documentation

The comment gives weight row order, column alignment and the condition that changes their derivative coordinate.
