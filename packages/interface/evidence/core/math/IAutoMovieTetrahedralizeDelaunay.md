# src/core/math/IAutoMovieTetrahedralizeDelaunay.ts#IAutoMovieTetrahedralizeDelaunay.IMesh

## @evidence contracts/development/design.md#principled-representation

Each four-index tuple addresses returned joggled world-metre points and has positive orientation on those points.

## @evidence contracts/development/design.md#minimal-and-owned-surface

tetrahedralizeAutoMovieDelaunay publishes both connectivity and the actual points it triangulated so consumers do not reuse the unjoggled input accidentally.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Readonly arrays prevent mutation through this view; tuple shape cannot prove index bounds, orientation or the Delaunay property, which the producer owns.

## @evidence contracts/development/common.md#meaningful-documentation

States index ownership, joggled-coordinate authority, world metres and positive orientation.
