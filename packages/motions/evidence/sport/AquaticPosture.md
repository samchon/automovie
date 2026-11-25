# src/sport/AquaticPosture.ts#AquaticPosture.markers

## @evidence contracts/development/common.md#meaningful-documentation

Identifies the fixed demand and the displayed result.

## @evidence contracts/development/implementation.md#principled-implementation

Demands the same canonical joint constraints and limb fits used by the displayed pose.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Builds one set and one prepared FK reader.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The limb solver retains its documented prerequisites for requested bones.

## @evidence contracts/development/implementation.md#efficient-algorithms

Each observation projects only the requested FK paths and shares one canonical posture resolution across them.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The fixed body and bone demand are prepared once per producer.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Retains only the prepared demand and its body. Each result belongs to the caller.
