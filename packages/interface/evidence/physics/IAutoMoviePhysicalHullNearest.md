# src/physics/IAutoMoviePhysicalHullNearest.ts#IAutoMoviePhysicalHullNearest.IResult

## @evidence contracts/development/common.md#meaningful-documentation

Signed nearest-surface reading for a query in a convex hull's own frame.

## @evidence contracts/development/design.md#principled-representation

distance is metres, negative inside and zero on the surface; point and unit normal are shape-local.

## @evidence contracts/development/design.md#minimal-and-owned-surface

physicalHullNearest allocates the point but may borrow a normal from its cached hull faces; callers must treat the returned normal as read-only.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The producer requires a volumetric hull. Interior queries use the nearest face; outside edge queries use the direction toward the query, with a face-normal fallback near zero distance.
