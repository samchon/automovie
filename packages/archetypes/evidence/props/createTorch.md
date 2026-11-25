# src/props/createTorch.ts#createTorch

## @evidence contracts/development/implementation.md#principled-implementation

A barrel rod of the model's length and diameter and a head rod of the maker's head diameter at its top, the switch a point on the barrel's side below the head.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Pick the model, two parts, three contacts.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The switch is a contact on the barrel, not a part; the head's size and the switch's travel are named estimates.

## @evidence contracts/development/implementation.md#efficient-algorithms

Two parts.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each call builds one independent model.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

## @evidence contracts/development/common.md#meaningful-documentation

States how the torch stands and its three contacts.
