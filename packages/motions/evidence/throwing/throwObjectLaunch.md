# src/throwing/throwObjectLaunch.ts#throwObjectLaunch.held

## @evidence contracts/development/common.md#meaningful-documentation

States the window's span and the empty-handed case.

## @evidence contracts/development/implementation.md#principled-implementation

A held object keeps its grip until the hand releases it, so the grip window runs from the throw's start to its release.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One record or none.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No window is written for an empty hand.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/throwing/throwObjectLaunch.ts#throwObjectLaunch.launches

## @evidence contracts/development/common.md#meaningful-documentation

States what is published, the attitude's absent case and the empty-handed case.

## @evidence contracts/development/implementation.md#principled-implementation

The prop leaves with the launch's own point, velocity and instant, the state its catcher reads.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One record or none.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Nothing is launched for an empty hand.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/throwing/throwObjectLaunch.ts#throwObjectLaunch.aimed

## @evidence contracts/development/common.md#meaningful-documentation

States the equation, its terms and when it has no solution.

## @evidence contracts/development/implementation.md#principled-implementation

The range equation under the engine's standard gravity, the model the flight then follows (`projectileAt`).

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The distance, the lift, the speed and its components.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

An unreachable target returns undefined for the caller's refusal, never a clamped speed.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The one aimed launch the throw and the throw-in solve (`throwObject`, `ballSport`).

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/throwing/throwObjectLaunch.ts#throwObjectLaunch.path

## @evidence contracts/development/common.md#meaningful-documentation

States the timebase and the frame.

## @evidence contracts/development/implementation.md#principled-implementation

Constant gravity along -Y without drag, the model the launch is aimed in.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One delegation.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The launch's own path, with no fitted correction.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The flight's closed form is the engine's `projectileAt`.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.
