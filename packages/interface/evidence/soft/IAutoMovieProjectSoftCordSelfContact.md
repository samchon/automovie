# src/soft/IAutoMovieProjectSoftCordSelfContact.ts#IAutoMovieProjectSoftCordSelfContact.IProps

## @evidence contracts/development/common.md#meaningful-documentation

States packed-buffer units, weighted normal/friction projection, grid lifetime, skipped/coincident cases and discrete-contact limits.

## @evidence contracts/development/design.md#principled-representation

Sequential particle indices define segments and world-metre triples define their geometry; kg^-1 masses and dimensionless friction control corrections, with admission left to the caller.

## @evidence contracts/development/design.md#minimal-and-owned-surface

simulateSoftBodyCore supplies the existing start/predicted buffers plus count and contact coefficients for each requested cord sweep.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A one-dimensional particle order is the cord topology; no sheet contact or continuous collision guarantee is hidden behind this buffer shape.
