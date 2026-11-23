# src/service/lowerWetZoneDrainage.ts#lowerWetZoneDrainage

## @evidence contracts/development/implementation.md#principled-implementation

Validated plumbing inlets and waste-water outlets map their declared demand to the containing fluid lattice cell; bed elevation supplies each ordinary floor drain's sill without a second water-motion solver.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Service records compose into the existing fluid domain model, but this lowering's current callers are tests rather than a production wet-zone binding phase.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Unknown zones/drains, off-grid placement and ids shadowing authored entries throw; node kind does not alter hydraulic demand or invent an inlet omission.

## @evidence contracts/development/common.md#meaningful-documentation

States prior network admission, lattice and sill rules, all refusals, current unconsumed status and shallow-copy ownership of unchanged domain data.

## @evidence contracts/development/implementation.md#efficient-algorithms

A system map and node/port scan are linear, but each drain node lookup scans nodes and each derived-id collision check scans authored entries, yielding their product costs without a retained index.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The system lookup is built once for all ports; per-cell placement serves every derived row at a node, and no composition result persists across domain edits.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

New source/drain lists and rows transfer to the caller; untouched domain records remain source aliases, and temporary system/candidate arrays retain no independent simulation state.
