# src/scene/IAutoMovieCameraClearanceSphere.ts#IAutoMovieCameraClearanceSphere

## @evidence contracts/development/design.md#principled-representation

Finite local center and positive authored radius define a sphere transformed by sampled camera placement. Hardware enclosure is an author premise; continuous center motion and obstacle coverage need the evaluator's separate interval assumptions.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Center offset accommodates asymmetric bodies and rear mounts using one portable primitive rather than renderer meshes.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Radius is authored physical extent and does not shrink with view orientation or get inferred from the optical near plane.

## @evidence contracts/development/common.md#meaningful-documentation

Defines camera-local meter center, positive conservative radius and the asymmetrical placement purpose.
