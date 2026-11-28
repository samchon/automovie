# src/recovery/IAutoMovieRecoverySlabGraph.ts#IAutoMovieRecoverySlabGraph.Observe

## @evidence contracts/development/common.md#meaningful-documentation

The one-shot graph consumes original face supports, scalar bounds, clipped candidate faces and optional probe supports. Its result keeps unsupported identities alongside ordinary groups.

## @evidence contracts/development/design.md#principled-representation

A source face is active when its height range crosses the open interval. Canonical vertices and edges in that interval join active faces, with recorded nonmanifold or degenerate incidence.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The graph owns local source connectivity and reported support. The caller supplies face completeness and selects any subsequent surface interpretation.

# src/recovery/IAutoMovieRecoverySlabGraph.ts#IAutoMovieRecoverySlabGraph.Prepare

## @evidence contracts/development/common.md#meaningful-documentation

The prepared callable separates once-validated source arrays from each query's physical interval, face candidates and boundary supports.

## @evidence contracts/development/design.md#principled-representation

Preparation validates the original triangle and vertex address spaces. Repeated queries reuse source geometry and build only local clipped connectivity.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Prepared operations borrow the authored source. Queries own their local unions and result group memberships.
