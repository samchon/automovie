# src/geometry/sweep/IAutoMovieRigSurfaceCurve.ts#IAutoMovieRigSurfaceCurve

## @evidence contracts/development/common.md#meaningful-documentation

Metre through points and live endpoint nodes share one model frame, with optional bone-buffer transport of directions. Negative bone or null buffer disables through-data transport; valid nonnegative indices and endpoint finalization remain caller premises.

## @evidence contracts/development/design.md#principled-representation

Metre through points and live endpoint nodes share one model frame, with optional bone-buffer transport of directions.

## @evidence contracts/development/design.md#minimal-and-owned-surface

rigAutoMovieSurfaceCurve is shared by network patch boundaries, bridges and construction observations.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Negative bone or null buffer disables through-data transport; valid nonnegative indices and endpoint finalization remain caller premises.

# src/geometry/sweep/IAutoMovieRigSurfaceCurve.ts#IAutoMovieRigSurfaceCurve.IProps

## @evidence contracts/development/design.md#principled-representation

Endpoint writers and through points share model metres; optional bone transport rotates declared directions. Nonnegative bone indices require a compatible buffer, an unchecked kernel premise.

## @evidence contracts/development/design.md#minimal-and-owned-surface

rigAutoMovieSurfaceNetwork supplies its existing nodes and bone buffer; the curve rig is reused by patch edges, bridges and construction observations.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

bone<0 or bones=null means fixed through data while endpoint motion remains independent; the pair permits redundant disabled states, which the implementation handles explicitly.

## @evidence contracts/development/common.md#meaningful-documentation

Gives copied declarations, retained endpoint records, finalization and update order, and index/absence behavior.
