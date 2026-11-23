# src/validation/lightClipChannelGate.ts#lightClipChannelGate

## @evidence contracts/development/implementation.md#principled-implementation

Create a gate for canonical light pointers and shared property value types, optionally checking staged light presence and kind.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

LIGHT_CHANNEL_PROPERTIES and parseLightPointer own the accepted/applied property vocabulary and escaping.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A null staged-light map deliberately defers existence/kind checks for stored slices, while syntax and value type remain gated.

## @evidence contracts/development/common.md#meaningful-documentation

The returned closure borrows the map and appends faults at kind, pointer or valueType paths.

## @evidence contracts/development/implementation.md#efficient-algorithms

Pointer length drives parsing/round-trip work; one map lookup follows a fixed property lookup.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Property definitions are shared with lighting application, and each invocation reads the current borrowed map.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The caller owns the closure and any captured map lifetime; the gate starts no host task.
