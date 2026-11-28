# src/recovery/IAutoMovieRecoverySourceCell.ts#IAutoMovieRecoverySourceCell

## @evidence contracts/development/common.md#meaningful-documentation

The cell identifies original face ownership, abstract contact dimension, physical rank, scalar and boundary strata, nodes and topology assignment.

## @evidence contracts/development/design.md#principled-representation

Clip original triangle corner occurrences against each scalar bound. Abstract clipping dimension stays distinct from whether the registered source triangle is collinear or collapsed.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The clipper owns cell IDs and raw polygon nodes. Topology later writes component and orientation evidence for eligible dimension-two cells.

# src/recovery/IAutoMovieRecoverySourceCell.ts#IAutoMovieRecoverySourceCell.id

## @evidence contracts/development/common.md#meaningful-documentation

The clipper assigns the next result cell index as each nonempty candidate is retained.

# src/recovery/IAutoMovieRecoverySourceCell.ts#IAutoMovieRecoverySourceCell.face

## @evidence contracts/development/common.md#meaningful-documentation

Each candidate with nonempty scalar clipping yields one cell with its original face address.

# src/recovery/IAutoMovieRecoverySourceCell.ts#IAutoMovieRecoverySourceCell.dimension

## @evidence contracts/development/common.md#meaningful-documentation

A lone boundary-touching corner gives zero, a touching pair one, and a retained polygon two.

# src/recovery/IAutoMovieRecoverySourceCell.ts#IAutoMovieRecoverySourceCell.sourceGeometryRank

## @evidence contracts/development/common.md#meaningful-documentation

Source preparation records physical rank before clipping, independently of scalar contact dimension.

# src/recovery/IAutoMovieRecoverySourceCell.ts#IAutoMovieRecoverySourceCell.scalarKind

## @evidence contracts/development/common.md#meaningful-documentation

The clipper distinguishes strictly varying faces from flat source levels and lower-dimensional boundary contacts.

# src/recovery/IAutoMovieRecoverySourceCell.ts#IAutoMovieRecoverySourceCell.stratum

## @evidence contracts/development/common.md#meaningful-documentation

Cells at a single admitted plane have a plane address. Other clipped cells carry the two original query bounds.

# src/recovery/IAutoMovieRecoverySourceCell.ts#IAutoMovieRecoverySourceCell.nodes

## @evidence contracts/development/common.md#meaningful-documentation

The clipper retains raw node order, including repeated occurrences that witness collapsed incidence.

# src/recovery/IAutoMovieRecoverySourceCell.ts#IAutoMovieRecoverySourceCell.component

## @evidence contracts/development/common.md#meaningful-documentation

Connectivity assigns only dimension-two cells to components. Contact membership is reported independently.

# src/recovery/IAutoMovieRecoverySourceCell.ts#IAutoMovieRecoverySourceCell.orientationFlip

## @evidence contracts/development/common.md#meaningful-documentation

Topology publishes the flip only for a manifold orientable component.
