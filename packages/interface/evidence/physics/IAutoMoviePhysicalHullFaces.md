# src/physics/IAutoMoviePhysicalHullFaces.ts#IAutoMoviePhysicalHullFaces.IFace

## @evidence contracts/development/common.md#meaningful-documentation

Gives the outward plane convention and boundary winding in the hull's local frame.

## @evidence contracts/development/design.md#principled-representation

A unit normal, metre signed plane offset and counter-clockwise metre vertices represent one convex supporting face.

## @evidence contracts/development/design.md#minimal-and-owned-surface

physicalHullFaces supplies these planes and loops to hull mass, containment and nearest-surface calculations.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The producer constructs the boundary ordering; arbitrary vector arrays cannot establish convexity or unit normals by type alone.

# src/physics/IAutoMoviePhysicalHullFaces.ts#IAutoMoviePhysicalHullFaces.IHull

## @evidence contracts/development/common.md#meaningful-documentation

Defines face/corner populations, local centre and the distinct radius, depth, burial and tolerance measurements.

## @evidence contracts/development/design.md#principled-representation

Shape-local metre geometry carries a containing radius and inscribed depth; empty faces denote a point set spanning no volume.

## @evidence contracts/development/design.md#minimal-and-owned-surface

physicalHullFaces owns this shared hull analysis used by mass-property admission and nearest-surface readers.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Burial is measured against actual input points; tolerance is extent-derived, and a degenerate hull does not receive invented volume.
