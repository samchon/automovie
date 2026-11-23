# src/production/IAutoMovieShotContractSubjectReader.ts#IAutoMovieShotContractSubjectReader

## @evidence contracts/development/design.md#principled-representation

Each method is a read of the compiled artifacts at one instant: a node's placement is its staged transform overridden by the object-motion authority sampled at that instant, with its posed root folded in by `foldRoot`; a formation is its compiled centroid carried by its sampled cue; a node box is `nodeSubjectBox` over the same `nodeSubjectExtent` the camera solve framed from; throwing on an unresolvable reference is what lets the grade fail it instead of substituting a default.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Exposes only what the predicate grade, the camera grade and the participant checks read, so the index maps and caches are built once and the graders never repeat an id scan or pass the props record around to private helpers.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No subject, model or formation is special-cased; a formation is recognized only by its design entry, and the first-record rule applies to every table alike rather than being chosen for any fixture.

## @evidence contracts/development/common.md#meaningful-documentation

States the producer and its lifetime, the duplicate-id rule, how a node is placed, and the throw-to-fail contract; each member states what it reads, its unit and clock, and when it throws.
