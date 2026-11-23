# src/recovery/computation/IAutoMovieRecoverySourceComponent.ts#IAutoMovieRecoverySourceComponent

## @evidence contracts/development/common.md#meaningful-documentation

Edge-connected two-dimensional source cells with independently reported topology. Query-local cell and face lists retain source ownership; topology may be unresolved and classification remains literally unclassified. Boundary cycles retain directed occurrence order.

## @evidence contracts/development/design.md#principled-representation

Query-local cell and face lists retain source ownership; topology may be unresolved and classification remains literally unclassified. Boundary cycles retain directed occurrence order.

## @evidence contracts/development/design.md#minimal-and-owned-surface

RecoveryEventRegionTopology owns component construction; atlas chart preparation consumes its face population and topology qualifications.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Connectivity does not classify a regular/event chart or repair nonmanifold incidence; unresolved boundaries and issue references remain explicit.
