# src/gym/createBoxingGlove.ts#createBoxingGlove

## @evidence contracts/development/implementation.md#principled-implementation

A fist box of the IBA appendix's length and height at the drawn width, and a cuff box behind it of the appendix's cuff length, narrower by the proportion its figure draws; the mass is one of the rules' three glove weights, whole.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Pick the weight, draw the dimensions, two parts, two contacts.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No thumb and no lacing, so one model serves either hand; the cuff's narrowing is a construction proportion read off the appendix's figure.

## @evidence contracts/development/implementation.md#efficient-algorithms

Two parts.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each call builds one independent model.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

## @evidence contracts/development/common.md#meaningful-documentation

States how the glove lies, where the hand goes in and which face strikes.
