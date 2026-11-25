# src/geometry/IAutoMoviePlanarRegionFailure.ts#IAutoMoviePlanarRegionFailure.IProps

## @evidence contracts/development/design.md#principled-representation

Coordinates use local x/y metres; either ring winding is accepted and holes are explicitly distinguished from the outer ring.

## @evidence contracts/development/design.md#minimal-and-owned-surface

autoMoviePlanarRegionFailure is the shared hygiene gate for region triangulation and footprint decomposition.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The gate reports the first ring, crossing or containment defect instead of repairing geometry; the label changes diagnostics only.

## @evidence contracts/development/common.md#meaningful-documentation

Borrowed rings checked for one unambiguous bounded planar region. Coordinates use local x/y metres; either ring winding is accepted and holes are explicitly distinguished from the outer ring.
