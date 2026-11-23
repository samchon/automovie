# src/vehicles/cartTowing.ts#cartTowing

## @evidence contracts/development/common.md#meaningful-documentation

Names source wheel/steering/pole roles, supported mechanical freedoms, neutral input and independent returned geometry.

## @evidence contracts/development/implementation.md#principled-implementation

The producer knows its own closed affordance roles: two-wheel centres supply the single axle; rear wheel centres plus the frontAxle frame and drawbarPitch hinge describe a grounded four-wheeler.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Admit producer identity, inspect the producer-declared steering role, then delegate wheel-axis admission and snapshot the declared geometry.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No dimensions table rebuilds different centres, no part-distance heuristic or per-kind height offset reaches the generic towing law.

## @evidence contracts/development/implementation.md#efficient-algorithms

O(A) work over A source contacts: one presence scan and a fixed number of linear affordance lookups, with constant auxiliary storage.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

towingAxle owns shared wheel admission; generic towing owns all height/pitch equations.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns independent point/id records and retains no source model or mutable frame alias.
