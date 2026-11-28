# src/geometry/IAutoMovieHoldSurfaceGirths.ts#IAutoMovieHoldSurfaceGirths.IProps

## @evidence contracts/development/common.md#meaningful-documentation

Rest cage topology, shared sweep rigs and rest reevaluation needed to hold declared limit ring perimeters.

## @evidence contracts/development/design.md#principled-representation

The solver integrates each regular limit ring and solves the coupled scale factors by iterative secant updates across repeated rest fits.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The solver borrows the network, cage and rest callback. It installs factors through the selected sweep rigs and writes the caller's rest buffer.

# src/geometry/IAutoMovieHoldSurfaceGirths.ts#IAutoMovieHoldSurfaceGirths.IProps.network

## @evidence contracts/development/common.md#meaningful-documentation

Read-only rest network whose rings with declared perimeter select the solve targets. Each selected ring belongs to one sweep and one station.

# src/geometry/IAutoMovieHoldSurfaceGirths.ts#IAutoMovieHoldSurfaceGirths.IProps.rings

## @evidence contracts/development/common.md#meaningful-documentation

Ring names mapped to ordered closed-loop cage vertex ordinals. Each vertex addresses three scalars in the position buffer.

# src/geometry/IAutoMovieHoldSurfaceGirths.ts#IAutoMovieHoldSurfaceGirths.IProps.faces

## @evidence contracts/development/common.md#meaningful-documentation

Borrowed cage face vertex lists used to identify the regular row neighbourhood for limit measurements.

# src/geometry/IAutoMovieHoldSurfaceGirths.ts#IAutoMovieHoldSurfaceGirths.IProps.vertices

## @evidence contracts/development/common.md#meaningful-documentation

Cage vertex count governing the index range and the three-scalar position layout.

# src/geometry/IAutoMovieHoldSurfaceGirths.ts#IAutoMovieHoldSurfaceGirths.IProps.sweepRig

## @evidence contracts/development/common.md#meaningful-documentation

Return the same sealed rig for each existing network sweep name on successive calls. The solver installs its correction on that rig.

# src/geometry/IAutoMovieHoldSurfaceGirths.ts#IAutoMovieHoldSurfaceGirths.IProps.rest

## @evidence contracts/development/common.md#meaningful-documentation

Reevaluate and fit the network at rest with current girth factors, filling the supplied packed metre control positions.

# src/geometry/IAutoMovieHoldSurfaceGirths.ts#IAutoMovieHoldSurfaceGirths.IProps.positions

## @evidence contracts/development/common.md#meaningful-documentation

Caller-owned writable rest XYZ buffer with three metre scalars per vertex. A failed solve can leave the last evaluated trial in this buffer and the rigs.
