# src/construction/IAutoMovieConstructionProfileSource.ts#IAutoMovieConstructionProfileSource

## @evidence contracts/development/common.md#meaningful-documentation

The comment distinguishes authored and runtime units and states the source lifetime.

## @evidence contracts/development/design.md#principled-representation

Profile.create copies the pure definition and resolves its frame, original curves and optional trims by identity. Its retained charts evaluate those same functions.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The source provides only the actual function families needed to prepare profiles. Tessellation and final body publication stay with their own consumers.

# src/construction/IAutoMovieConstructionProfileSource.ts#IAutoMovieConstructionProfileSource.definition

## @evidence contracts/development/common.md#meaningful-documentation

The comment identifies the reference record used by invocation matching and preparation.

# src/construction/IAutoMovieConstructionProfileSource.ts#IAutoMovieConstructionProfileSource.plane

## @evidence contracts/development/common.md#meaningful-documentation

The comment identifies the key and frame capabilities required by different queries.

# src/construction/IAutoMovieConstructionProfileSource.ts#IAutoMovieConstructionProfileSource.curves

## @evidence contracts/development/common.md#meaningful-documentation

The comment identifies how retained pieces resolve to actual geometry.

# src/construction/IAutoMovieConstructionProfileSource.ts#IAutoMovieConstructionProfileSource.regions

## @evidence contracts/development/common.md#meaningful-documentation

The comment identifies when live region owners are needed.

# src/construction/IAutoMovieConstructionProfileSource.ts#IAutoMovieConstructionProfileSource.IRegion

## @evidence contracts/development/common.md#meaningful-documentation

The comment identifies the scope, units and retention premise of a region owner.

## @evidence contracts/development/design.md#principled-representation

Profile.create resolves the declared trim and checks its station coverage. Contains then calls its actual predicate using the piece's original curve clock.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The region provides membership and optional exact interval observations. The prepared query can test a region without fitting a boundary.

# src/construction/IAutoMovieConstructionProfileSource.ts#IAutoMovieConstructionProfileSource.IRegion.domain

## @evidence contracts/development/common.md#meaningful-documentation

The comment identifies the range compared with the region's authored active interval.

# src/construction/IAutoMovieConstructionProfileSource.ts#IAutoMovieConstructionProfileSource.IRegion.contains

## @evidence contracts/development/common.md#meaningful-documentation

The comment gives both coordinates and error ownership.

# src/construction/IAutoMovieConstructionProfileSource.ts#IAutoMovieConstructionProfileSource.IRegion.intervals

## @evidence contracts/development/common.md#meaningful-documentation

The comment distinguishes empty, null and missing capability and identifies result ownership.

# src/construction/IAutoMovieConstructionProfileSource.ts#IAutoMovieConstructionProfileSource.IPhase

## @evidence contracts/development/common.md#meaningful-documentation

The comment explains the original clock and capability at a sided or value-limited location.

## @evidence contracts/development/design.md#principled-representation

ProfilePhase reads the actual phase callback, or the complete jet when phase is absent, then maps the returned local pairs through the fixed station frame.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The phase representation supplies the fixed-station observation and leaves complete station derivatives to IJet.

# src/construction/IAutoMovieConstructionProfileSource.ts#IAutoMovieConstructionProfileSource.IPhase.p

## @evidence contracts/development/common.md#meaningful-documentation

The comment gives the local point frame and units.

# src/construction/IAutoMovieConstructionProfileSource.ts#IAutoMovieConstructionProfileSource.IPhase.t

## @evidence contracts/development/common.md#meaningful-documentation

The comment gives the phase coordinate of the tangent.

# src/construction/IAutoMovieConstructionProfileSource.ts#IAutoMovieConstructionProfileSource.IPhase.tt

## @evidence contracts/development/common.md#meaningful-documentation

The comment identifies the derivative scale and absent result.

# src/construction/IAutoMovieConstructionProfileSource.ts#IAutoMovieConstructionProfileSource.IJet

## @evidence contracts/development/common.md#meaningful-documentation

The comment names both independent coordinates, frame and derivative scope.

## @evidence contracts/development/design.md#principled-representation

ConstructionProfileSurface receives the six local pairs, rescales the phase derivatives for the piece's normalized coordinate and applies the world frame product rule.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The jet reuses local vector tuples for all derivative orders. Curve and frame owners remain independently responsible for their derivatives.

# src/construction/IAutoMovieConstructionProfileSource.ts#IAutoMovieConstructionProfileSource.IJet.p

## @evidence contracts/development/common.md#meaningful-documentation

The comment identifies the original local value.

# src/construction/IAutoMovieConstructionProfileSource.ts#IAutoMovieConstructionProfileSource.IJet.s

## @evidence contracts/development/common.md#meaningful-documentation

The comment specifies the first physical station scale.

# src/construction/IAutoMovieConstructionProfileSource.ts#IAutoMovieConstructionProfileSource.IJet.t

## @evidence contracts/development/common.md#meaningful-documentation

The comment specifies the first curve clock scale.

# src/construction/IAutoMovieConstructionProfileSource.ts#IAutoMovieConstructionProfileSource.IJet.ss

## @evidence contracts/development/common.md#meaningful-documentation

The comment identifies the twice-station derivative scale.

# src/construction/IAutoMovieConstructionProfileSource.ts#IAutoMovieConstructionProfileSource.IJet.st

## @evidence contracts/development/common.md#meaningful-documentation

The comment identifies both axes of the mixed term.

# src/construction/IAutoMovieConstructionProfileSource.ts#IAutoMovieConstructionProfileSource.IJet.tt

## @evidence contracts/development/common.md#meaningful-documentation

The comment identifies the original phase curvature coordinate.

# src/construction/IAutoMovieConstructionProfileSource.ts#IAutoMovieConstructionProfileSource.ICurve

## @evidence contracts/development/common.md#meaningful-documentation

The comment explains ownership, lifetime and the relationship among the three available capabilities.

## @evidence contracts/development/design.md#principled-representation

Profile preparation checks coverage and uses the referenced owner for both retained and original surface charts. Query wrappers map station and clock to the same underlying curve callbacks.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The curve carries only its validity intervals, optional period and actual function capabilities. The prepared profile owns chart restriction and world mapping.

# src/construction/IAutoMovieConstructionProfileSource.ts#IAutoMovieConstructionProfileSource.ICurve.domain

## @evidence contracts/development/common.md#meaningful-documentation

The comment identifies station coverage required of the live curve.

# src/construction/IAutoMovieConstructionProfileSource.ts#IAutoMovieConstructionProfileSource.ICurve.clock

## @evidence contracts/development/common.md#meaningful-documentation

The comment identifies the clock span to which each piece is restricted.

# src/construction/IAutoMovieConstructionProfileSource.ts#IAutoMovieConstructionProfileSource.ICurve.period

## @evidence contracts/development/common.md#meaningful-documentation

The comment states when the optional period changes coverage.

# src/construction/IAutoMovieConstructionProfileSource.ts#IAutoMovieConstructionProfileSource.ICurve.point

## @evidence contracts/development/common.md#meaningful-documentation

The comment distinguishes position availability from complete physical derivatives.

# src/construction/IAutoMovieConstructionProfileSource.ts#IAutoMovieConstructionProfileSource.ICurve.phase

## @evidence contracts/development/common.md#meaningful-documentation

The comment specifies the exact fallback and two separate absence cases.

# src/construction/IAutoMovieConstructionProfileSource.ts#IAutoMovieConstructionProfileSource.ICurve.jet

## @evidence contracts/development/common.md#meaningful-documentation

The comment identifies both derivative prerequisites and the absent result.
