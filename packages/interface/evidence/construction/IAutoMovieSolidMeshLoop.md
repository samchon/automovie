# src/construction/IAutoMovieSolidMeshLoop.ts#IAutoMovieSolidMeshLoop.Classifier

## @evidence contracts/development/design.md#principled-representation

u and v retain the surface chart units, jet is evaluated there, and margin is a world-mm distance used by the trim metric.

## @evidence contracts/development/design.md#minimal-and-owned-surface

SolidMeshLoop.prepare returns this reader to grid sampling; its closure owns any prepared loop snapshots until released.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A boolean preserves kept/rejected membership without inventing a new source boundary; unchanged source data and valid metric are caller premises.

## @evidence contracts/development/common.md#meaningful-documentation

Specifies query coordinate/jet agreement, physical margin and prepared-reader lifetime.
