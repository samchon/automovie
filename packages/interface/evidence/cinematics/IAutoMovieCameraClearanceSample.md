# src/cinematics/IAutoMovieCameraClearanceSample.ts#IAutoMovieCameraClearanceSample

## @evidence contracts/development/design.md#principled-representation

Shot-local seconds align the resolved world camera transform with every obstacle box; evaluateCameraClearance requires strict time order and unchanged obstacle identity sets.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The compiler supplies one camera/obstacle snapshot per required instant and the evaluator borrows it for adjacent-interval sweeps.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A snapshot does not prove continuous motion between instants; scale and interpolation assumptions belong to the supplied take.

## @evidence contracts/development/common.md#meaningful-documentation

States the shared instant, world transform and complete obstacle population.
