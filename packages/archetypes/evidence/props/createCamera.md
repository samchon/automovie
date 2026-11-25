# src/props/createCamera.ts#createCamera

## @evidence contracts/development/implementation.md#principled-implementation

Keep the camera's case, grip bar and lens barrel with the grasp, support, viewing and shutter contacts.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Draw case dimensions using the saved device namespace and build the named contacts.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Use the device's measured model or recorded bands. Keep the existing distinctions between part geometry and its contacts.

## @evidence contracts/development/implementation.md#efficient-algorithms

Builds at most three parts and five contacts.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The producer uses the common device draw.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Each call returns a complete model and retains no inputs.

## @evidence contracts/development/common.md#meaningful-documentation

Describes the device, its frame and the exposed contacts.
