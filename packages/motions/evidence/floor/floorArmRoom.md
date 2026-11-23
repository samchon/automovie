# src/floor/floorArmRoom.ts#floorArmRoom.prepare

## @evidence contracts/development/implementation.md#principled-implementation

The keys' rooms and the scan are read once per blend; a flagged blend reads each queried posture's rooms and turns an arm only past its allowance.

## @evidence contracts/development/implementation.md#efficient-algorithms

A blend that never leaves its room costs its scan's resolves once (at least `SCAN + 1`) and nothing per query; a flagged one costs one resolve and two room readings per query plus the clearance search where an arm is past its allowance.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Retains, per blend index, two room records and a flag for the law plan's lifetime.
