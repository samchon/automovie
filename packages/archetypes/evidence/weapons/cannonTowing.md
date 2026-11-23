# src/weapons/cannonTowing.ts#cannonTowing

## @evidence contracts/development/common.md#meaningful-documentation

Names field-gun wheel support, reverse towing at the real trail contact and independent model-space metre output.

## @evidence contracts/development/implementation.md#principled-implementation

The left/right wheel-spin frames define the axle; generic single-axle geometry derives reverse orientation from the source coupling's side of that axle.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Admit the producer-owned kind and delegate the shared axle reader.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A naval four-wheel carriage or mortar is never presented as a free single axle, and no hardcoded pintle offset changes the field gun.

## @evidence contracts/development/implementation.md#efficient-algorithms

O(A) work for two linear affordance lookups over A source contacts, followed by constant axle admission and constant auxiliary storage.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses towingAxle and the generic support solver instead of copying either geometry law.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns independent scalar coordinates and retains no gun/frame reference.
