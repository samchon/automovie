# src/geometry/IAutoMovieFitSubdivisionRegions.ts#IAutoMovieFitSubdivisionRegions.IProps.regions

## @evidence contracts/development/common.md#meaningful-documentation

The property describes the disjoint source-face regions and the exact zero-region behavior.

# src/geometry/IAutoMovieFitSubdivisionRegions.ts#IAutoMovieFitSubdivisionRegions.IProps.levels

## @evidence contracts/development/common.md#meaningful-documentation

The property states the requested whole refinement count, range 2 through 6, and default of 2. The fitter rejects fractional and nonfinite counts before building a cage.

# src/geometry/IAutoMovieFitSubdivisionRegions.ts#IAutoMovieFitSubdivisionRegions.IRegion

## @evidence contracts/development/common.md#meaningful-documentation

The record defines borrowed source identities and separates generating samples, limit targets and fixed original controls.

## @evidence contracts/development/design.md#principled-representation

The fitter checks whole source-face ordinals, disjoint region ownership and finite cage and constraint values before composing local control solves. It preserves global vertex identities and returns only finite solved values.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The region carries only its authorized source faces and control constraints. Shared support and UV refinement remain owned by the joined cage.

# src/geometry/IAutoMovieFitSubdivisionRegions.ts#IAutoMovieFitSubdivisionRegions.IRegion.faces

## @evidence contracts/development/common.md#meaningful-documentation

The set identifies allowed source faces and preserves disjoint interior ownership.

# src/geometry/IAutoMovieFitSubdivisionRegions.ts#IAutoMovieFitSubdivisionRegions.IRegion.samples

## @evidence contracts/development/common.md#meaningful-documentation

The map supplies frozen metric samples in local metres and falls back to source positions for omitted keys.

# src/geometry/IAutoMovieFitSubdivisionRegions.ts#IAutoMovieFitSubdivisionRegions.IRegion.limitTargets

## @evidence contracts/development/common.md#meaningful-documentation

The map specifies independently imposed local-metre limit equations for selected source vertices.

# src/geometry/IAutoMovieFitSubdivisionRegions.ts#IAutoMovieFitSubdivisionRegions.IRegion.anchors

## @evidence contracts/development/common.md#meaningful-documentation

The set identifies controls pinned to original positions, alongside the support collar selected by the fitter.
