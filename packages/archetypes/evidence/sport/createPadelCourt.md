# src/sport/createPadelCourt.ts#createPadelCourt

## @evidence contracts/development/implementation.md#principled-implementation

Every dimension is the FIP Rules of Padel's (court 20 by 10 m, net 0.88 m at its centre, back walls 3 m, side walls 3 m for 2 m then 2 m for 2 m); the walls' thickness and the net's sheet are provisional construction.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Build the net, the back walls and the four side panels, then record the affordances.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The net is level at its centre height; the mesh is named as left out rather than replaced by glass.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

A fixed number of parts.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each call builds one independent model.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

## @evidence contracts/development/common.md#meaningful-documentation

States the frame, the rules each dimension comes from, what is left out and the affordances.
